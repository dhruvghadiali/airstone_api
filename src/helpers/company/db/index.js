/**
 * The company helper's database reads. Everything in here touches the
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

module.exports = { is_active_company_exists, find_active_company_address };
