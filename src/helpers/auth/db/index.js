/**
 * The auth helper's database reads. Everything in here touches the `users`
 * collection.
 *
 * Other folders import from this file. Files inside `src/helpers/auth/db` import
 * each other directly, never through this file.
 */
const { get_next_emp_id } = require("@helpers/auth/db/get_next_emp_id");
const {
  assert_caller_password,
} = require("@helpers/auth/db/assert_caller_password");
const {
  get_last_emp_id_sequence,
} = require("@helpers/auth/db/get_last_emp_id_sequence");
const {
  authenticate_by_user_type,
} = require("@helpers/auth/db/authenticate_by_user_type");

module.exports = {
  get_next_emp_id,
  assert_caller_password,
  get_last_emp_id_sequence,
  authenticate_by_user_type,
};
