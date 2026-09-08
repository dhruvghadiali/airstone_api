const joi = require("joi");

const { list_query_error_codes } = require("@validators/constants");
const {
  date_filter_params,
  parse_date_boundary,
} = require("@helpers/list_query");

/**
 * Builds the `.custom()` validator for one end of a date range.
 *
 * Curried: called once per boundary with the widening rule, and the function it
 * returns is what Joi runs per request.
 *
 * Parsing happens in the schema rather than in the controller, so what reaches
 * the query builder is a `Date` and never a date string.
 *
 * Private to this file -- a boundary validator is of no use without the pair of
 * parameters below that it belongs to.
 *
 * @param   {boolean} end_of_day  Widen a plain date to the last instant of that
 *   day instead of the first. True for the `_to` end, because "up to the 15th"
 *   means the whole of the 15th to the person who picked it.
 * @returns {Function} A Joi custom validator returning a `Date`, or raising
 *   `DATE_INVALID` when the value is not a date this API accepts.
 */
const build_boundary_validator =
  (end_of_day) =>
  (value, helpers) =>
    parse_date_boundary(value, { end_of_day }) ||
    helpers.error(list_query_error_codes.DATE_INVALID);

/**
 * Turns each date column the resource lists into a `<prefix>_from` /
 * `<prefix>_to` pair, so `created_at` is filtered through `created_from` and
 * `created_to`. The caller never names the stored column.
 *
 * @param   {Object} [config={}]             The resource's list config.
 * @param   {string[]} [config.date_filters] Date columns to accept a range for.
 * @returns {Object<string, import("joi").Schema>} Two entries per column, keyed
 *   by parameter name.
 */
const build_date_filter_schemas = (config = {}) =>
  Object.fromEntries(
    (config.date_filters || []).flatMap((field) => {
      const { from, to } = date_filter_params(field);

      return [
        [from, joi.string().trim().custom(build_boundary_validator(false))],
        [to, joi.string().trim().custom(build_boundary_validator(true))],
      ];
    }),
  );

/**
 * Builds the cross-field check that a range does not end before it starts.
 *
 * Applied to the whole query rather than to one parameter, because neither
 * boundary can see the other on its own. A backwards range is a mistake worth
 * naming, not an empty page the caller has to work out for themselves.
 *
 * Runs after each boundary has been parsed, so it compares `Date` objects and
 * not strings -- which is why it can be a plain `>` comparison.
 *
 * @param   {Object} [config={}]             The resource's list config.
 * @param   {string[]} [config.date_filters] Date columns to check.
 * @returns {Function} A Joi custom validator returning the query unchanged, or
 *   raising `DATE_RANGE` naming the two parameters at fault.
 */
const build_date_range_validator =
  (config = {}) =>
  (value, helpers) => {
    for (const field of config.date_filters || []) {
      const { from, to } = date_filter_params(field);

      if (value[from] && value[to] && value[from] > value[to]) {
        return helpers.error(list_query_error_codes.DATE_RANGE, { from, to });
      }
    }

    return value;
  };

module.exports = { build_date_filter_schemas, build_date_range_validator };
