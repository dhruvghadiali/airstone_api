const { contains } = require("@helpers/list_query/utils/contains");
const {
  build_date_range,
} = require("@helpers/list_query/utils/build_date_range");
const {
  build_search_filter,
} = require("@helpers/list_query/utils/build_search_filter");

/**
 * Turns a validated list query into the Mongo filter a `find()` runs.
 *
 * Every way a resource can be narrowed is declared in its list config, so this
 * file knows how each *kind* of clause behaves and nothing about any one
 * resource's columns.
 *
 * The kinds, in the order they are applied:
 *
 *   base_filter       always applied, for example the rows a role may see
 *   exact_filters     matched exactly -- enums, booleans
 *   text_filters      per column, case insensitive "contains"
 *   derived_filters   not a column comparison; the config supplies the clause
 *   date_filters      a `<prefix>_from` / `<prefix>_to` range per date column
 *   search            the single box, ORed across search_fields
 *
 * `reference_filters` is absent on purpose. Those have to read another
 * collection before they can be expressed as a clause, so they are applied by
 * `apply_reference_filters` afterwards and this function stays synchronous for
 * the endpoints that need nothing of the sort.
 *
 * @param   {Object} [query={}]   The validated query string.
 * @param   {Object} [config={}]  The resource's list config.
 * @returns {Object} The filter to pass to `find()`.
 */
const build_filter = (query = {}, config = {}) => {
  const filter = { ...(config.base_filter || {}) };

  // An exact filter replaces the base scope for that column rather than adding
  // to it: asking for one user type should not still be ORed with the others.
  for (const field of Object.keys(config.exact_filters || {})) {
    if (query[field] !== undefined) filter[field] = query[field];
  }

  // A filter typed into a single column narrows the result, so each one is its
  // own condition and they combine with AND.
  for (const field of config.text_filters || []) {
    if (query[field]) filter[field] = contains(query[field]);
  }

  // Some questions a table asks are not "column equals value" -- "in stock" is
  // `exit_date: null`. The config supplies the clause, so this stays out of any
  // one resource's vocabulary. Applied before the date ranges, so an explicit
  // range on the same column -- the more specific request -- wins.
  for (const [field, { to_filter }] of Object.entries(
    config.derived_filters || {},
  )) {
    if (query[field] !== undefined) {
      Object.assign(filter, to_filter(query[field]));
    }
  }

  for (const field of config.date_filters || []) {
    const range = build_date_range(query, field);

    if (range) filter[field] = range;
  }

  // Applied last so it cannot be overwritten by a column clause: the search box
  // and the column filters are meant to compose, not to replace one another.
  const search = build_search_filter(query, config);

  if (search) Object.assign(filter, search);

  return filter;
};

module.exports = { build_filter };
