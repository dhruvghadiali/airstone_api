const user_model = require("@models/user_model");
const app_error = require("@middlewares/app_error");

const { http_status, user_type } = require("@enums");
const { user_messages } = require("@validators/messages");

/**
 * Refuses the signup once a super admin account exists.
 *
 * The system is designed around exactly one super admin. This is the check that
 * holds that rule, and it is also what closes the signup endpoint: the endpoint
 * has to be open to create the first account, and this makes it shut by itself
 * as soon as that account is there.
 *
 * Inactive super admins count. Otherwise switching the one super admin off would
 * reopen public signup, and anyone able to do that could then claim the role.
 * Recovering a lost super admin is a database job on purpose -- see the risk
 * noted in the product document.
 *
 * This is a read followed by a write, so two signups sent at the very same
 * moment can both pass it. The window is small and the endpoint is used once at
 * install time, so it is accepted rather than locked. The unique indexes on
 * email, phone number, and username still stop the two from being duplicates of
 * each other; what they do not stop is two *different* super admins being
 * created together. Making this airtight needs a unique index over `user_type`
 * limited to super admins, which is a migration and is left for v2.
 *
 * @returns {Promise<void>} Resolves when no super admin exists yet.
 *
 * @throws  {app_error} 409 `SUPER_ADMIN_ALREADY_EXISTS` when one is already
 *                      there.
 */
const assert_no_super_admin_exists = async () => {
  const existing_super_admin = await user_model
    .exists({ user_type: user_type.SUPER_ADMIN });

  if (existing_super_admin) {
    throw new app_error(
      http_status.CONFLICT,
      user_messages.SUPER_ADMIN_ALREADY_EXISTS,
    );
  }
};

module.exports = { assert_no_super_admin_exists };
