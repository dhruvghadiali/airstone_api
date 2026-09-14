/**
 * Everything the raw material feature offers, in one import.
 *
 * This is the only path other features use: `require("@helpers/raw_material")`.
 * Reaching past it into `constants/`, `db/` or `utils/` from outside this folder
 * is not allowed, so a file can move between them without breaking a caller.
 *
 *   constants/  the columns a raw material answers with
 *   db/         the one reference check, which answers with the row
 *   utils/      pure logic: duplicate key wording
 *
 * `find_active_raw_material` returns the material rather than a boolean. A
 * caller proving the reference usually wants a field off it in the same breath
 * -- the purchase controller needs its `unit` -- so one query does both jobs.
 *
 * Whether a company may supply us is not here. That is a fact about companies,
 * so it lives with the company helpers as `is_active_supplier_company_exists`.
 */
const { find_active_raw_material } = require("@helpers/raw_material/db");
const {
  raw_material_response,
  RAW_MATERIAL_SELECT,
} = require("@helpers/raw_material/constants");
const {
  map_raw_material_duplicate_error,
  run_with_raw_material_duplicate_mapping,
} = require("@helpers/raw_material/utils");

module.exports = {
  find_active_raw_material,
  raw_material_response,
  RAW_MATERIAL_SELECT,
  map_raw_material_duplicate_error,
  run_with_raw_material_duplicate_mapping,
};
