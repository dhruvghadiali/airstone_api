const joi = require("joi");

const { parse_sort_list } = require("@helpers/list_query");
const {
  sort_order,
  sort_defaults,
  list_query_error_codes,
} = require("@validators/constants");
const {
  sort_field_message,
  list_query_validation_messages,
} = require("@validators/messages");

/**
 * The directions a sort key may name, read from the enum once at load time.
 *
 * Used both to validate what a caller sent and to build the `sort_order`
 * parameter, so the two cannot disagree about what is accepted.
 *
 * @type {string[]}
 */
const sort_orders = Object.values(sort_order);

/**
 * Builds the `.custom()` validator that checks a multi column sort against the
 * columns the resource allows.
 *
 * Curried: called once per endpoint with that resource's columns, and the
 * function it returns is what Joi runs per request.
 *
 * Parsing is shared with the query builder -- both call `parse_sort_list` -- so
 * a token this accepts is a token that side can read. It returns the parsed
 * keys rather than the raw string, which is why the controller receives a list
 * and never has to split anything itself.
 *
 * Private to this file: it exists only to type the `sort` parameter below.
 *
 * @param   {string[]} [sort_fields=[]]  Columns this resource may sort on.
 * @returns {Function} A Joi custom validator returning the parsed sort keys, or
 *   raising `SORT_EMPTY`, `SORT_MAX`, `SORT_FIELD` or `SORT_ORDER`.
 */
const build_sort_list_validator =
  (sort_fields = []) =>
  (value, helpers) => {
    const keys = parse_sort_list(value);

    if (!keys.length) {
      return helpers.error(list_query_error_codes.SORT_EMPTY);
    }

    if (keys.length > sort_defaults.MAX_FIELDS) {
      return helpers.error(list_query_error_codes.SORT_MAX);
    }

    for (const key of keys) {
      if (!sort_fields.includes(key.sort_by)) {
        return helpers.error(list_query_error_codes.SORT_FIELD, {
          field: key.sort_by,
        });
      }

      if (!sort_orders.includes(key.sort_order)) {
        return helpers.error(list_query_error_codes.SORT_ORDER, {
          field: key.sort_by,
        });
      }
    }

    return keys;
  };

/**
 * Builds the two ways a caller may order a table.
 *
 * `sort` carries the column and its direction in one token (`email:asc`), which
 * is what keeps them in step -- two parallel lists would not survive a caller
 * sending three columns and two directions. `sort_by` and `sort_order` are the
 * older single column form, kept so existing callers keep working. The factory
 * makes the two forms mutually exclusive.
 *
 * @param   {Object} [config={}]           The resource's list config.
 * @param   {string[]} [config.sort_fields] Columns this resource may sort on.
 * @returns {Object<string, import("joi").Schema>} `sort`, `sort_by` and
 *   `sort_order`, keyed by parameter name.
 */
const build_sort_schemas = (config = {}) => {
  const sort_fields = config.sort_fields || [];

  return {
    sort: joi
      .string()
      .trim()
      .custom(build_sort_list_validator(sort_fields))
      .messages({
        [list_query_error_codes.SORT_EMPTY]:
          list_query_validation_messages.SORT_EMPTY,
        [list_query_error_codes.SORT_MAX]:
          list_query_validation_messages.SORT_MAX,
        [list_query_error_codes.SORT_FIELD]: sort_field_message(sort_fields),
        [list_query_error_codes.SORT_ORDER]:
          list_query_validation_messages.SORT_ORDER,
      }),
    sort_by: joi.string().valid(...sort_fields),
    sort_order: joi
      .string()
      .lowercase()
      .valid(...sort_orders),
  };
};

module.exports = { build_sort_schemas };
