const joi = require("joi");

const {
  company_validation_limits,
  company_address_validation_limits,
} = require("@validators/constants");
const {
  company_validation_messages,
  company_address_validation_messages,
  company_contact_validation_messages,
} = require("@validators/messages");
const {
  base_company_fields,
} = require("@validators/request_body/company/company_fields");
const {
  base_company_address_fields,
} = require("@validators/request_body/company/company_address_fields");
const {
  base_company_contact_fields,
} = require("@validators/request_body/company/company_contact_fields");

/**
 * One contact nested under an address.
 *
 * It carries no `company` and no `company_address`. Both are read from where the
 * contact sits in the body, so a caller cannot file a contact under an address
 * other than the one they nested it in.
 */
const contact_person_schema = joi
  .object(base_company_contact_fields)
  .unknown(false)
  .messages({
    "object.unknown": company_contact_validation_messages.UNKNOWN_FIELD,
  });

/**
 * One address nested under the company, with the people who work at it.
 *
 * `contact_person` is required and cannot be empty. An address nobody can be
 * reached at is a row that only makes the company list longer.
 */
const company_address_schema = joi
  .object({
    ...base_company_address_fields,
    contact_person: joi
      .array()
      .items(contact_person_schema)
      .min(company_address_validation_limits.CONTACT_PERSON_LIST_MIN_ITEMS)
      .required()
      .messages({
        "any.required":
          company_address_validation_messages.CONTACT_PERSON_LIST_REQUIRED,
        "array.base":
          company_address_validation_messages.CONTACT_PERSON_LIST_BASE,
        "array.min":
          company_address_validation_messages.CONTACT_PERSON_LIST_MIN,
      }),
  })
  .unknown(false)
  .messages({
    "object.unknown": company_address_validation_messages.UNKNOWN_FIELD,
  });

/**
 * The whole company, entered in one request.
 *
 * A company, its addresses and the people at each address arrive together rather
 * than as three calls, because a company with no address and no contact is not
 * yet usable and would sit in the list as a half filled row. The three
 * collections are written in one transaction, so either all of it lands or none
 * of it does.
 *
 * `address` is required and cannot be empty, for the same reason.
 *
 * `is_active`, `created_by` and `updated_by` are not accepted. They are the
 * server's to set, and `.unknown(false)` turns any of them in the body into a
 * 400 rather than a field that is silently ignored.
 */
const create_company_schema = joi
  .object({
    ...base_company_fields,
    address: joi
      .array()
      .items(company_address_schema)
      .min(company_validation_limits.ADDRESS_LIST_MIN_ITEMS)
      .required()
      .messages({
        "any.required": company_validation_messages.ADDRESS_LIST_REQUIRED,
        "array.base": company_validation_messages.ADDRESS_LIST_BASE,
        "array.min": company_validation_messages.ADDRESS_LIST_MIN,
      }),
  })
  .unknown(false)
  .messages({
    "object.unknown": company_validation_messages.UNKNOWN_FIELD,
  });

module.exports = create_company_schema;
