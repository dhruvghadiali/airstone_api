/**
 * The barrel every list endpoint's query schema is imported through.
 *
 * Empty until the first list endpoint lands. A resource declares its
 * searchable, filterable and sortable columns under
 * `src/validators/query_params/<entity>/`, builds its schema from the shared
 * factory in `src/validators/query_params/factory/`, and is re-exported here.
 */
module.exports = {};
