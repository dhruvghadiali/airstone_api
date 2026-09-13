const joi = require("joi");

const { raw_material_validation_messages } = require("@validators/messages");
const {
  base_raw_material_fields,
} = require("@validators/request_body/raw_material/raw_material_fields");

/**
 * What an admin may send to add a raw material.
 *
 * The material's own columns and nothing else. `is_active`, `created_by` and
 * `updated_by` are absent, so sending one is a 400 rather than a field that is
 * quietly ignored. They are the server's to set, and `created_by` in particular
 * is who is signed in, which the caller does not get to choose.
 *
 * Whether each id in `supplier` names a company we buy from is the controller's
 * question. This schema only says the id could name one.
 */
const create_raw_material_schema = joi
  .object(base_raw_material_fields)
  .unknown(false)
  .messages({
    "object.unknown": raw_material_validation_messages.UNKNOWN_FIELD,
  });

module.exports = create_raw_material_schema;
