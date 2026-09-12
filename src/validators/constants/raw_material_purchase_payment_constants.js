const { money_precision } = require("@validators/constants/common");

/**
 * The bounds one payment against a raw material purchase is held to.
 *
 * These are the payment's own bounds, not the purchase's. A single payment can
 * be any part of the bill, so `PAID_AMOUNT_MAX` matches the purchase's amount
 * ceiling rather than being a share of it. Whether the payments add up to more
 * than the bill is a rule about two documents, so the helper checks it.
 *
 * `PAYMENT_REFERENCE_MIN` is 5 because a reference shorter than that is almost
 * always a partial entry. A cash payment has no reference at all and stores
 * null, which this bound does not apply to.
 *
 * `PAID_AMOUNT_DECIMAL_PLACES` reads `money_precision` for the same reason the
 * purchase's amounts do.
 *
 * `RECEIPT_URL_MIN` and `RECEIPT_URL_MAX` bound a link to the receipt in cloud
 * storage, not the file itself. Nothing is stored in the database but the
 * address. They match the bill's `FILE_URL` bounds on the stock entry, because
 * both hold the same kind of thing, but they are declared here rather than
 * shared: a payment and a bill are different entities and either bound can move
 * without the other.
 */
const raw_material_purchase_payment_validation_limits = Object.freeze({
  PAID_AMOUNT_MIN: 0,
  RECEIPT_URL_MIN: 5,
  RECEIPT_URL_MAX: 1000,
  PAID_AMOUNT_MAX: 1000000,
  PAYMENT_REFERENCE_MIN: 5,
  PAYMENT_REFERENCE_MAX: 200,
  PAID_AMOUNT_DECIMAL_PLACES: money_precision.AMOUNT_DECIMAL_PLACES,
});

module.exports = { raw_material_purchase_payment_validation_limits };
