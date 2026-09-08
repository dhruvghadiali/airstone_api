const { user_model } = require("@models/user");

const { retry_when } = require("@helpers/common");
const {
  emp_id_generation,
  DEFAULT_USER_PASSWORD,
} = require("@validators/constants");
const { get_next_emp_id } = require("@helpers/auth/db/get_next_emp_id");
const {
  is_emp_id_duplicate_error,
  run_with_user_duplicate_mapping,
} = require("@helpers/auth/utils");

/**
 * Creates an account on behalf of a signed in caller.
 *
 * "Managed" means somebody else made it: a super admin making an admin, or an
 * admin making an employee. It is the counterpart to `super_admin_signup`, which is
 * the one account nobody else makes.
 *
 * The group is a fixed argument, never part of `details`. The route decides who
 * may call, and the caller decides who the person is; nothing the caller sends
 * can change which group the new account lands in. Both signup schemas refuse
 * a `user_type` field, so the two guards meet in the middle.
 *
 * The password is the shared default. It is written in plain text here and
 * hashed by the model before it reaches the database, exactly as a typed
 * password would be.
 *
 * The emp_id handling matches the signup endpoint, and for the same reasons:
 * two accounts created in the same instant work out the same id, the unique
 * index rejects one, and that clash is the server's own doing rather than the
 * caller's, so it is retried with a freshly read sequence. A clashing email,
 * phone number or username is the caller's to fix and is returned instead.
 *
 * The duplicate mapping sits outside the retry deliberately. Mapping first
 * would rewrite the emp_id collision into an app_error that
 * `is_emp_id_duplicate_error` no longer recognises, and the retry would never
 * fire.
 *
 * @param   {Object} details  A validated signup body: first name,
 *                            last name, email, phone number, username.
 * @param   {string} group    The new account's `user_type`. Pass a value from
 *                            the `user_type` enum, never a bare string.
 * @returns {Promise<import("mongoose").Document>} The created user.
 *
 * @throws  {app_error} 409 `ALREADY_EXISTS` when the email, phone number or
 *                      username already belongs to another user.
 * @throws  {app_error} 409 `EMP_ID_SEQUENCE_EXHAUSTED` once 999 accounts exist
 *                      for the current month.
 */
const create_managed_user = (details, group) =>
  run_with_user_duplicate_mapping(() =>
    retry_when(
      is_emp_id_duplicate_error,
      emp_id_generation.MAX_ATTEMPTS,
      async () =>
        user_model.create({
          ...details,
          emp_id: await get_next_emp_id(),
          user_type: group,
          password: DEFAULT_USER_PASSWORD,
        }),
    ),
  );

module.exports = { create_managed_user };
