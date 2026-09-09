const {
  build_list_query_schema,
} = require("@validators/query_params/factory");
const {
  list_companies_config,
} = require("@validators/query_params/company/list_companies_config");

const list_companies_query_schema = build_list_query_schema(
  list_companies_config,
);

module.exports = list_companies_query_schema;
