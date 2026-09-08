const joi = require("joi");

const { company_type } = require("@enums");
const { company_validation_messages } = require("@validators/messages");
const {
  validation_patterns,
  user_validation_limits,
  company_validation_limits,
  company_validation_patterns,
} = require("@validators/constants");

/**
 * The company's own fields, shared by every company request.
 *
 * The `address` array is not here. It is the shape of one endpoint's payload
 * rather than a column of the company, so it is declared in
 * `create_company_validator` where it is used.
 *
 * `company_type` and every enum field like it is compared exactly. A caller
 * sending `Supplier` is told the accepted values rather than having the value
 * quietly lower cased, because the model does not lower case it either and the
 * two layers must agree on what they store.
 *
 * `gst_number` and `pan_number` are upper cased before the pattern runs, which
 * is what the model does too. So `24abcde1234f1z5` is accepted and stored as
 * `24ABCDE1234F1Z5`.
 *
 * `email` and `phone_number` read their format from `validation_patterns` and
 * their length from `user_validation_limits`, exactly as `company_model` does.
 * A rule the two layers read from one place cannot drift into a Joi error the
 * model would have allowed, or a Mongoose error the caller was never warned
 * about.
 */
const base_company_fields = {
  company_name: joi
    .string()
    .trim()
    .min(company_validation_limits.COMPANY_NAME_MIN)
    .max(company_validation_limits.COMPANY_NAME_MAX)
    .required()
    .messages({
      "any.required": company_validation_messages.COMPANY_NAME_REQUIRED,
      "string.base": company_validation_messages.COMPANY_NAME_BASE,
      "string.empty": company_validation_messages.COMPANY_NAME_EMPTY,
      "string.min": company_validation_messages.COMPANY_NAME_MIN,
      "string.max": company_validation_messages.COMPANY_NAME_MAX,
    }),
  company_type: joi
    .string()
    .trim()
    .valid(...Object.values(company_type))
    .required()
    .messages({
      "any.required": company_validation_messages.COMPANY_TYPE_REQUIRED,
      "string.base": company_validation_messages.COMPANY_TYPE_BASE,
      "string.empty": company_validation_messages.COMPANY_TYPE_EMPTY,
      "any.only": company_validation_messages.COMPANY_TYPE_INVALID,
    }),
  email: joi
    .string()
    .trim()
    .lowercase()
    .min(user_validation_limits.EMAIL_MIN)
    .max(user_validation_limits.EMAIL_MAX)
    .pattern(validation_patterns.EMAIL)
    .required()
    .messages({
      "any.required": company_validation_messages.EMAIL_REQUIRED,
      "string.base": company_validation_messages.EMAIL_BASE,
      "string.empty": company_validation_messages.EMAIL_EMPTY,
      "string.min": company_validation_messages.EMAIL_MIN,
      "string.max": company_validation_messages.EMAIL_MAX,
      "string.pattern.base": company_validation_messages.EMAIL_INVALID,
    }),
  phone_number: joi
    .string()
    .trim()
    .min(user_validation_limits.PHONE_NUMBER_MIN)
    .max(user_validation_limits.PHONE_NUMBER_MAX)
    .pattern(validation_patterns.PHONE_NUMBER)
    .required()
    .messages({
      "any.required": company_validation_messages.PHONE_NUMBER_REQUIRED,
      "string.base": company_validation_messages.PHONE_NUMBER_BASE,
      "string.empty": company_validation_messages.PHONE_NUMBER_EMPTY,
      "string.min": company_validation_messages.PHONE_NUMBER_MIN,
      "string.max": company_validation_messages.PHONE_NUMBER_MAX,
      "string.pattern.base": company_validation_messages.PHONE_NUMBER_INVALID,
    }),
  gst_number: joi
    .string()
    .trim()
    .uppercase()
    .min(company_validation_limits.GST_NUMBER_LENGTH)
    .max(company_validation_limits.GST_NUMBER_LENGTH)
    .pattern(company_validation_patterns.GST_NUMBER)
    .required()
    .messages({
      "any.required": company_validation_messages.GST_NUMBER_REQUIRED,
      "string.base": company_validation_messages.GST_NUMBER_BASE,
      "string.empty": company_validation_messages.GST_NUMBER_EMPTY,
      "string.min": company_validation_messages.GST_NUMBER_MIN,
      "string.max": company_validation_messages.GST_NUMBER_MAX,
      "string.pattern.base": company_validation_messages.GST_NUMBER_INVALID,
    }),
  pan_number: joi
    .string()
    .trim()
    .uppercase()
    .min(company_validation_limits.PAN_NUMBER_LENGTH)
    .max(company_validation_limits.PAN_NUMBER_LENGTH)
    .pattern(company_validation_patterns.PAN_NUMBER)
    .required()
    .messages({
      "any.required": company_validation_messages.PAN_NUMBER_REQUIRED,
      "string.base": company_validation_messages.PAN_NUMBER_BASE,
      "string.empty": company_validation_messages.PAN_NUMBER_EMPTY,
      "string.min": company_validation_messages.PAN_NUMBER_MIN,
      "string.max": company_validation_messages.PAN_NUMBER_MAX,
      "string.pattern.base": company_validation_messages.PAN_NUMBER_INVALID,
    }),
};

module.exports = { base_company_fields };
