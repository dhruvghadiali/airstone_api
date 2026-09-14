/**
 * The purchase helper's pure logic. Nothing in here touches the database, a
 * request or a response.
 *
 * Other folders import from `@helpers/raw_material_purchase`, the layer above.
 * Files inside `src/helpers/raw_material_purchase/utils` import each other
 * directly, never through this file.
 */
const {
  assert_purchase_amounts,
} = require("@helpers/raw_material_purchase/utils/assert_purchase_amounts");

module.exports = { assert_purchase_amounts };
