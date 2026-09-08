const jwt = require("jsonwebtoken");

const { get_jwt_secret } = require("@helpers/auth/utils/get_jwt_secret");

/**
 * Signs the token a caller sends on every later request.
 *
 * The user id goes in `subject` rather than in the body, because that is the
 * claim JWT already has for "who this token is about". The user type rides
 * along so `authorize_user_types` can check a role without reading the database
 * on every request.
 *
 * Nothing else is put in the token. A token is readable by anyone holding it,
 * and every extra claim is a fact that keeps being true after the account has
 * changed.
 *
 * @param   {Object} user            The signed in account.
 * @param   {Object} user._id        Mongo id, used as the token subject.
 * @param   {string} user.user_type  Role the token grants.
 * @returns {string} A signed JWT, expiring after `JWT_EXPIRES_IN` (1 day when
 *                   the variable is not set).
 * @throws  {Error} When `JWT_SECRET` is not set.
 */
const generate_auth_token = (user) =>
  jwt.sign({ user_type: user.user_type }, get_jwt_secret(), {
    algorithm: "HS256",
    subject: user._id.toString(),
    expiresIn: process.env.JWT_EXPIRES_IN || "1d",
  });

module.exports = { generate_auth_token };
