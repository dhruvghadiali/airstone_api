const { get_sort } = require("@helpers/list_query/utils/get_sort");
const { build_filter } = require("@helpers/list_query/utils/build_filter");
const {
  get_pagination,
} = require("@helpers/list_query/utils/get_pagination");
const {
  get_sort_options,
} = require("@helpers/list_query/utils/get_sort_options");

/**
 * The entry point every list endpoint goes through.
 *
 * A resource describes its table once, in a list config under
 * `@validators/query_params/<feature>/`, and this composes the pieces around
 * that config into the four things a `find()` needs: the filter, the sort, the
 * options and the window. The same config builds the Joi schema for the query
 * string, so a column can never be filterable in one place and unknown in the
 * other, and adding a column to a table is a one line change in one file.
 *
 * Which piece reads which part of the config:
 *
 *   build_filter      base_filter, exact_filters, text_filters,
 *                     derived_filters, date_filters
 *   build_search      search_fields
 *   get_sort          sort_fields, text_sort_fields
 *   get_pagination    page, limit
 *
 * Synchronous on purpose. `reference_filters` and `reference_search` need a
 * lookup in another collection first, so they are applied afterwards by
 * `apply_reference_filters` and only by the endpoints that declare them.
 *
 * @param   {Object} [query={}]   The validated query string.
 * @param   {Object} [config={}]  The resource's list config.
 * @returns {{filter: Object, sort: Object, applied_sort: Array,
 *            options: Object, page: number, limit: number, skip: number}}
 */
const build_list_query = (query = {}, config = {}) => {
  const { page, limit, skip } = get_pagination(query);
  const { sort, applied } = get_sort(query, config.sort_fields || []);

  return {
    filter: build_filter(query, config),
    sort,
    applied_sort: applied,
    options: get_sort_options(applied, config.text_sort_fields),
    page,
    limit,
    skip,
  };
};

module.exports = { build_list_query };
