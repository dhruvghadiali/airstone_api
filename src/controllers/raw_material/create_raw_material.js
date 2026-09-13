const { raw_material_model } = require("@models/raw_material");

const { http_status } = require("@enums");
const { project } = require("@utils/projection");
const { reference_error } = require("@utils/reference_error");
const { send_response, get_response_shape } = require("@helpers/common");
const { is_active_supplier_company_exists } = require("@helpers/company");
const {
  raw_material_messages,
  raw_material_validation_messages,
} = require("@validators/messages");
const {
  raw_material_response,
  run_with_raw_material_duplicate_mapping,
} = require("@helpers/raw_material");

/**
 * Adds a raw material the yard buys and consumes.
 *
 * `created_by` is the signed in caller, taken from the token rather than from
 * the body. The schema refuses a `created_by` field, so there is no way for a
 * caller to record the material against somebody else.
 *
 * Every id in `supplier` is checked against the companies collection before the
 * write. A firm we only sell stone to cannot supply us, so the check reads the
 * company's type as well as whether it is active. The failure names the entry
 * that is wrong, so a caller sending three ids knows which one to fix. Only the
 * first bad id is reported; a caller with two of them will be told again.
 *
 * The material code carries a global unique index and deletes here are soft, so
 * a deactivated material keeps its code reserved. A caller re-entering a code
 * that looks free to them gets a 409 saying so rather than a driver error.
 *
 * The reply expands each supplier into the firm behind it, so a client can
 * render what it just created without a second call.
 *
 * @route   POST /admin/raw-materials
 * @access  Admin
 *
 * @param   {import("express").Request} req
 * @param   {Object} req.body Validated by `create_raw_material_schema`, which
 *                            rejects unknown fields.
 * @param   {string} req.body.material_name  Required. 2-200 chars, trimmed.
 * @param   {string} req.body.material_code  Required. 2-50 chars, uppercase
 *                                           letters, digits and hyphens only.
 *                                           Stored upper case. Unique.
 * @param   {string} req.body.unit           Required. One of bag, gram, litre,
 *                                           piece, kilogram, cubic_meter,
 *                                           metric_tonne.
 * @param   {string[]} [req.body.supplier]   Optional. Company ids, each 24 char
 *                                           hex. Defaults to an empty list.
 * @param   {number} [req.body.minimum_stock_level] Optional. 1-1000000.
 *                                           Defaults to 1.
 * @param   {import("express").Response} res
 *
 * @returns {Promise<void>} 201 with the columns listed in
 *                          `raw_material_response`, each supplier expanded into
 *                          the company behind it.
 *
 * @throws  {app_error} 400 `VALIDATION_FAILED` when an id in `supplier` names no
 *                      active company we buy from. The `errors` list names the
 *                      entry.
 * @throws  {app_error} 401 when the caller sent no usable token.
 * @throws  {app_error} 403 `ACCESS_FORBIDDEN` when the caller is not an admin.
 * @throws  {app_error} 409 `CODE_EXISTS` when the material code is already on
 *                      another material, including a deactivated one.
 */
const create_raw_material = async (req, res) => {
  const suppliers = req.body.supplier || [];

  // The ids are checked together rather than one after another, because they
  // are independent reads and a caller may send several.
  const supplier_checks = await Promise.all(
    suppliers.map((supplier) => is_active_supplier_company_exists(supplier)),
  );

  const invalid_supplier = supplier_checks.indexOf(false);

  // The field names the position in the list, the way Joi addresses an array
  // entry, so the caller is pointed at the id rather than at the whole list.
  if (invalid_supplier !== -1) {
    throw reference_error(
      `supplier.${invalid_supplier}`,
      raw_material_validation_messages.SUPPLIER_INVALID,
    );
  }

  // `create` can trip the material code's unique index, which arrives as a bare
  // driver error.
  const raw_material = await run_with_raw_material_duplicate_mapping(() =>
    raw_material_model.create({ ...req.body, created_by: req.user.id }),
  );

  const { select, populate } = get_response_shape(
    raw_material_response,
    "create",
  );

  await raw_material.populate(populate);

  return send_response(
    res,
    http_status.CREATED,
    raw_material_messages.CREATED,
    project(raw_material, select),
  );
};

module.exports = create_raw_material;
