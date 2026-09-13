const _ = require("lodash");
const joi = require("joi");

const { raw_material_validation_messages } = require("@validators/messages");
const {
  base_raw_material_fields,
} = require("@validators/request_body/raw_material/raw_material_fields");

/**
 * The material's own fields, every one of them optional.
 *
 * Built from the create fields rather than typed again, so a bound that changes
 * on create changes here in the same edit. Only requiredness differs between the
 * two, which is what `.optional()` undoes.
 */
const update_raw_material_fields = _.mapValues(
  base_raw_material_fields,
  (schema) => schema.optional(),
);

/**
 * What a raw material may be changed to after it exists.
 *
 * The material's own columns and nothing else. `is_active`, `created_by` and
 * `updated_by` are absent for the same reason they are on create. They are the
 * server's to set, and `updated_by` in particular is who is signed in, which the
 * caller does not get to choose.
 *
 * `supplier` replaces the stored list rather than adding to it, because a PATCH
 * carrying an array says what the list should now be. So a caller removes a firm
 * by sending the list without it, and clears every supplier by sending an empty
 * list. There is no add or remove endpoint.
 *
 * Whether each id in that list names a company we buy from is the controller's
 * question. This schema only says the id could name one.
 *
 * `.min(1)` refuses an empty body. A PATCH that names no field would read the
 * material, write it back unchanged and answer 200, which tells the caller
 * nothing about the fact that they sent nothing.
 *
 * `noDefaults` stops Joi filling in a field the caller left out. Without it a
 * patch of one column would carry the defaults of every other column and write
 * them over what is stored.
 */
const update_raw_material_schema = joi
  .object(update_raw_material_fields)
  .min(1)
  .unknown(false)
  .prefs({ noDefaults: true })
  .messages({
    "object.min": raw_material_validation_messages.UPDATE_MIN,
    "object.unknown": raw_material_validation_messages.UNKNOWN_FIELD,
  });

module.exports = update_raw_material_schema;
