const joi = require("joi");
const moment = require("moment");

const { is_within_decimal_places } = require("@helpers/common");
const { gst_slab, raw_material_unit_of_measure } = require("@enums");
const {
  raw_material_purchase_validation_messages,
} = require("@validators/messages");
const {
  app_time,
  validation_limits,
  raw_material_purchase_validation_limits,
} = require("@validators/constants");
const {
  raw_material_purchase_payment_schema,
} = require("@validators/request_body/raw_material_purchase/raw_material_purchase_payment_fields");

/**
 * One money column on the purchase, in rupees.
 *
 * The four amounts -- price, GST, discount and the final total -- are held to
 * one bound and one precision, so they are built here once rather than written
 * out four times. Only their messages and their requiredness differ, and both
 * are supplied by the caller of this function.
 *
 * The precision check reuses `is_within_decimal_places` rather than Joi's own
 * `.precision()`. `validate_request` runs with `convert: true`, under which
 * `.precision()` silently rounds 100.555 to 100.56 instead of refusing it, and
 * an amount quietly changed on the way in is worse than one rejected.
 *
 * The model cannot make this check itself: the helper lives in
 * `@helpers/common`, and a model may not import from there.
 *
 * @param   {Object} messages  The Joi message map for this column.
 * @returns {import("joi").NumberSchema} An optional money schema; chain
 *                                       `.required()` where the column is.
 */
const money_amount = (messages) =>
  joi
    .number()
    .min(raw_material_purchase_validation_limits.AMOUNT_MIN)
    .max(raw_material_purchase_validation_limits.AMOUNT_MAX)
    .custom((value, helpers) =>
      is_within_decimal_places(
        raw_material_purchase_validation_limits.AMOUNT_DECIMAL_PLACES,
      )(value)
        ? value
        : helpers.error("number.precision"),
    )
    .messages(messages);

/**
 * The purchase's own fields, shared by every purchase request.
 *
 * `material` and `supplier` hold ids. An entry that is not 24 hex characters
 * cannot name a row, so it is reported with the same message the controller
 * uses for an id that names nothing live -- a caller cannot tell a malformed id
 * from an unknown one, which is exactly what the lookups say about their own
 * answers.
 *
 * `expected_delivery_date` must not fall before `purchase_date`. That is a rule
 * about one field given another in the same body, so Joi states it with a `ref`
 * rather than leaving it to the controller.
 *
 * Both dates are parsed as ISO. A caller sending a plain `2026-09-14` gets
 * midnight UTC, which is what a date with no time means; the endpoint stores
 * exactly what was parsed and shifts nothing.
 *
 * `purchase_date` may not be after today. An order cannot have been placed
 * tomorrow, so a year typed as 2062 is caught at the boundary rather than
 * stored. Today is the IST day, not the UTC one: late in a UTC evening it is
 * already tomorrow in India, and a buyer picking their own today would
 * otherwise be refused. That is why the bound is the end of the IST day rather
 * than Joi's `'now'`, which is a bare instant.
 *
 * The bound is computed on each request rather than when this file loads. A
 * schema built at boot would keep yesterday's ceiling after midnight.
 *
 * `expected_delivery_date` carries no future rule, deliberately. It only has to
 * be on or after `purchase_date`, so a purchase can still be back-entered after
 * the material has arrived.
 *
 * `gst_percentage` is a String because the rate is a label on a bill rather than
 * a number to do arithmetic on. The tax it implies is checked against
 * `gst_amount` by the controller, not here -- that is arithmetic across five
 * fields and it belongs with the other money rules.
 *
 * `qty`, `discount_amount`, `discount_percentage` and `payment` declare no
 * default. Every one has a default on the model, and a second copy at this layer
 * is a copy that drifts.
 *
 * `is_active`, `is_all_material_received`, `created_by` and `updated_by` are all
 * absent, so sending one is a 400 rather than a field that is quietly ignored.
 * They are the server's to set.
 */
