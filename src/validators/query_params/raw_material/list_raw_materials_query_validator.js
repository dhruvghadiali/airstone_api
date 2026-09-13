const { build_list_query_schema } = require("@validators/query_params/factory");
const {
  list_raw_materials_config,
} = require("@validators/query_params/raw_material/list_raw_materials_config");

const list_raw_materials_query_schema = build_list_query_schema(
  list_raw_materials_config,
);

module.exports = list_raw_materials_query_schema;
