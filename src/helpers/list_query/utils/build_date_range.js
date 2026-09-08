const {
  date_filter_params,
} = require("@helpers/list_query/utils/date_filter_params");

/**
 * Builds the range clause for one date column.
 *
 * Either end may be left out, so a caller can ask for "everything since
 * Monday" without also naming an end. The values are already `Date` objects by
 * the time they get here -- the schema ran them through `parse_date_boundary`.
 *
 * @param   {Object} query  The validated query string.
 * @param   {string} field  The date column, for example `"created_at"`.
 * @returns {Object|null} A `$gte`/`$lte` clause, or null when neither end is set.
 */
const build_date_range = (query, field) => {
  const { from, to } = date_filter_params(field);
  const range = {};

  if (query[from]) range.$gte = query[from];
  if (query[to]) range.$lte = query[to];

  return Object.keys(range).length ? range : null;
};

module.exports = { build_date_range };
