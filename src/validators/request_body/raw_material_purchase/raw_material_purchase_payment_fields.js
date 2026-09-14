const joi = require("joi");

const { payment_type } = require("@enums");
const { is_within_decimal_places } = require("@helpers/common");
const {
  raw_material_purchase_payment_validation_messages,
} = require("@validators/messages");
const {
  raw_material_purchase_payment_validation_limits,
} = require("@validators/constants");

/**
 * One payment's fields, as a caller may send them.
 *
 * `payment_reference` is required for every payment type except cash, which has
 * none. That is a rule about one field given another in the same object, so Joi
 * expresses it with `.when` rather than leaving it to the controller -- the
 * error then names `payment.0.payment_reference` and the caller is pointed at
 * the entry that is wrong.
 *
 * `paid_amount` is in rupees. How many decimal places it may carry is checked
 * here because the model cannot: `is_within_decimal_places` lives in
 * `@helpers/common`, and a model may not import from there. The bound itself
 * still comes from the same `money_precision` every other amount reads.
 *
 * `paid_on` and `receipt_url` declare no default. Both have one on the model --
 * now, and null -- and a second copy at this layer is a copy that drifts.
 *
 * `created_by` is absent. It is the signed in caller, which the controller sets
 * on every entry, so a caller cannot record a payment against somebody else.
 */
const base_raw_material_purchase_payment_fields = {
  payment_type: joi
    .string()
    .trim()
    .valid(...Object.values(payment_type))
    .required()
    .messages({
      "any.required":
        raw_material_purchase_payment_validation_messages.PAYMENT_TYPE_REQUIRED,
      "string.base":
        raw_material_purchase_payment_validation_messages.PAYMENT_TYPE_BASE,
      "string.empty":
        raw_material_purchase_payment_validation_messages.PAYMENT_TYPE_EMPTY,
      "any.only":
        raw_material_purchase_payment_validation_messages.PAYMENT_TYPE_INVALID,
    }),
  payment_reference: joi
    .string()
    .trim()
    .min(raw_material_purchase_payment_validation_limits.PAYMENT_REFERENCE_MIN)
    .max(raw_material_purchase_payment_validation_limits.PAYMENT_REFERENCE_MAX)
    .when("payment_type", {
      is: joi.valid(payment_type.CASH),
      then: joi.optional(),
      otherwise: joi.required(),
    })
    .messages({
      "any.required":
        raw_material_purchase_payment_validation_messages.PAYMENT_REFERENCE_REQUIRED,
      "string.base":
        raw_material_purchase_payment_validation_messages.PAYMENT_REFERENCE_BASE,
      "string.empty":
        raw_material_purchase_payment_validation_messages.PAYMENT_REFERENCE_EMPTY,
      "string.min":
        raw_material_purchase_payment_validation_messages.PAYMENT_REFERENCE_MIN,
      "string.max":
        raw_material_purchase_payment_validation_messages.PAYMENT_REFERENCE_MAX,
    }),
  paid_amount: joi
    .number()
    .min(raw_material_purchase_payment_validation_limits.PAID_AMOUNT_MIN)
    .max(raw_material_purchase_payment_validation_limits.PAID_AMOUNT_MAX)
    .custom((value, helpers) =>
      is_within_decimal_places(
        raw_material_purchase_payment_validation_limits.PAID_AMOUNT_DECIMAL_PLACES,
      )(value)
        ? value
        : helpers.error("number.precision"),
    )
    .required()
    .messages({
      "any.required":
        raw_material_purchase_payment_validation_messages.PAID_AMOUNT_REQUIRED,
      "number.base":
        raw_material_purchase_payment_validation_messages.PAID_AMOUNT_BASE,
      "number.min":
        raw_material_purchase_payment_validation_messages.PAID_AMOUNT_MIN,
      "number.max":
        raw_material_purchase_payment_validation_messages.PAID_AMOUNT_MAX,
      "number.precision":
        raw_material_purchase_payment_validation_messages.PAID_AMOUNT_PRECISION,
    }),
  paid_on: joi.date().iso().messages({
    "date.base": raw_material_purchase_payment_validation_messages.PAID_ON_BASE,
    "date.format":
      raw_material_purchase_payment_validation_messages.PAID_ON_INVALID,
  }),
  receipt_url: joi
    .string()
    .trim()
    .min(raw_material_purchase_payment_validation_limits.RECEIPT_URL_MIN)
    .max(raw_material_purchase_payment_validation_limits.RECEIPT_URL_MAX)
    .messages({
      "string.base":
        raw_material_purchase_payment_validation_messages.RECEIPT_URL_BASE,
      "string.empty":
        raw_material_purchase_payment_validation_messages.RECEIPT_URL_EMPTY,
      "string.min":
        raw_material_purchase_payment_validation_messages.RECEIPT_URL_MIN,
      "string.max":
        raw_material_purchase_payment_validation_messages.RECEIPT_URL_MAX,
    }),
};

/**
 * One payment, as an entry in a purchase's `payment` list.
 *
 * Closed like every other request object, so a key the payment sub-schema does
 * not hold -- a `created_by`, a stray `amount` -- is a 400 rather than a field
 * that is quietly dropped.
 */
const raw_material_purchase_payment_schema = joi
  .object(base_raw_material_purchase_payment_fields)
  .unknown(false)
  .messages({
    "object.base":
      raw_material_purchase_payment_validation_messages.PAYMENT_ENTRY_BASE,
    "object.unknown":
      raw_material_purchase_payment_validation_messages.UNKNOWN_FIELD,
  });

module.exports = {
  base_raw_material_purchase_payment_fields,
  raw_material_purchase_payment_schema,
};
