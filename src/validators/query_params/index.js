/**
 * The barrel every list endpoint's query schema is imported through.
 *
 * A resource declares its searchable, filterable and sortable columns under
 * `src/validators/query_params/<entity>/`, builds its schema from the shared
 * factory in `src/validators/query_params/factory/`, and is re-exported here, so
 * a route imports one name from one place.
 */
const {
  list_companies_query_schema,
} = require("@validators/query_params/company");

module.exports = { list_companies_query_schema };
