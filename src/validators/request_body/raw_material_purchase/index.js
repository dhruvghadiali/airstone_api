/**
 * The raw material purchase feature's request body schemas.
 *
 * Other folders import from `@validators/request_body`, the layer above. Files
 * inside `src/validators/request_body/raw_material_purchase` import each other
 * directly -- the validator reads the field map by path, and that map reads the
 * payment entry schema -- never through this file.
 */
const create_raw_material_purchase_schema = require("@validators/request_body/raw_material_purchase/create_raw_material_purchase_validator");

module.exports = { create_raw_material_purchase_schema };
