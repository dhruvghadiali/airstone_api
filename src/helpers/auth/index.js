/**
 * Everything the auth feature offers, in one import.
 *
 * This is the only path other features use: `require("@helpers/auth")`. Reaching
 * past it into `db/`, `utils/` or `constants/` from outside this folder is not
 * allowed, so a file can move between those three without breaking a caller.
 *
 *   constants/  values only auth uses, and the signin response shape
 *   db/         reads against the users collection
 *   utils/      pure logic: tokens, employee id formatting, error translation
 */
const { auth_response, CREDENTIAL_SELECT } = require("@helpers/auth/constants");
const {
  get_next_emp_id,
  assert_caller_password,
  get_last_emp_id_sequence,
  authenticate_by_user_type,
} = require("@helpers/auth/db");
const {
  format_emp_id,
  get_jwt_secret,
  verify_auth_token,
  build_emp_id_prefix,
  generate_auth_token,
  build_signin_payload,
  map_user_duplicate_error,
  is_emp_id_duplicate_error,
  run_with_user_duplicate_mapping,
} = require("@helpers/auth/utils");

module.exports = {
  auth_response,
  CREDENTIAL_SELECT,
  get_next_emp_id,
  assert_caller_password,
  get_last_emp_id_sequence,
  authenticate_by_user_type,
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
