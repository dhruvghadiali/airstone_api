/**
 * Everything the raw material feature offers, in one import.
 *
 * This is the only path other features use: `require("@helpers/raw_material")`.
 * Reaching past it into `constants/` or `utils/` from outside this folder is
 * not allowed, so a file can move between them without breaking a caller.
 *
 * constants/  the columns a raw material answers with utils/      pure logic:
 * duplicate key wording
 *
 * There is no `db/` folder. The one lookup this feature runs before a write
 * asks whether a company may supply us, and that lives with the company helpers
 * because it is a fact about companies.
 */
const {
  raw_material_response,
  RAW_MATERIAL_SELECT,
} = require("@helpers/raw_material/constants");
const {
  map_raw_material_duplicate_error,
  run_with_raw_material_duplicate_mapping,
} = require("@helpers/raw_material/utils");

module.exports = {
  raw_material_response,
  RAW_MATERIAL_SELECT,
  map_raw_material_duplicate_error,
  run_with_raw_material_duplicate_mapping,
};
