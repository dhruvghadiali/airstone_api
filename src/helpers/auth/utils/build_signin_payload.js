const { auth_response } = require("@helpers/auth/constants");
const { get_response_shape } = require("@helpers/common");
const {
  generate_auth_token,
} = require("@helpers/auth/utils/generate_auth_token");

/**
 * Builds the body of a successful signin: the account as the client is allowed
 * to see it, plus the token that authenticates its next request.
 *
 * The keys are read off the same configured select the query was projected with,
 * rather than spread off the document, because the document at this point still
 * holds the password hash the comparison needed. Adding a column to
 * `auth_response` therefore both fetches it and returns it; removing one does
 * neither.
 *
 * @param   {Object} user  The account `authenticate_by_user_type` returned.
 * @returns {Object} The columns `auth_response` lists, plus `token`.
 */
const build_signin_payload = (user) => {
  const { select } = get_response_shape(auth_response, "signin");

  return {
    ...Object.fromEntries(
      select.split(" ").map((column) => [column, user[column]]),
    ),
    token: generate_auth_token(user),
  };
};

module.exports = { build_signin_payload };
