const {
  company_sort_config,
} = require("@validators/query_params/company/config/sort_config");
const {
  company_filter_config,
} = require("@validators/query_params/company/config/filter_config");
const {
  company_search_config,
} = require("@validators/query_params/company/config/search_config");

/**
 * The company table's contract, assembled from the three files under `config/`
 * -- one per concern, so widening what may be filtered is never done in the same
 * edit as widening what may be sorted.
 *
 * Read by two consumers: `build_list_query_schema` turns it into the Joi schema
 * the route validates against, and `build_list_query` turns a validated query
 * into the Mongo filter. Both read this one object, so a column can never be
 * available in one and unknown in the other.
 *
 * Every column it names is the company's own, so `list_companies` builds its
 * query synchronously and awaits no lookup. The response still carries each
 * company's addresses and contacts -- that is the response shape's doing, not
 * this contract's. If a child column is ever made filterable or searchable, it
 * arrives here as `reference_filters` or `reference_search`, and the controller
 * has to start awaiting `apply_reference_filters`.
 *
 * Pagination is deliberately absent: `page` and `limit` are the same on every
 * table and come from `pagination_defaults`.
 */
const list_companies_config = Object.freeze({
  ...company_filter_config,
  ...company_search_config,
  ...company_sort_config,
});

module.exports = { list_companies_config };
