/**
 * The company helper's pure logic. Nothing in here touches the database.
 *
 * Other folders import from this file. Files inside `src/helpers/company/utils`
 * import each other directly, never through this file.
 */
const { build_company_tree } = require("@helpers/company/utils/build_company_tree");
const {
  map_company_duplicate_error,
} = require("@helpers/company/utils/map_company_duplicate_error");
const {
  run_with_company_duplicate_mapping,
} = require("@helpers/company/utils/run_with_company_duplicate_mapping");

module.exports = {
  build_company_tree,
  map_company_duplicate_error,
  run_with_company_duplicate_mapping,
};
