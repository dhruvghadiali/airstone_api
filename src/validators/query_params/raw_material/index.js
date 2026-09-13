/**
 * The raw material feature's list query schema.
 *
 * Other folders import from `@validators/query_params`, the layer above. Files
 * inside `src/validators/query_params/raw_material` import each other directly
 * -- the validator reads the composed config by path, and the composed config
 * reads the three concern files -- never through this file.
 */
const list_raw_materials_query_schema = require("@validators/query_params/raw_material/list_raw_materials_query_validator");

module.exports = { list_raw_materials_query_schema };
