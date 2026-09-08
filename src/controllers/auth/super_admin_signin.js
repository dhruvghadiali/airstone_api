const { http_status, user_type } = require("@enums");
const { user_messages } = require("@validators/messages");
const { send_response } = require("@helpers/common");
const {
  build_signin_payload,
  authenticate_by_user_type,
} = require("@helpers/auth");

/**
 * Signs a super admin in and issues the JWT their later requests carry.
 *
 * Public because this is one of the endpoints that hands a token out rather
 * than asking for one.
 *
 * The user type is fixed to `user_type.SUPER_ADMIN` here and never read from
 * the request, so an admin or an employee with valid credentials is still
 * refused: the token issued here is the one that opens the super admin
 * routes. An account must also be active; one that was deactivated cannot
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
 * @route   POST /super-admin/auth/signin
 * @access  Public
 *
 * @param   {import("express").Request} req
 * @param   {Object} req.body Validated by `super_admin_signin_schema`, which rejects
 *                            unknown fields.
 * @param   {string} req.body.username Required. 3-50 chars, matched lower case.
 * @param   {string} req.body.password Required. 8-20 chars.
 * @param   {import("express").Response} res
 *
 * @returns {Promise<void>} 200 with the account columns listed in
 *                          `auth_response`, plus `token`.
 *
 * @throws  {app_error} 401 `INVALID_CREDENTIALS` when no active super admin
 *                      matches the username, or the password is wrong.
 */
const super_admin_signin = async (req, res) => {
  const user = await authenticate_by_user_type(req.body, user_type.SUPER_ADMIN);

  return send_response(
    res,
    http_status.OK,
    user_messages.SIGNED_IN,
    build_signin_payload(user),
  );
};

module.exports = super_admin_signin;
