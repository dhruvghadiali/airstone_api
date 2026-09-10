/**
 * The employee feature's list query schema.
 *
 * Other folders import from `@validators/query_params`, the layer above. Files
 * inside `src/validators/query_params/employee` import each other directly --
 * the validator reads the composed config by path -- never through this file.
 */
const list_employees_query_schema = require("@validators/query_params/employee/list_employees_query_validator");

module.exports = { list_employees_query_schema };
