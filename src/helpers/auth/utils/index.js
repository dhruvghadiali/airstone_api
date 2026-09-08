/**
 * The auth helper's pure logic: token signing, employee id formatting and error
 * translation. Nothing in here reads or writes the database.
 *
 * Other folders import from this file. Files inside `src/helpers/auth/utils`
 * import each other directly, never through this file.
 */
const { format_emp_id } = require("@helpers/auth/utils/format_emp_id");
const { get_jwt_secret } = require("@helpers/auth/utils/get_jwt_secret");
const { verify_auth_token } = require("@helpers/auth/utils/verify_auth_token");
const {
  build_emp_id_prefix,
} = require("@helpers/auth/utils/build_emp_id_prefix");
const {
  generate_auth_token,
} = require("@helpers/auth/utils/generate_auth_token");
const {
  build_signin_payload,
} = require("@helpers/auth/utils/build_signin_payload");
const {
  map_user_duplicate_error,
} = require("@helpers/auth/utils/map_user_duplicate_error");
const {
  is_emp_id_duplicate_error,
} = require("@helpers/auth/utils/is_emp_id_duplicate_error");
const {
  run_with_user_duplicate_mapping,
} = require("@helpers/auth/utils/run_with_user_duplicate_mapping");

module.exports = {
  format_emp_id,
  get_jwt_secret,
  verify_auth_token,
  build_emp_id_prefix,
  generate_auth_token,
  build_signin_payload,
  map_user_duplicate_error,
  is_emp_id_duplicate_error,
  run_with_user_duplicate_mapping,
};
