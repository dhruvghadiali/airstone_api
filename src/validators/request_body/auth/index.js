/**
 * The auth feature's request body schemas.
 *
 * Other folders import from `@validators/request_body`, the layer above. Files
 * inside `src/validators/request_body/auth` import each other directly -- a
 * validator reads `user_fields` by path -- never through this file.
 */
const admin_signin_schema = require("@validators/request_body/auth/admin_signin_validator");
const admin_signup_schema = require("@validators/request_body/auth/admin_signup_validator");
const employee_signin_schema = require("@validators/request_body/auth/employee_signin_validator");
const employee_signup_schema = require("@validators/request_body/auth/employee_signup_validator");
const super_admin_signin_schema = require("@validators/request_body/auth/super_admin_signin_validator");
const super_admin_signup_schema = require("@validators/request_body/auth/super_admin_signup_validator");

module.exports = {
  admin_signin_schema,
  admin_signup_schema,
  employee_signin_schema,
  employee_signup_schema,
  super_admin_signin_schema,
  super_admin_signup_schema,
};
