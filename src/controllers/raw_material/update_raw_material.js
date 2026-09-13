const { raw_material_model } = require("@models/raw_material");
const app_error = require("@middlewares/app_error");

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
 * Changes a raw material's details.
 *
 * Every field is optional and at least one is required, so a caller sends what
 * changed rather than the whole material back.
 *
 * `supplier` replaces the stored list rather than adding to it. A caller removes
 * a firm by sending the list without it, and clears every supplier by sending an
 * empty list. Each id sent is checked against the companies collection first,
 * because a firm we only sell stone to cannot supply us. The failure names the
 * entry that is wrong, so a caller sending three ids knows which one to fix.
 * Only the first bad id is reported; a caller with two of them will be told
 * again.
 *
 * Leaving `supplier` out of the body changes nothing about the stored list, and
 * costs no lookups. That is what separates an omitted list from an empty one.
 *
 * `updated_by` is the signed in caller, taken from the token. The schema refuses
 * an `updated_by` field, so a caller cannot record the change against somebody
 * else.
 *
 * A deactivated material can still be edited. There is no restore endpoint yet,
 * and `is_active` is not something this endpoint accepts, so the only thing
 * filtering it out would achieve is making a typo in a deactivated material
 * impossible to correct.
 *
 * The material code carries a global unique index and deletes here are soft, so
 * a deactivated material keeps its code reserved. A caller moving to a code that
 * looks free to them gets a 409 saying so rather than a driver error.
 *
 * The read takes no `select`. `save()` validates and writes the whole document,
 * and a projected document saves back a mutilated one. The response is narrowed
 * afterwards, to the response only.
 *
 * @route   PATCH /admin/raw-materials/:id
 * @access  Admin
 *
 * @param   {import("express").Request} req
 * @param   {Object} req.params
 * @param   {string} req.params.id  The material's id. 24 hex characters,
 *                                  validated by `raw_material_id_params_schema`.
 * @param   {Object} req.body Validated by `update_raw_material_schema`, which
 *                            requires at least one field and rejects unknown
 *                            ones.
 * @param   {string} [req.body.material_name]  2-200 chars, trimmed.
 * @param   {string} [req.body.material_code]  2-50 chars, uppercase letters,
 *                                             digits and hyphens only. Stored
 *                                             upper case. Unique.
 * @param   {string} [req.body.unit]           One of bag, gram, litre, piece,
 *                                             kilogram, cubic_meter,
 *                                             metric_tonne.
 * @param   {string[]} [req.body.supplier]     Company ids, each 24 char hex.
 *                                             Replaces the stored list.
 * @param   {number} [req.body.minimum_stock_level] 1-1000000.
 * @param   {import("express").Response} res
 *
 * @returns {Promise<void>} 200 with the columns listed in
 *                          `raw_material_response`, each supplier expanded into
 *                          the company behind it.
 *
 * @throws  {app_error} 400 `VALIDATION_FAILED` when an id in `supplier` names no
 *                      active company we buy from. The `errors` list names the
 *                      entry.
 * @throws  {app_error} 401 when the caller sent no usable token.
 * @throws  {app_error} 403 `ACCESS_FORBIDDEN` when the caller is not an admin.
 * @throws  {app_error} 404 `NOT_FOUND` when no material has that id.
 * @throws  {app_error} 409 `CODE_EXISTS` when the material code is already on
 *                      another material, including a deactivated one.
 */
const update_raw_material = async (req, res) => {
  const raw_material = await raw_material_model.findById(req.params.id);

  if (!raw_material) {
    throw new app_error(http_status.NOT_FOUND, raw_material_messages.NOT_FOUND);
  }

  // An omitted list is not a change, so it costs no lookups. An empty one is a
  // change to no suppliers, and has nothing to look up either.
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

  Object.assign(raw_material, req.body, { updated_by: req.user.id });

  // `save()` runs the schema validators over the merged document, and can trip
  // the material code's unique index, which arrives as a bare driver error.
  await run_with_raw_material_duplicate_mapping(() => raw_material.save());

  const { select, populate } = get_response_shape(
    raw_material_response,
    "update",
  );

  await raw_material.populate(populate);

  return send_response(
    res,
    http_status.OK,
    raw_material_messages.UPDATED,
    project(raw_material, select),
  );
};

module.exports = update_raw_material;
