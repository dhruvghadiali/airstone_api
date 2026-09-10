const {
  build_list_query_schema,
} = require("@validators/query_params/factory");
const {
  list_employees_config,
} = require("@validators/query_params/employee/list_employees_config");

const list_employees_query_schema = build_list_query_schema(
  list_employees_config,
);

module.exports = list_employees_query_schema;
