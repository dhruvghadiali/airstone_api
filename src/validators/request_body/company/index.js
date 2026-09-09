/**
 * The company feature's request body schemas.
 *
 * Other folders import from `@validators/request_body`, the layer above. Files
 * inside `src/validators/request_body/company` import each other directly -- a
 * validator reads the field maps by path -- never through this file.
 */
const create_company_schema = require("@validators/request_body/company/create_company_validator");
const update_company_schema = require("@validators/request_body/company/update_company_validator");

module.exports = { create_company_schema, update_company_schema };
