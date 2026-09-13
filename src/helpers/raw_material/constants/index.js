/**
 * The values the raw material feature names.
 *
 * Other folders import from this file. Files inside
 * `src/helpers/raw_material/constants` import each other directly, never
 * through this file.
 */
const {
  raw_material_response,
  RAW_MATERIAL_SELECT,
} = require("@helpers/raw_material/constants/raw_material_response");

module.exports = { raw_material_response, RAW_MATERIAL_SELECT };
