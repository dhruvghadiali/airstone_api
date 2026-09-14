/**
 * Everything the raw material purchase feature offers, in one import.
 *
 * This is the only path other features use:
 * `require("@helpers/raw_material_purchase")`. Reaching past it into
 * `constants/` or `utils/` from outside this folder is not allowed, so a file
 * can move between them without breaking a caller.
 *
 *   constants/  the columns a purchase answers with
 *   utils/      pure logic: the money on a purchase adding up
 *
 * There is no `db/` folder. The two lookups a purchase runs before its write ask
 * whether a material and a company exist, and each lives with the feature that
 * owns that row -- `find_active_raw_material` with the raw materials,
 * `is_active_supplier_company_exists` with the companies.
 */
const {
  assert_purchase_amounts,
} = require("@helpers/raw_material_purchase/utils");
const {
  raw_material_purchase_response,
  RAW_MATERIAL_PURCHASE_SELECT,
} = require("@helpers/raw_material_purchase/constants");

module.exports = {
  assert_purchase_amounts,
  raw_material_purchase_response,
  RAW_MATERIAL_PURCHASE_SELECT,
};
