const joi = require("joi");

const { company_messages } = require("@validators/messages");
const { validation_limits } = require("@validators/constants");

/**
 * The id in `/companies/:id`, addressing one company.
 *
 * Every failure maps to the same message. A caller who sent a 23 character id, a
 * non hex one or none at all has made the same mistake from the API's point of
 * view -- the value cannot name a company -- and one stable response is easier
 * to handle than five wordings that all mean "fix the id".
 *
 * Whether that id belongs to a company that exists is the controller's question,
 * not this schema's.
 */
const company_id_params_schema = joi
  .object({
    id: joi
      .string()
      .hex()
      .length(validation_limits.OBJECT_ID_LENGTH)
      .required()
      .messages({
        "any.required": company_messages.INVALID_ID,
        "string.base": company_messages.INVALID_ID,
        "string.empty": company_messages.INVALID_ID,
        "string.hex": company_messages.INVALID_ID,
        "string.length": company_messages.INVALID_ID,
      }),
  })
  .unknown(false);

module.exports = company_id_params_schema;
