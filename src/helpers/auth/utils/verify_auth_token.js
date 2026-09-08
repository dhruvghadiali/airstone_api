const jwt = require("jsonwebtoken");

const { get_jwt_secret } = require("@helpers/auth/utils/get_jwt_secret");

/**
 * Checks a token and returns what it claims.
 *
 * The algorithm is pinned to the one `generate_auth_token` signs with. Without
 * that, a caller could hand back a token that names its own algorithm and get it
 * accepted on those terms.
 *
 * Failures are thrown, not returned, so the middleware can tell an expired token
 * from a tampered one and answer each with its own message.
 *
 * @param   {string} token  The raw JWT, without the `Bearer ` prefix.
 * @returns {Object} The decoded payload: `sub` (user id) and `user_type`.
 * @throws  {jwt.TokenExpiredError} When the token has expired.
 * @throws  {jwt.JsonWebTokenError} When the token is malformed or the signature
 *                                  does not match.
 * @throws  {Error} When `JWT_SECRET` is not set.
 */
const verify_auth_token = (token) =>
  jwt.verify(token, get_jwt_secret(), { algorithms: ["HS256"] });

module.exports = { verify_auth_token };
