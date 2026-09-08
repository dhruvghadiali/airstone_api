const { user_model } = require("@models/user");
const app_error = require("@middlewares/app_error");

const { http_status } = require("@enums");
const { user_messages } = require("@validators/messages");

/**
 * Re-checks the caller's own password part way through a request.
 *
 * Authentication proves a token is valid and authorisation proves its bearer
 * holds a role; neither proves the person at the keyboard is still the account
 * owner. An endpoint that reverses an administrative decision asks for that
 * proof again, and this is where the asking lives.
 *
 * Every failure answers the same way. A subject that no longer exists, an
 * account deactivated since its token was issued and a wrong password are all
 * one 401: the caller has not proved who they are, and which of the three went
 * wrong is not something a rejected caller should be able to probe for.
 *
 * @param   {string} user_id    The id from the caller's token.
 * @param   {string} password   The password they just typed.
 * @returns {Promise<void>} Resolves when the password matches a live account.
 * @throws  {app_error} 401 `INVALID_CREDENTIALS` on any failure.
 */
const assert_caller_password = async (user_id, password) => {
  // `password` is select:false on the schema, so it has to be named to be read.
  const caller = await user_model.findById(user_id).select("+password");

  if (
    !caller ||
    !caller.is_active ||
    !(await caller.compare_password(password))
  ) {
    throw new app_error(
      http_status.UNAUTHORIZED,
      user_messages.INVALID_CREDENTIALS,
    );
  }
};

module.exports = { assert_caller_password };
