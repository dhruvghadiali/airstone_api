const joi = require("joi");

const { raw_material_unit_of_measure } = require("@enums");
const { raw_material_validation_messages } = require("@validators/messages");
const {
  validation_limits,
  raw_material_validation_limits,
  raw_material_validation_patterns,
} = require("@validators/constants");

/**
 * The raw material's own fields, shared by every raw material request.
 *
 * `material_code` is upper cased before the pattern runs, which is what the
 * model does too. So `rm-01` is accepted and stored as `RM-01`, and a caller is
 * not told off for typing a code in lower case.
 *
 * `unit` and every enum field like it is compared exactly. A caller sending
 * `KG` is told the accepted values rather than having the value quietly lower
 * cased, because the model does not lower case it either and the two layers
 * must agree on what they store.
 *
 * `supplier` holds company ids. An entry that is not 24 hex characters cannot
 * name a company, so it is reported with the same message the controller uses
 * for an id that names no live supplier. A caller cannot tell a malformed id
 * from an unknown one, which is exactly what
 * `is_active_supplier_company_exists` says about its own answer.
 *
 * The list is optional. A material is often entered before the buyer has
 * settled who supplies it.
 *
 * Neither `supplier` nor `minimum_stock_level` declares a default here. Both
 * have one on the model, and a second copy at this layer is a copy that drifts.
 * An omitted field reaches the model and the model fills it in.
 */
const base_raw_material_fields = {
  material_name: joi
    .string()
    .trim()
    .min(raw_material_validation_limits.MATERIAL_NAME_MIN)
    .max(raw_material_validation_limits.MATERIAL_NAME_MAX)
    .required()
    .messages({
      "any.required": raw_material_validation_messages.MATERIAL_NAME_REQUIRED,
      "string.base": raw_material_validation_messages.MATERIAL_NAME_BASE,
      "string.empty": raw_material_validation_messages.MATERIAL_NAME_EMPTY,
      "string.min": raw_material_validation_messages.MATERIAL_NAME_MIN,
      "string.max": raw_material_validation_messages.MATERIAL_NAME_MAX,
    }),
  material_code: joi
    .string()
    .trim()
    .uppercase()
    .min(raw_material_validation_limits.MATERIAL_CODE_MIN)
    .max(raw_material_validation_limits.MATERIAL_CODE_MAX)
    .pattern(raw_material_validation_patterns.MATERIAL_CODE)
    .required()
    .messages({
      "any.required": raw_material_validation_messages.MATERIAL_CODE_REQUIRED,
      "string.base": raw_material_validation_messages.MATERIAL_CODE_BASE,
      "string.empty": raw_material_validation_messages.MATERIAL_CODE_EMPTY,
      "string.min": raw_material_validation_messages.MATERIAL_CODE_MIN,
      "string.max": raw_material_validation_messages.MATERIAL_CODE_MAX,
      "string.pattern.base":
        raw_material_validation_messages.MATERIAL_CODE_INVALID,
    }),
  unit: joi
    .string()
    .trim()
    .valid(...Object.values(raw_material_unit_of_measure))
    .required()
    .messages({
      "any.required": raw_material_validation_messages.UNIT_REQUIRED,
      "string.base": raw_material_validation_messages.UNIT_BASE,
      "string.empty": raw_material_validation_messages.UNIT_EMPTY,
      "any.only": raw_material_validation_messages.UNIT_INVALID,
    }),
  supplier: joi
    .array()
    .items(
      joi
        .string()
        .trim()
        .hex()
        .length(validation_limits.OBJECT_ID_LENGTH)
        .messages({
          "string.base": raw_material_validation_messages.SUPPLIER_ITEM_BASE,
          "string.empty": raw_material_validation_messages.SUPPLIER_ITEM_BASE,
          "string.hex": raw_material_validation_messages.SUPPLIER_INVALID,
          "string.length": raw_material_validation_messages.SUPPLIER_INVALID,
        }),
    )
    .messages({
      "array.base": raw_material_validation_messages.SUPPLIER_BASE,
    }),
  minimum_stock_level: joi
    .number()
    .min(raw_material_validation_limits.MINIMUM_STOCK_LEVEL_MIN)
    .max(raw_material_validation_limits.MINIMUM_STOCK_LEVEL_MAX)
    .messages({
      "number.base": raw_material_validation_messages.MINIMUM_STOCK_LEVEL_BASE,
      "number.min": raw_material_validation_messages.MINIMUM_STOCK_LEVEL_MIN,
      "number.max": raw_material_validation_messages.MINIMUM_STOCK_LEVEL_MAX,
    }),
};

module.exports = { base_raw_material_fields };
