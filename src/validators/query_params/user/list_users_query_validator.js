const {
  build_list_query_schema,
} = require("@validators/query_params/factory");
const {
  list_users_config,
} = require("@validators/query_params/user/list_users_config");

const list_users_query_schema = build_list_query_schema(list_users_config);

module.exports = list_users_query_schema;
