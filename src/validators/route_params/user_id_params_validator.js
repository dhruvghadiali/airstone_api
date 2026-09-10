const joi = require("joi");

const { user_messages } = require("@validators/messages");
const { validation_limits } = require("@validators/constants");

/**
 * The id in `/users/:id` and `/employees/:id`, addressing one account.
 *
 * One schema for both, because both name an account by the same id in the same
 * collection. What each route may do with that account is decided by its
 * controller's scope, not here.
 *
 * Every failure maps to the same message. A caller who sent a 23 character id, a
 * non hex one or none at all has made the same mistake from the API's point of
 * view -- the value cannot name an account -- and one stable response is easier
 * to handle than five wordings that all mean "fix the id".
 *
 * Whether that id belongs to an account that exists, is still active, or is one
 * the caller may reach is the controller's question, not this schema's.
 */
const user_id_params_schema = joi
  .object({
    id: joi
      .string()
      .hex()
      .length(validation_limits.OBJECT_ID_LENGTH)
      .required()
      .messages({
        "any.required": user_messages.INVALID_ID,
        "string.base": user_messages.INVALID_ID,
        "string.empty": user_messages.INVALID_ID,
        "string.hex": user_messages.INVALID_ID,
        "string.length": user_messages.INVALID_ID,
      }),
  })
  .unknown(false);

module.exports = user_id_params_schema;
