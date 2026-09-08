const { user_model } = require("@models/user");
const app_error = require("@middlewares/app_error");

const { http_status } = require("@enums");
const { get_response_shape } = require("@helpers/common");
const { user_messages } = require("@validators/messages");
const { auth_response, CREDENTIAL_SELECT } = require("@helpers/auth/constants");

/**
 * Finds the live account behind a set of credentials, or fails the way an
 * unknown username fails.
 *
 * The work every signin has in common. A signin asks the same two questions
 * whichever door it arrives at -- does a live account of this user type carry
 * this username, and does the stored hash match this password -- so the query
 * and the comparison live here once.
 *
 * `account_type` comes from the controller, which gets it from the router,
 * rather than from the request. Reading it off the body would let one kind of
 * account sign in through another kind's endpoint.
 *
 * Which columns come back is not decided here. `auth_response` declares them and
 * `get_response_shape` reads them, so the projection on the query and the keys
 * on the payload cannot drift apart.
 *
 * @param   {Object} credentials           The validated request body.
 * @param   {string} credentials.username  Username to look up.
 * @param   {string} credentials.password  Password to compare.
 * @param   {string} account_type          The `user_type` this door admits.
 * @returns {Promise<Object>} The account, carrying the configured columns plus
 *                            the password hash the comparison needed.
 * @throws  {app_error} 401 `INVALID_CREDENTIALS` when no active account of that
 *                      type has the username, or the password is wrong.
 */
const authenticate_by_user_type = async (credentials, account_type) => {
  const { select, populate } = get_response_shape(auth_response, "signin");

  // The projection rides on the query rather than being applied afterwards, so
  // the columns the config leaves out never travel back from the database.
  // A soft deleted account must not be able to sign back in.
  const user = await user_model
    .findOne({
      username: credentials.username,
      user_type: account_type,
      is_active: true,
    })
    .select(`${select} ${CREDENTIAL_SELECT}`)
    .populate(populate);

  // An unknown username and a wrong password fail with one message on purpose.
  // Telling them apart would turn the endpoint into a way of discovering which
  // usernames exist.
  if (!user || !(await user.compare_password(credentials.password))) {
    throw new app_error(
      http_status.UNAUTHORIZED,
      user_messages.INVALID_CREDENTIALS,
    );
  }

  return user;
};

module.exports = { authenticate_by_user_type };
