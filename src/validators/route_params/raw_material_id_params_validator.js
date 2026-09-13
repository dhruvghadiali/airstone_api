const joi = require("joi");

const { validation_limits } = require("@validators/constants");
const { raw_material_messages } = require("@validators/messages");

/**
 * The id in `/raw-materials/:id`, addressing one raw material.
 *
 * Every failure maps to the same message. A caller who sent a 23 character id, a
 * non hex one or none at all has made the same mistake from the API's point of
 * view -- the value cannot name a material -- and one stable response is easier
 * to handle than five wordings that all mean "fix the id".
 *
 * Whether that id belongs to a material that exists is the controller's
 * question, not this schema's.
 */
const raw_material_id_params_schema = joi
  .object({
    id: joi
      .string()
      .hex()
      .length(validation_limits.OBJECT_ID_LENGTH)
      .required()
      .messages({
        "any.required": raw_material_messages.INVALID_ID,
        "string.base": raw_material_messages.INVALID_ID,
        "string.empty": raw_material_messages.INVALID_ID,
        "string.hex": raw_material_messages.INVALID_ID,
        "string.length": raw_material_messages.INVALID_ID,
      }),
  })
  .unknown(false);

module.exports = raw_material_id_params_schema;
