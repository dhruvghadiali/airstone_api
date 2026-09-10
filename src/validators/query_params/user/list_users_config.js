const {
  user_sort_config,
} = require("@validators/query_params/user/config/sort_config");
const {
  user_filter_config,
} = require("@validators/query_params/user/config/filter_config");
const {
  user_search_config,
} = require("@validators/query_params/user/config/search_config");

/**
 * The user table's contract, assembled from the three files under `config/` --
 * one per concern, so widening what may be filtered is never done in the same
 * edit as widening what may be sorted.
 *
 * Read by two consumers: `build_list_query_schema` turns it into the Joi schema
 * the route validates against, and `build_list_query` turns a validated query
 * into the Mongo filter. Both read this one object, so a column can never be
 * available in one and unknown to the other.
 *
 * Every column it names is the user's own, so `list_users` builds its query
 * synchronously and awaits no lookup. If a column from another collection is
 * ever made filterable or searchable, it arrives here as `reference_filters` or
 * `reference_search`, and the controller has to start awaiting
 * `apply_reference_filters` -- nothing else would remind whoever adds one.
 *
 * Pagination is deliberately absent: `page` and `limit` are the same on every
 * table and come from `pagination_defaults`.
 */
const list_users_config = Object.freeze({
  ...user_filter_config,
  ...user_search_config,
  ...user_sort_config,
});

module.exports = { list_users_config };
