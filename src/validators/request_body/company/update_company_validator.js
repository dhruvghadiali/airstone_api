const joi = require("joi");

const { company_validation_messages } = require("@validators/messages");
const {
  base_company_fields,
} = require("@validators/request_body/company/company_fields");

/**
 * The company's own fields, every one of them optional.
 *
 * Built from the create fields rather than typed again, so a bound that changes
 * on create changes here in the same edit. Only requiredness differs between the
 * two, which is what `.optional()` undoes.
 */
const update_company_fields = Object.fromEntries(
  Object.entries(base_company_fields).map(([field, schema]) => [
    field,
    schema.optional(),
  ]),
);

/**
 * What a company may be changed to after it exists.
 *
 * The company's own columns and nothing else. `address` is absent, so sending
 * one is a 400 rather than a field that is quietly ignored: an address and a
 * contact are rows of their own, each with an id, and changing them through the
 * company would give a caller no way to say which row they meant. They get their
 * own endpoints.
 *
 * `is_active`, `created_by` and `updated_by` are absent for the same reason they
 * are on create. They are the server's to set, and `updated_by` in particular is
 * who is signed in, which the caller does not get to choose.
 *
 * `.min(1)` refuses an empty body. A PATCH that names no field would read the
 * company, write it back unchanged and answer 200, which tells the caller
 * nothing about the fact that they sent nothing.
 *
 * `noDefaults` stops Joi filling in a field the caller left out. Without it a
 * patch of one column would carry the defaults of every other column and write
 * them over what is stored.
 */
const update_company_schema = joi
  .object(update_company_fields)
  .min(1)
  .unknown(false)
  .prefs({ noDefaults: true })
  .messages({
    "object.min": company_validation_messages.UPDATE_MIN,
    "object.unknown": company_validation_messages.UNKNOWN_FIELD,
  });

module.exports = update_company_schema;
