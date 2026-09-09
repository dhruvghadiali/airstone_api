const joi = require("joi");

const { validation_limits } = require("@validators/constants");
const { company_address_messages } = require("@validators/messages");

/**
 * The id in `/companies/addresses/:id`, addressing one company address.
 *
 * One id, not two. An address id is unique on its own, so the company it belongs
 * to is not part of the path and is not something a caller may send. That also
 * means this schema cannot check that the address belongs to any particular
 * company -- there is nothing to compare it against, and the address is reached
 * by an admin who may edit all of them.
 *
 * Every failure maps to the same message, for the reason
 * `company_id_params_schema` gives: a caller who sent a short id, a non hex one
 * or none at all has made the same mistake, and one stable response is easier to
 * handle than five wordings that all mean "fix the id".
 */
const company_address_id_params_schema = joi
  .object({
    id: joi
      .string()
      .hex()
      .length(validation_limits.OBJECT_ID_LENGTH)
      .required()
      .messages({
        "any.required": company_address_messages.INVALID_ID,
        "string.base": company_address_messages.INVALID_ID,
        "string.empty": company_address_messages.INVALID_ID,
        "string.hex": company_address_messages.INVALID_ID,
        "string.length": company_address_messages.INVALID_ID,
      }),
  })
  .unknown(false);

module.exports = company_address_id_params_schema;
