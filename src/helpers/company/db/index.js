/**
 * The company helper's database reads and writes. Everything in here touches the
 * companies, company addresses or company contacts collections.
 *
 * Other folders import from this file. Files inside `src/helpers/company/db`
 * import each other directly, never through this file.
 */
const {
  is_active_company_exists,
} = require("@helpers/company/db/is_active_company_exists");
const {
  find_active_company_address,
} = require("@helpers/company/db/find_active_company_address");
const {
  create_company_with_relations,
} = require("@helpers/company/db/create_company_with_relations");

module.exports = {
  is_active_company_exists,
  find_active_company_address,
  create_company_with_relations,
};
