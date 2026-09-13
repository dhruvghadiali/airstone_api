const {
  raw_material_sort_config,
} = require("@validators/query_params/raw_material/config/sort_config");
const {
  raw_material_filter_config,
} = require("@validators/query_params/raw_material/config/filter_config");
const {
  raw_material_search_config,
} = require("@validators/query_params/raw_material/config/search_config");

/**
 * The raw material table's contract, assembled from the three files under
 * `config/` -- one per concern, so widening what may be filtered is never done
 * in the same edit as widening what may be sorted.
 *
 * Read by two consumers: `build_list_query_schema` turns it into the Joi schema
 * the route validates against, and `build_list_query` turns a validated query
 * into the Mongo filter. Both read this one object, so a column can never be
 * available in one and unknown in the other.
 *
 * Every column it names is the material's own, so `list_raw_materials` builds
 * its query synchronously and awaits no lookup. The response still expands each
 * supplier into the firm behind it -- that is the response shape's doing, not
 * this contract's. If a supplier column is ever made filterable or searchable,
 * it arrives here as `reference_filters` or `reference_search`, and the
 * controller has to start awaiting `apply_reference_filters`.
 *
 * Pagination is deliberately absent: `page` and `limit` are the same on every
 * table and come from `pagination_defaults`.
 */
const list_raw_materials_config = Object.freeze({
  ...raw_material_filter_config,
  ...raw_material_search_config,
  ...raw_material_sort_config,
});

module.exports = { list_raw_materials_config };
