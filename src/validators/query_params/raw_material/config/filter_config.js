const joi = require("joi");

const { raw_material_unit_of_measure } = require("@enums");
const { raw_material_validation_limits } = require("@validators/constants");
const { raw_material_validation_messages } = require("@validators/messages");

/**
 * What the raw material table may be narrowed by.
 *
 * There is no `base_filter`. Every material an admin may see is every material
 * there is, so nothing here is a security boundary; what a caller may reach is
 * decided by the router, which lets only an admin in.
 *
 * `text_filters` are the per column boxes in the table header. Each is a case
 * insensitive "contains" and each narrows independently, so filling in two of
 * them asks for rows matching both.
 *
 * `unit` is an exact filter rather than a text one because it is an enum:
 * `?unit=kg` should be a 400 naming the seven units, not a substring match that
 * happens to find `kilogram`.
 *
 * `minimum_stock_level` is matched exactly, not as a range. A range is the more
 * useful question to ask of a reorder threshold, but the shared builder has no
 * `range_filters` key, and adding one changes every list endpoint at once. That
 * is recorded as its own task rather than worked around here.
 *
 * `is_active` defaults to true, so the table shows live materials unless the
 * caller asks otherwise. It is a default in the schema rather than a
 * `base_filter` on purpose -- a deactivated material has to stay reachable,
 * because finding one is the only way to restore it.
 *
 * `supplier` is absent. A material stores company ids, so narrowing by a
 * supplier's name means resolving it against the companies collection first.
 * That is a `reference_filter`, and it would make this table's controller await
 * `apply_reference_filters`. Not asked for, so not built.
 */
const raw_material_filter_config = Object.freeze({
  text_filters: Object.freeze(["material_name", "material_code"]),
  exact_filters: Object.freeze({
    unit: joi
      .string()
      .trim()
      .valid(...Object.values(raw_material_unit_of_measure))
      .messages({
        "string.base": raw_material_validation_messages.UNIT_BASE,
        "string.empty": raw_material_validation_messages.UNIT_EMPTY,
        "any.only": raw_material_validation_messages.UNIT_INVALID,
      }),
    minimum_stock_level: joi
      .number()
      .min(raw_material_validation_limits.MINIMUM_STOCK_LEVEL_MIN)
      .max(raw_material_validation_limits.MINIMUM_STOCK_LEVEL_MAX)
      .messages({
        "number.base":
          raw_material_validation_messages.MINIMUM_STOCK_LEVEL_BASE,
        "number.min": raw_material_validation_messages.MINIMUM_STOCK_LEVEL_MIN,
        "number.max": raw_material_validation_messages.MINIMUM_STOCK_LEVEL_MAX,
      }),
    is_active: joi.boolean().default(true).messages({
      "boolean.base": raw_material_validation_messages.IS_ACTIVE_BASE,
    }),
  }),
});

module.exports = { raw_material_filter_config };
