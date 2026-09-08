/**
 * Everything the list query helper offers, in one import.
 *
 * This is the only path other features use: `require("@helpers/list_query")`.
 * Reaching past it into `db/`, `utils/` or `constants/` from outside this folder
 * is not allowed, so a file can move between those three without breaking a
 * caller.
 *
 *   constants/  the sort collation and the date formats a query accepts
 *   db/         the clauses that need a lookup in another collection
 *   utils/      filter, search, sort and paging, all pure
 *
 * A list endpoint normally needs only two of these: `build_list_query` before
 * the query and `build_pagination` after the count. The rest are exported for
 * the validators, which parse a query string with the same functions that read
 * it, so the two cannot disagree.
 */
const { apply_reference_filters } = require("@helpers/list_query/db");
const {
  TEXT_COLLATION,
  DATE_ONLY,
  HAS_TIMEZONE,
  ACCEPTED_FORMATS,
} = require("@helpers/list_query/constants");
const {
  get_sort,
  contains,
  build_filter,
  parse_sort_key,
  get_pagination,
  parse_sort_list,
  build_pagination,
  get_sort_options,
  build_date_range,
  build_list_query,
  date_filter_params,
  build_search_filter,
  parse_date_boundary,
} = require("@helpers/list_query/utils");

module.exports = {
  apply_reference_filters,
  TEXT_COLLATION,
  DATE_ONLY,
  HAS_TIMEZONE,
  ACCEPTED_FORMATS,
  get_sort,
  contains,
  build_filter,
  parse_sort_key,
  get_pagination,
  parse_sort_list,
  build_pagination,
  get_sort_options,
  build_date_range,
  build_list_query,
  date_filter_params,
  build_search_filter,
  parse_date_boundary,
};
