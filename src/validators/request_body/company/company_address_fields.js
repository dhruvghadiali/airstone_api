const joi = require("joi");

const {
  company_address_validation_messages,
} = require("@validators/messages");
const {
  validation_patterns,
  company_address_validation_limits,
} = require("@validators/constants");

/**
 * One address's own fields, shared by every company address request.
 *
 * The `contact_person` array is not here, and neither is `company`. The array is
 * the shape of one endpoint's payload, and `company` is decided by the endpoint
 * rather than sent: on the create endpoint the address arrives nested inside the
 * company being made, so there is no id for a caller to give yet.
 *
 * `pincode` reads its format from `validation_patterns` and its length from
 * `company_address_validation_limits`, the same two values
 * `company_address_model` reads.
 */
const base_company_address_fields = {
  address: joi
    .string()
    .trim()
    .min(company_address_validation_limits.ADDRESS_MIN)
    .max(company_address_validation_limits.ADDRESS_MAX)
    .required()
    .messages({
      "any.required": company_address_validation_messages.ADDRESS_REQUIRED,
      "string.base": company_address_validation_messages.ADDRESS_BASE,
      "string.empty": company_address_validation_messages.ADDRESS_EMPTY,
      "string.min": company_address_validation_messages.ADDRESS_MIN,
      "string.max": company_address_validation_messages.ADDRESS_MAX,
    }),
  pincode: joi
    .string()
    .trim()
    .min(company_address_validation_limits.PINCODE_LENGTH)
    .max(company_address_validation_limits.PINCODE_LENGTH)
    .pattern(validation_patterns.PINCODE)
    .required()
    .messages({
      "any.required": company_address_validation_messages.PINCODE_REQUIRED,
      "string.base": company_address_validation_messages.PINCODE_BASE,
      "string.empty": company_address_validation_messages.PINCODE_EMPTY,
      "string.min": company_address_validation_messages.PINCODE_MIN,
      "string.max": company_address_validation_messages.PINCODE_MAX,
      "string.pattern.base": company_address_validation_messages.PINCODE_INVALID,
    }),
};

module.exports = { base_company_address_fields };
