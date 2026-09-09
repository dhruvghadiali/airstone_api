const joi = require("joi");

const {
  company_contact_validation_messages,
} = require("@validators/messages");
const {
  base_company_contact_fields,
} = require("@validators/request_body/company/company_contact_fields");

/**
 * The contact's own fields, every one of them optional.
 *
 * Built from the create fields rather than typed again, so a bound that changes
 * on create changes here in the same edit. Only requiredness differs between the
 * two, which is what `.optional()` undoes.
 */
const update_company_contact_fields = Object.fromEntries(
  Object.entries(base_company_contact_fields).map(([field, schema]) => [
    field,
    schema.optional(),
  ]),
);

/**
 * What a contact may be changed to after it exists.
 *
 * Who the person is and what they do, and nothing about where they sit.
 *
 * `company` and `company_address` are both absent, so sending either is a 400.
 * They are one fact, not two -- an address already knows its company -- and
 * accepting one without the other would let a caller leave a contact naming a
 * company that does not own the address it points at. Accepting both would make
 * this endpoint a move rather than an edit, and a move has to prove the pair
 * agree before it writes. A contact who has changed branch is added at the new
 * one.
 *
 * `is_active`, `created_by` and `updated_by` are absent because they are the
 * server's to set, exactly as on the company and the address.
 *
 * `.min(1)` refuses an empty body, and `noDefaults` stops Joi filling in a field
 * the caller left out -- both for the reasons `update_company_schema` gives.
 */
const update_company_contact_schema = joi
  .object(update_company_contact_fields)
  .min(1)
  .unknown(false)
  .prefs({ noDefaults: true })
  .messages({
    "object.min": company_contact_validation_messages.UPDATE_MIN,
    "object.unknown": company_contact_validation_messages.UNKNOWN_FIELD,
  });

module.exports = update_company_contact_schema;
