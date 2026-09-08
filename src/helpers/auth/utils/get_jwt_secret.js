/**
 * Reads the token signing secret out of the environment.
 *
 * Read when a token is handled rather than when this file is imported, so a
 * process that has not loaded its `.env` yet fails on the request that needs the
 * secret instead of failing to start for a reason that points at the wrong file.
 *
 * @returns {string} The value of `JWT_SECRET`.
 * @throws  {Error} When `JWT_SECRET` is not set.
 */
const get_jwt_secret = () => {
  const jwt_secret = process.env.JWT_SECRET;

  if (!jwt_secret) {
    throw new Error("JWT_SECRET environment variable is required");
  }

  return jwt_secret;
};

module.exports = { get_jwt_secret };
