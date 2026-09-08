const joi = require("joi");

const { contact_position } = require("@enums");
const {
  company_contact_validation_messages,
} = require("@validators/messages");
const {
  validation_patterns,
  user_validation_limits,
  company_contact_validation_limits,
} = require("@validators/constants");

/**
 * One contact's own fields, shared by every company contact request.
 *
 * `company` and `company_address` are not here. On the create endpoint the
 * contact arrives nested inside the address it belongs to, so both are read from
 * where it sits rather than sent. Taking them from the body would let a caller
 * file a contact under an address that is not the one they nested it in.
 *
 * `position` is compared exactly, for the reason `company_type` is: the model
 * does not lower case it either.
 */
const base_company_contact_fields = {
  name: joi
    .string()
    .trim()
    .min(company_contact_validation_limits.NAME_MIN)
    .max(company_contact_validation_limits.NAME_MAX)
    .required()
    .messages({
      "any.required": company_contact_validation_messages.NAME_REQUIRED,
      "string.base": company_contact_validation_messages.NAME_BASE,
      "string.empty": company_contact_validation_messages.NAME_EMPTY,
      "string.min": company_contact_validation_messages.NAME_MIN,
      "string.max": company_contact_validation_messages.NAME_MAX,
    }),
  phone_number: joi
    .string()
    .trim()
    .min(user_validation_limits.PHONE_NUMBER_MIN)
    .max(user_validation_limits.PHONE_NUMBER_MAX)
    .pattern(validation_patterns.PHONE_NUMBER)
    .required()
    .messages({
      "any.required":
        company_contact_validation_messages.PHONE_NUMBER_REQUIRED,
      "string.base": company_contact_validation_messages.PHONE_NUMBER_BASE,
      "string.empty": company_contact_validation_messages.PHONE_NUMBER_EMPTY,
      "string.min": company_contact_validation_messages.PHONE_NUMBER_MIN,
      "string.max": company_contact_validation_messages.PHONE_NUMBER_MAX,
      "string.pattern.base":
        company_contact_validation_messages.PHONE_NUMBER_INVALID,
    }),
  position: joi
    .string()
    .trim()
    .valid(...Object.values(contact_position))
    .required()
    .messages({
      "any.required": company_contact_validation_messages.POSITION_REQUIRED,
      "string.base": company_contact_validation_messages.POSITION_BASE,
      "string.empty": company_contact_validation_messages.POSITION_EMPTY,
      "any.only": company_contact_validation_messages.POSITION_INVALID,
    }),
};

module.exports = { base_company_contact_fields };
