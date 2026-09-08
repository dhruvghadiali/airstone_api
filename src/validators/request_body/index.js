/**
 * Every request body schema, in one import.
 *
 * A route file names the schema it needs and passes it to `validate_body`:
 *
 *   const { admin_signin_schema } = require("@validators/request_body");
 *
 * Flat rather than grouped by feature, because a route file wants one schema
 * and should not have to know which feature folder it was declared in. The
 * require lines below keep that mapping visible here instead.
 */
const {
  admin_signin_schema,
  admin_signup_schema,
  employee_signin_schema,
  employee_signup_schema,
  super_admin_signin_schema,
  super_admin_signup_schema,
} = require("@validators/request_body/auth");
const {
  create_company_schema,
} = require("@validators/request_body/company");

module.exports = {
  admin_signin_schema,
  admin_signup_schema,
  employee_signin_schema,
  employee_signup_schema,
  super_admin_signin_schema,
  super_admin_signup_schema,
  create_company_schema,
};
