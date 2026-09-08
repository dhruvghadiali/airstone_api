const { http_status, user_type } = require("@enums");
const { user_messages } = require("@validators/messages");
const { send_response } = require("@helpers/common");
const {
  build_signin_payload,
  authenticate_by_user_type,
} = require("@helpers/auth");

/**
 * Signs an admin in and issues the JWT their later requests carry.
 *
 * Public because this is one of the endpoints that hands a token out rather
 * than asking for one.
 *
 * The user type is fixed to `user_type.ADMIN` here and never read from the
 * request, so a super admin or an employee must use their own signin
 * endpoint. An account must also be active; one that was deactivated cannot
 * sign back in even with the right password.
 *
 * An unknown username and a wrong password fail with the same 401 on purpose.
 * Telling them apart would turn this into a way of discovering which usernames
 * exist.
 *
 * The token carries the user id and user type and expires after
 * `JWT_EXPIRES_IN` (1 day when unset). `authenticate_user` reads it back and
 * `authorize_user_types` checks the role on protected routes.
 *
 * @route   POST /admin/auth/signin
 * @access  Public
 *
 * @param   {import("express").Request} req
 * @param   {Object} req.body Validated by `admin_signin_schema`, which rejects
 *                            unknown fields.
 * @param   {string} req.body.username Required. 3-50 chars, matched lower case.
 * @param   {string} req.body.password Required. 8-20 chars.
 * @param   {import("express").Response} res
 *
 * @returns {Promise<void>} 200 with the account columns listed in
 *                          `auth_response`, plus `token`.
 *
 * @throws  {app_error} 401 `INVALID_CREDENTIALS` when no active admin
 *                      matches the username, or the password is wrong.
 */
const admin_signin = async (req, res) => {
  const user = await authenticate_by_user_type(req.body, user_type.ADMIN);

  return send_response(
    res,
    http_status.OK,
    user_messages.ADMIN_SIGNED_IN,
    build_signin_payload(user),
  );
};

module.exports = admin_signin;
