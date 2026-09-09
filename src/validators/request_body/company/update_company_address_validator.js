const joi = require("joi");

const {
  company_address_validation_messages,
} = require("@validators/messages");
const {
  base_company_address_fields,
} = require("@validators/request_body/company/company_address_fields");

/**
 * The address's own fields, every one of them optional.
 *
 * Built from the create fields rather than typed again, so a bound that changes
 * on create changes here in the same edit. Only requiredness differs between the
 * two, which is what `.optional()` undoes.
 */
const update_company_address_fields = Object.fromEntries(
  Object.entries(base_company_address_fields).map(([field, schema]) => [
    field,
    schema.optional(),
  ]),
);

/**
 * What an address may be changed to after it exists.
 *
 * `company` is absent, so sending one is a 400. An address cannot be moved to a
 * different company: every contact filed under it points at the old company too,
 * and moving the address alone would leave those contacts naming a company that
 * no longer owns the place they work at. An address at a new company is a new
 * address.
 *
 * `contact_person` is absent for a related reason. A contact is a row with an id
 * of its own, and an array in this body could not say which of them the caller
 * meant. Contacts get their own endpoints.
 *
 * `is_active`, `created_by` and `updated_by` are absent because they are the
 * server's to set, exactly as on the company.
 *
 * `.min(1)` refuses an empty body, and `noDefaults` stops Joi filling in a field
 * the caller left out -- both for the reasons `update_company_schema` gives.
 */
const update_company_address_schema = joi
  .object(update_company_address_fields)
  .min(1)
  .unknown(false)
  .prefs({ noDefaults: true })
  .messages({
    "object.min": company_address_validation_messages.UPDATE_MIN,
    "object.unknown": company_address_validation_messages.UNKNOWN_FIELD,
  });

module.exports = update_company_address_schema;