const base_raw_material_purchase_fields = {
  material: joi
    .string()
    .trim()
    .hex()
    .length(validation_limits.OBJECT_ID_LENGTH)
    .required()
    .messages({
      "any.required":
        raw_material_purchase_validation_messages.MATERIAL_REQUIRED,
      "string.base": raw_material_purchase_validation_messages.MATERIAL_BASE,
      "string.empty": raw_material_purchase_validation_messages.MATERIAL_BASE,
      "string.hex": raw_material_purchase_validation_messages.MATERIAL_INVALID,
      "string.length":
        raw_material_purchase_validation_messages.MATERIAL_INVALID,
    }),
  supplier: joi
    .string()
    .trim()
    .hex()
    .length(validation_limits.OBJECT_ID_LENGTH)
    .required()
    .messages({
      "any.required":
        raw_material_purchase_validation_messages.SUPPLIER_REQUIRED,
      "string.base": raw_material_purchase_validation_messages.SUPPLIER_BASE,
      "string.empty": raw_material_purchase_validation_messages.SUPPLIER_BASE,
      "string.hex": raw_material_purchase_validation_messages.SUPPLIER_INVALID,
      "string.length":
        raw_material_purchase_validation_messages.SUPPLIER_INVALID,
    }),
  purchase_date: joi
    .date()
    .iso()
    .custom((value, helpers) =>
      moment(value).isAfter(
        moment().utcOffset(app_time.UTC_OFFSET).endOf("day"),
      )
        ? helpers.error("date.max")
        : value,
    )
    .required()
    .messages({
      "any.required":
        raw_material_purchase_validation_messages.PURCHASE_DATE_REQUIRED,
      "date.base": raw_material_purchase_validation_messages.PURCHASE_DATE_BASE,
      "date.format":
        raw_material_purchase_validation_messages.PURCHASE_DATE_INVALID,
      "date.max":
        raw_material_purchase_validation_messages.PURCHASE_DATE_FUTURE,
    }),
  expected_delivery_date: joi
    .date()
    .iso()
    .min(joi.ref("purchase_date"))
    .required()
    .messages({
      "any.required":
        raw_material_purchase_validation_messages.EXPECTED_DELIVERY_DATE_REQUIRED,
      "date.base":
        raw_material_purchase_validation_messages.EXPECTED_DELIVERY_DATE_BASE,
      "date.format":
        raw_material_purchase_validation_messages.EXPECTED_DELIVERY_DATE_INVALID,
      "date.min":
        raw_material_purchase_validation_messages.DELIVERY_DATE_BEFORE_PURCHASE,
    }),
  qty: joi
    .number()
    .min(raw_material_purchase_validation_limits.QTY_MIN)
    .max(raw_material_purchase_validation_limits.QTY_MAX)
    .messages({
      "number.base": raw_material_purchase_validation_messages.QTY_BASE,
      "number.min": raw_material_purchase_validation_messages.QTY_MIN,
      "number.max": raw_material_purchase_validation_messages.QTY_MAX,
    }),
  unit: joi
    .string()
    .trim()
    .valid(...Object.values(raw_material_unit_of_measure))
    .required()
    .messages({
      "any.required": raw_material_purchase_validation_messages.UNIT_REQUIRED,
      "string.base": raw_material_purchase_validation_messages.UNIT_BASE,
      "string.empty": raw_material_purchase_validation_messages.UNIT_EMPTY,
      "any.only": raw_material_purchase_validation_messages.UNIT_INVALID,
    }),
  purchase_price: money_amount({
    "any.required":
      raw_material_purchase_validation_messages.PURCHASE_PRICE_REQUIRED,
    "number.base":
      raw_material_purchase_validation_messages.PURCHASE_PRICE_BASE,
    "number.min": raw_material_purchase_validation_messages.PURCHASE_PRICE_MIN,
    "number.max": raw_material_purchase_validation_messages.PURCHASE_PRICE_MAX,
    "number.precision":
      raw_material_purchase_validation_messages.PURCHASE_PRICE_PRECISION,
  }).required(),
  gst_percentage: joi
    .string()
    .trim()
    .valid(...Object.values(gst_slab))
    .required()
    .messages({
      "any.required":
        raw_material_purchase_validation_messages.GST_PERCENTAGE_REQUIRED,
      "string.base":
        raw_material_purchase_validation_messages.GST_PERCENTAGE_BASE,
      "string.empty":
        raw_material_purchase_validation_messages.GST_PERCENTAGE_EMPTY,
      "any.only":
        raw_material_purchase_validation_messages.GST_PERCENTAGE_INVALID,
    }),
  gst_amount: money_amount({
    "any.required":
      raw_material_purchase_validation_messages.GST_AMOUNT_REQUIRED,
    "number.base": raw_material_purchase_validation_messages.GST_AMOUNT_BASE,
    "number.min": raw_material_purchase_validation_messages.GST_AMOUNT_MIN,
    "number.max": raw_material_purchase_validation_messages.GST_AMOUNT_MAX,
    "number.precision":
      raw_material_purchase_validation_messages.GST_AMOUNT_PRECISION,
  }).required(),
  discount_amount: money_amount({
    "number.base":
      raw_material_purchase_validation_messages.DISCOUNT_AMOUNT_BASE,
    "number.min": raw_material_purchase_validation_messages.DISCOUNT_AMOUNT_MIN,
    "number.max": raw_material_purchase_validation_messages.DISCOUNT_AMOUNT_MAX,
    "number.precision":
      raw_material_purchase_validation_messages.DISCOUNT_AMOUNT_PRECISION,
  }),
  discount_percentage: joi
    .number()
    .min(raw_material_purchase_validation_limits.DISCOUNT_PERCENTAGE_MIN)
    .max(raw_material_purchase_validation_limits.DISCOUNT_PERCENTAGE_MAX)
    .custom((value, helpers) =>
      is_within_decimal_places(
        raw_material_purchase_validation_limits.AMOUNT_DECIMAL_PLACES,
      )(value)
        ? value
        : helpers.error("number.precision"),
    )
    .messages({
      "number.base":
        raw_material_purchase_validation_messages.DISCOUNT_PERCENTAGE_BASE,
      "number.min":
        raw_material_purchase_validation_messages.DISCOUNT_PERCENTAGE_MIN,
      "number.max":
        raw_material_purchase_validation_messages.DISCOUNT_PERCENTAGE_MAX,
      "number.precision":
        raw_material_purchase_validation_messages.DISCOUNT_PERCENTAGE_PRECISION,
    }),
  final_payment_amount: money_amount({
    "any.required":
      raw_material_purchase_validation_messages.FINAL_PAYMENT_AMOUNT_REQUIRED,
    "number.base":
      raw_material_purchase_validation_messages.FINAL_PAYMENT_AMOUNT_BASE,
    "number.min":
      raw_material_purchase_validation_messages.FINAL_PAYMENT_AMOUNT_MIN,
    "number.max":
      raw_material_purchase_validation_messages.FINAL_PAYMENT_AMOUNT_MAX,
    "number.precision":
      raw_material_purchase_validation_messages.FINAL_PAYMENT_AMOUNT_PRECISION,
  }).required(),
  payment: joi.array().items(raw_material_purchase_payment_schema).messages({
    "array.base": raw_material_purchase_validation_messages.PAYMENT_BASE,
  }),
};

module.exports = { base_raw_material_purchase_fields };
