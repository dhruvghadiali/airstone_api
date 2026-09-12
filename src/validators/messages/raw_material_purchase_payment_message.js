const { payment_type } = require("@enums");
const {
  raw_material_purchase_payment_validation_limits,
} = require("@validators/constants/raw_material_purchase_payment_constants");

/**
 * The accepted payment types, spelled the way a caller should send them.
 *
 * Built from the enum rather than typed out, so adding or removing a type
 * updates this message on its own.
 */
const payment_types = Object.values(payment_type).join(", ");

/**
 * `PAYMENT_REFERENCE_REQUIRED` is not a schema rule. A cash payment has no
 * reference and stores null, so requiredness depends on `payment_type`. That is
 * a rule about one field given another, so the purchase helper enforces it and
 * this is what it reports.
 *
 * `NOT_FOUND` and `INVALID_ID` address one payment inside a purchase. Each entry
 * carries its own `_id`, so an endpoint can update or remove a single payment
 * without rewriting the list.
 */
const raw_material_purchase_payment_messages = Object.freeze({
  ADDED: "Payment added successfully",
  UPDATED: "Payment updated successfully",
  DELETED: "Payment deleted successfully",
  NOT_FOUND: "Payment not found on this purchase",
  INVALID_ID: "Invalid payment id",
});

const raw_material_purchase_payment_validation_messages = Object.freeze({
  PAYMENT_TYPE_REQUIRED: "Payment type is required",
  PAYMENT_TYPE_BASE: "Payment type must be a string",
  PAYMENT_TYPE_EMPTY: "Payment type cannot be empty",
  PAYMENT_TYPE_INVALID: `Payment type must be one of: ${payment_types}`,
  PAYMENT_REFERENCE_REQUIRED:
    "Payment reference is required for every payment type except cash",
  PAYMENT_REFERENCE_BASE: "Payment reference must be a string",
  PAYMENT_REFERENCE_EMPTY: "Payment reference cannot be empty",
  PAYMENT_REFERENCE_MIN: `Payment reference must be at least ${raw_material_purchase_payment_validation_limits.PAYMENT_REFERENCE_MIN} characters`,
  PAYMENT_REFERENCE_MAX: `Payment reference must not exceed ${raw_material_purchase_payment_validation_limits.PAYMENT_REFERENCE_MAX} characters`,
  PAID_AMOUNT_REQUIRED: "Paid amount is required",
  PAID_AMOUNT_BASE: "Paid amount must be a number",
  PAID_AMOUNT_MIN: `Paid amount must be at least ${raw_material_purchase_payment_validation_limits.PAID_AMOUNT_MIN}`,
  PAID_AMOUNT_MAX: `Paid amount must not exceed ${raw_material_purchase_payment_validation_limits.PAID_AMOUNT_MAX}`,
  PAID_AMOUNT_PRECISION: `Paid amount must not have more than ${raw_material_purchase_payment_validation_limits.PAID_AMOUNT_DECIMAL_PLACES} decimal places`,
  RECEIPT_URL_BASE: "Payment receipt link must be a string",
  RECEIPT_URL_EMPTY: "Payment receipt link cannot be empty",
  RECEIPT_URL_MIN: `Payment receipt link must be at least ${raw_material_purchase_payment_validation_limits.RECEIPT_URL_MIN} characters`,
  RECEIPT_URL_MAX: `Payment receipt link must not exceed ${raw_material_purchase_payment_validation_limits.RECEIPT_URL_MAX} characters`,
  PAID_ON_REQUIRED: "Paid on date is required",
  PAID_ON_BASE: "Paid on must be a date",
  PAID_ON_INVALID: "Paid on must be a valid date",
  CREATED_BY_REQUIRED: "Created by is required",
  CREATED_BY_BASE: "Created by must be a string",
  CREATED_BY_INVALID: "Created by must reference an active user",
  UNKNOWN_FIELD: "Payment contains an unsupported field",
});

module.exports = {
  raw_material_purchase_payment_messages,
  raw_material_purchase_payment_validation_messages,
};
