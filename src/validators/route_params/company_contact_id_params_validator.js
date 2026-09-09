const joi = require("joi");

const { validation_limits } = require("@validators/constants");
const { company_contact_messages } = require("@validators/messages");

/**
 * The id in `/companies/contacts/:id`, addressing one company contact.
 *
 * One id, not three. A contact id is unique on its own, so neither the company
 * nor the address it sits under is part of the path, and neither is something a
 * caller may send. An admin may edit every company's contacts, so there is
 * nothing for a second or third id to narrow.
 *
 * Every failure maps to the same message, for the reason
 * `company_id_params_schema` gives: a caller who sent a short id, a non hex one
 * or none at all has made the same mistake, and one stable response is easier to
 * handle than five wordings that all mean "fix the id".
 */
const company_contact_id_params_schema = joi
  .object({
    id: joi
      .string()
      .hex()
      .length(validation_limits.OBJECT_ID_LENGTH)
      .required()
      .messages({
        "any.required": company_contact_messages.INVALID_ID,
        "string.base": company_contact_messages.INVALID_ID,
        "string.empty": company_contact_messages.INVALID_ID,
        "string.hex": company_contact_messages.INVALID_ID,
        "string.length": company_contact_messages.INVALID_ID,
      }),
  })
  .unknown(false);

module.exports = company_contact_id_params_schema;
