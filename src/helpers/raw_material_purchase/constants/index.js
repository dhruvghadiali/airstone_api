/**
 * The columns a raw material purchase answers with.
 *
 * Other folders import from `@helpers/raw_material_purchase`, the layer above.
 * Files inside `src/helpers/raw_material_purchase` import each other directly,
 * never through this file.
 */
const {
  raw_material_purchase_response,
  RAW_MATERIAL_PURCHASE_SELECT,
} = require("@helpers/raw_material_purchase/constants/raw_material_purchase_response");

module.exports = {
  raw_material_purchase_response,
  RAW_MATERIAL_PURCHASE_SELECT,
};
