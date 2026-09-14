const _ = require("lodash");

const { raw_material_purchase_model } = require("@models/raw_material");

const { http_status } = require("@enums");
const { project } = require("@utils/projection");
const { reference_error } = require("@utils/reference_error");
const { find_active_raw_material } = require("@helpers/raw_material");
const { send_response, get_response_shape } = require("@helpers/common");
const { is_active_supplier_company_exists } = require("@helpers/company");
const {
  raw_material_purchase_messages,
  raw_material_purchase_validation_messages,
} = require("@validators/messages");
const {
  assert_purchase_amounts,
  raw_material_purchase_response,
} = require("@helpers/raw_material_purchase");

/**
 * Records an order placed with a supplier for one raw material.
 *
 * A purchase is a bill, so it is stored as a record of what was agreed on the
 * day it was agreed. Nothing on it is recalculated later from the material or
 * the supplier.
 *
 * The material and the supplier are checked together, because they are
 * independent reads. The material lookup answers with the row rather than a
 * boolean, so proving it exists and reading its `unit` is one query.
 *
 * `unit` is then compared against the material's own. A purchase records the
 * unit it was actually bought in, and a caller sending one the material is not
 * counted in has almost certainly picked the wrong material.
 *
 * A supplier must be a firm we buy from, so the check reads the company's type
 * as well as whether it is active. A firm we only sell stone to cannot supply us
 * sand.
 *
 * The money is reconciled before the write. GST is charged on top of the price
 * and the discount is taken off it, so the total is price plus tax less
 * discount, and every figure that does not tie out is reported at once rather
 * than one call at a time.
 *
 * `created_by` is the signed in caller, on the purchase and on every payment
 * that came with it. The schema refuses a `created_by` in either place, so there
 * is no way to record a bill or a payment against somebody else.
 *
 * `is_all_material_received` is not accepted and starts false. A purchase is
 * raised before the lorry arrives, and marking it received is the receiving
 * endpoint's job.
 *
 * The reply expands the material and the supplier, so a client can render what
 * it just created without two more calls.
 *
 * @route   POST /admin/raw-material-purchases
 * @access  Admin
 *
 * @param   {import("express").Request} req
 * @param   {Object} req.body Validated by `create_raw_material_purchase_schema`,
 *                            which rejects unknown fields.
 * @param   {string} req.body.material   Required. 24 char hex. Must name an
 *                                       active raw material.
 * @param   {string} req.body.supplier   Required. 24 char hex. Must name an
 *                                       active company we buy from.
 * @param   {string} req.body.purchase_date  Required. ISO date.
 * @param   {string} req.body.expected_delivery_date Required. ISO date, not
 *                                       before `purchase_date`.
 * @param   {number} [req.body.qty]      Optional. 1-1000000, fractional allowed.
 *                                       Defaults to 1.
 * @param   {string} req.body.unit       Required. One of bag, gram, litre,
 *                                       piece, kilogram, cubic_meter,
 *                                       metric_tonne. Must match the material's.
 * @param   {number} req.body.purchase_price Required. Rupees, 0-1000000, at
 *                                       most 2 decimals. Excludes GST.
 * @param   {string} req.body.gst_percentage Required. One of "0", "5", "12",
 *                                       "18", "28".
 * @param   {number} req.body.gst_amount Required. Rupees. Must equal
 *                                       `purchase_price` times the slab.
 * @param   {number} [req.body.discount_amount] Optional. Rupees. Must equal
 *                                       `purchase_price` times
 *                                       `discount_percentage`. Defaults to 0.
 * @param   {number} [req.body.discount_percentage] Optional. 0-100. Defaults
 *                                       to 0.
 * @param   {number} req.body.final_payment_amount Required. Rupees. Must equal
 *                                       price plus GST less discount.
 * @param   {Object[]} [req.body.payment] Optional. Defaults to an empty list.
 * @param   {string} req.body.payment[].payment_type Required. One of upi, neft,
 *                                       rtgs, cash, cheque.
 * @param   {string} [req.body.payment[].payment_reference] Required for every
 *                                       type except cash. 5-200 chars.
 * @param   {number} req.body.payment[].paid_amount Required. Rupees. The list
 *                                       may not total more than
 *                                       `final_payment_amount`.
 * @param   {string} [req.body.payment[].paid_on] Optional ISO date. Defaults to
 *                                       now.
 * @param   {string} [req.body.payment[].receipt_url] Optional. 5-1000 chars.
 * @param   {import("express").Response} res
 *
 * @returns {Promise<void>} 201 with the columns listed in
 *                          `raw_material_purchase_response`, the material and
 *                          the supplier each expanded.
 *
 * @throws  {app_error} 400 `VALIDATION_FAILED` when `material` or `supplier`
 *                      names no live row, when `unit` disagrees with the
 *                      material's, or when a money figure does not tie out. The
 *                      `errors` list names every field at fault.
 * @throws  {app_error} 401 when the caller sent no usable token.
 * @throws  {app_error} 403 `ACCESS_FORBIDDEN` when the caller is not an admin.
 */
const create_raw_material_purchase = async (req, res) => {
  // Two independent reads, so they run together rather than one after the other.
  const [material, supplier_exists] = await Promise.all([
    find_active_raw_material(req.body.material),
    is_active_supplier_company_exists(req.body.supplier),
  ]);

  if (!material) {
    throw reference_error(
      "material",
      raw_material_purchase_validation_messages.MATERIAL_INVALID,
    );
  }

  if (!supplier_exists) {
    throw reference_error(
      "supplier",
      raw_material_purchase_validation_messages.SUPPLIER_INVALID,
    );
  }

  // A material is counted in one unit. Buying it in another is a sign the wrong
  // material was picked, not a conversion this endpoint should make.
  if (req.body.unit !== material.unit) {
    throw reference_error(
      "unit",
      raw_material_purchase_validation_messages.UNIT_MISMATCH,
    );
  }

  assert_purchase_amounts(req.body);

  // Every payment records who entered it, and so does the purchase. Neither is
  // accepted from the body. `_.map` answers with an empty list when `payment`
  // was left out, so a purchase raised before any money moved needs no guard.
  const payment = _.map(req.body.payment, (entry) => ({
    ...entry,
    created_by: req.user.id,
  }));

  const raw_material_purchase = await raw_material_purchase_model.create({
    ...req.body,
    payment,
    created_by: req.user.id,
  });

  const { select, populate } = get_response_shape(
    raw_material_purchase_response,
    "create",
  );

  await raw_material_purchase.populate(populate);

  return send_response(
    res,
    http_status.CREATED,
    raw_material_purchase_messages.CREATED,
    project(raw_material_purchase, select),
  );
};

module.exports = create_raw_material_purchase;
