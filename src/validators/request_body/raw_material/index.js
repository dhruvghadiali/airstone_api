/**
 * The raw material feature's request body schemas.
 *
 * Other folders import from `@validators/request_body`, the layer above. Files
 * inside `src/validators/request_body/raw_material` import each other directly
 * -- a validator reads the field map by path -- never through this file.
 */
const create_raw_material_schema = require("@validators/request_body/raw_material/create_raw_material_validator");

module.exports = { create_raw_material_schema };
