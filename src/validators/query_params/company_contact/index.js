/**
 * The company contact feature's list query schema.
 *
 * Other folders import from `@validators/query_params`, the layer above. Files
 * inside `src/validators/query_params/company_contact` import each other
 * directly -- the validator reads the composed config by path -- never through
 * this file.
 */
const list_company_contacts_query_schema = require("@validators/query_params/company_contact/list_company_contacts_query_validator");

module.exports = { list_company_contacts_query_schema };
