const joi = require("joi");

const {
  raw_material_purchase_validation_messages,
} = require("@validators/messages");
const {
  base_raw_material_purchase_fields,
} = require("@validators/request_body/raw_material_purchase/raw_material_purchase_fields");

/**
 * What an admin may send to record a raw material purchase.
 *
 * The purchase's own columns and its payments, and nothing else. `is_active`,
 * `is_all_material_received`, `created_by` and `updated_by` are absent, so
 * sending one is a 400 rather than a field that is quietly ignored. They are the
 * server's to set, and `created_by` in particular is who is signed in, which the
 * caller does not get to choose.
 *
 * What this schema does not check is whether the money adds up. That is
 * arithmetic across five fields, and it runs in the controller through
 * `assert_purchase_amounts`, which compares in paisa and reports every figure
 * that is wrong at once. Whether `material` and `supplier` name live rows, and
 * whether `unit` matches the material's own, are the controller's too -- both
 * need a query.
 */
const create_raw_material_purchase_schema = joi
  .object(base_raw_material_purchase_fields)
  .unknown(false)
  .messages({
    "object.unknown": raw_material_purchase_validation_messages.UNKNOWN_FIELD,
  });

module.exports = create_raw_material_purchase_schema;
