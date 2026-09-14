const _ = require("lodash");

const app_error = require("@middlewares/app_error");

const { http_status } = require("@enums");
const { to_paisa, PERCENT_BASE } = require("@helpers/common");
const {
  error_messages,
  raw_material_purchase_validation_messages,
} = require("@validators/messages");

/**
 * One entry in the 400 this file raises.
 *
 * The same shape `reference_error` builds -- field, message, type -- so a client
 * reads a bad amount and a bad reference the same way. The type differs because
 * the two are fixed differently: one is an id that names nothing, the other is a
 * figure that does not tie out.
 *
 * @param   {string} field    The body field whose value does not add up.
 * @param   {string} message  What is wrong with it, in the caller's terms.
 * @returns {{field: string, message: string, type: string}} One detail entry.
 */
const amount_mismatch = (field, message) => ({
  field,
  message,
  type: "amount_mismatch",
});

/**
 * Checks that the money on a purchase adds up, and reports every figure that
 * does not.
 *
 * A Mongoose validator sees one value at a time, so none of these rules can live
 * on the schema. They are checked here, before the write, from the request body
 * the Joi schema has already shaped.
 *
 * Every comparison is made in paisa. Adding rupees as floats reaches
 * 4999.999999999999 for values that are each exact to two places, so a
 * reconciliation written against rupees would fail on arithmetic rather than on
 * the numbers a person typed.
 *
 * **GST is charged on top of the price.** The expected tax is a percentage of
 * `purchase_price` itself, not a share of a total that already contains it. That
 * is why `expected_gst_amount` in `@helpers/common` is not used here -- it
 * extracts tax from a tax inclusive bill, which is the other convention.
 *
 * **The discount is also taken on the price, not on the taxed total**, and the
 * tax is not recalculated after it. So the three figures are independent of each
 * other and `final_payment_amount` is `price + gst - discount`. Indian invoices
 * frequently discount before tax instead, which would make `gst_amount` depend
 * on `discount_amount`; if a real supplier bill disagrees with this, it is this
 * function that has to change.
 *
 * The final total is checked against the `gst_amount` and `discount_amount` the
 * caller actually sent, not against the ones this function expected. A body with
 * a wrong tax figure and a total that matches it is two separate problems, and
 * saying so beats reporting one and hiding the other.
 *
 * Every mismatch is collected and raised together, so a caller with three wrong
 * figures fixes three rather than being told about them one call at a time.
 *
 * @param   {Object} purchase  A validated create body.
 * @returns {void} Nothing when every figure ties out.
 * @throws  {app_error} 400 `VALIDATION_FAILED` carrying one entry per figure
 *                      that does not.
 */
const assert_purchase_amounts = (purchase) => {
  const price = to_paisa(purchase.purchase_price);
  const gst_amount = to_paisa(purchase.gst_amount);
  const final_amount = to_paisa(purchase.final_payment_amount);

  // Both default on the model rather than in the schema, so an omitted one
  // arrives here undefined. `_.defaultTo` fills only a null, an undefined or a
  // NaN, so a discount the caller really did send as 0 is kept rather than
  // replaced -- which is the difference between it and `||`.
  const discount_amount = to_paisa(_.defaultTo(purchase.discount_amount, 0));
  const discount_percentage = _.defaultTo(purchase.discount_percentage, 0);

  const errors = [];

  const expected_gst = Math.round(
    (price * Number(purchase.gst_percentage)) / PERCENT_BASE,
  );

  if (gst_amount !== expected_gst) {
    errors.push(
      amount_mismatch(
        "gst_amount",
        raw_material_purchase_validation_messages.GST_AMOUNT_MISMATCH,
      ),
    );
  }

  const expected_discount = Math.round(
    (price * discount_percentage) / PERCENT_BASE,
  );

  if (discount_amount !== expected_discount) {
    errors.push(
      amount_mismatch(
        "discount_amount",
        raw_material_purchase_validation_messages.DISCOUNT_MISMATCH,
      ),
    );
  }

  if (final_amount !== price + gst_amount - discount_amount) {
    errors.push(
      amount_mismatch(
        "final_payment_amount",
        raw_material_purchase_validation_messages.FINAL_AMOUNT_MISMATCH,
      ),
    );
  }

  // `_.sumBy` answers 0 for a list that is not there, so a purchase raised
  // before any money moved needs no guard of its own.
  const paid = _.sumBy(purchase.payment, (payment) =>
    to_paisa(payment.paid_amount),
  );

  // A purchase may be part paid or not paid at all, so only paying more than
  // the bill is wrong.
  if (paid > final_amount) {
    errors.push(
      amount_mismatch(
        "payment",
        raw_material_purchase_validation_messages.PAYMENTS_EXCEED_TOTAL,
      ),
    );
  }

  if (!_.isEmpty(errors)) {
    throw new app_error(
      http_status.BAD_REQUEST,
      error_messages.VALIDATION_FAILED,
      errors,
    );
  }
};

module.exports = { assert_purchase_amounts };
