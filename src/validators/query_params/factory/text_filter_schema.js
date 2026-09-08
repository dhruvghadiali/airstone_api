const joi = require("joi");

const { list_query_limits } = require("@validators/constants");

/**
 * Builds one filter parameter per column the resource lists in `text_filters`
 * -- the boxes in a table header.
 *
 * Every column becomes a parameter of its own name. The type is the same for
 * all of them, a non-empty string, because what varies between them is how the
 * value is matched, and that is the query builder's half of the contract rather
 * than the schema's.
 *
 * @param   {Object} [config={}]           The resource's list config.
 * @param   {string[]} [config.text_filters] Columns to accept a filter for.
 * @returns {Object<string, import("joi").Schema>} One entry per column, keyed
 *   by parameter name. Empty when the resource lists none.
 */
const build_text_filter_schemas = (config = {}) =>
  Object.fromEntries(
    (config.text_filters || []).map((field) => [
      field,
      joi.string().trim().min(list_query_limits.MIN_TEXT_FILTER_CHARS),
    ]),
  );

module.exports = { build_text_filter_schemas };
