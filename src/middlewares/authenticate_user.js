const jwt = require("jsonwebtoken");

const app_error = require("@middlewares/app_error");

const { http_status, user_type } = require("@enums");
const { user_messages } = require("@validators/messages");
const { verify_auth_token } = require("@helpers/auth");

/**
 * The roles a token is allowed to claim.
 *
 * Read from the enum once at load time rather than on every request, because
 * the set cannot change while the process is running. It is used twice below:
 * to reject a token claiming a role this API has never had, and to catch a
 * misspelled role at mount time.
 *
 * @type {string[]}
 */
const supported_user_types = Object.values(user_type);

/**
 * Pulls the token out of an `Authorization` header.
 *
 * Private to this file. The header is split on whitespace and checked as a
 * whole, so `Bearer` with no token, a bare token with no scheme, and
 * `Bearer a b` are all rejected rather than half read. Anything unexpected
 * returns null and is answered as a missing token, because a caller who sent
 * a malformed header has not proved anything either way.
 *
 * The scheme is compared case insensitively -- HTTP treats it that way, and
 * some clients send `bearer`.
 *
 * @param   {*} authorization_header  The raw header value, or undefined.
 * @returns {string|null} The token, or null when the header is absent or is
 *                        not a single well formed Bearer credential.
 */
const get_bearer_token = (authorization_header) => {
  if (typeof authorization_header !== "string") return null;

  const [scheme, token, extra] = authorization_header.trim().split(/\s+/);

  if (scheme?.toLowerCase() !== "bearer" || !token || extra) return null;

  return token;
};

/**
 * Checks the caller's token and puts who they are on the request.
 *
 * Mount this on any router that must not be reachable without signing in. It
 * proves the token is real; it does not decide what the holder may do. That
 * is `authorize_user_types` below, and the two are normally used together in
 * that order.
 *
 * On success it sets `req.user` to `{ id, user_type }`. That is the contract
 * every controller downstream reads, so nothing else should write to it.
 *
 * Both fields come from the token rather than from the database, which is a
 * deliberate trade. It saves a query on every authenticated request, and it
 * means a change made after the token was issued is not seen until the token
 * expires: a user deactivated an hour ago still passes here, and a role taken
 * off an account still opens that role's routes. Anything that must not act
 * on a stale account has to read the account back. `assert_caller_password`
 * in `@helpers/auth` is how the sensitive endpoints do that.
 *
 * A token whose payload has no subject, or claims a role this API does not
 * have, is treated as invalid rather than as a server fault. It is a properly
 * signed token that cannot describe a real caller, which in practice means a
 * token from another system, or one issued before a role was removed.
 *
 * @param   {import("express").Request} req   Reads the `Authorization`
 *                                            header; gains `req.user` on
 *                                            success.
 * @param   {import("express").Response} _res Unused. This middleware never
 *                                            answers; it passes or fails.
 * @param   {import("express").NextFunction} next
 * @returns {void} Calls `next()` when the token is good, `next(error)` when
 *                 it is not.
 *
 * @throws  {app_error} 401 `AUTH_TOKEN_REQUIRED` when no usable Bearer token
 *                      was sent. Passed to `next`, not thrown.
 * @throws  {app_error} 401 `AUTH_TOKEN_EXPIRED` when the token has expired.
 * @throws  {app_error} 401 `INVALID_AUTH_TOKEN` when the signature does not
 *                      match, the token is malformed, or the payload cannot
 *                      describe a caller.
 */
const authenticate_user = (req, _res, next) => {
  const token = get_bearer_token(req.get("authorization"));

  if (!token) {
    return next(
      new app_error(
        http_status.UNAUTHORIZED,
        user_messages.AUTH_TOKEN_REQUIRED,
      ),
    );
  }

  try {
    const payload = verify_auth_token(token);

    // Thrown as a JsonWebTokenError rather than handled as its own failure, so
    // the one catch below answers it with the same 401 as a bad signature. To
    // a caller the two are the same thing: a token this API will not act on.
    if (!payload.sub || !supported_user_types.includes(payload.user_type)) {
      throw new jwt.JsonWebTokenError("Invalid authentication token payload");
    }

    req.user = {
      id: payload.sub,
      user_type: payload.user_type,
    };

    return next();
  } catch (error) {
    // An expired token is told apart from an invalid one on purpose. The
    // caller signed in correctly and only needs to sign in again, which is
    // worth saying. Neither message reveals anything about the account.
    if (error instanceof jwt.TokenExpiredError) {
      return next(
        new app_error(
          http_status.UNAUTHORIZED,
          user_messages.AUTH_TOKEN_EXPIRED,
        ),
      );
    }

    if (error instanceof jwt.JsonWebTokenError) {
      return next(
        new app_error(
          http_status.UNAUTHORIZED,
          user_messages.INVALID_AUTH_TOKEN,
        ),
      );
    }

    // Anything else -- a missing JWT_SECRET, for one -- is a server fault and
    // is passed through untouched, so the error handler answers it as a 500.
    // Turning it into a 401 would tell a caller their credentials were wrong
    // when the real problem is that the server is misconfigured.
    return next(error);
  }
};

/**
 * Builds a middleware that lets only the named roles through.
 *
 * Mount it after `authenticate_user`, which is what puts `req.user` there:
 *
 *   router.use(authenticate_user);
 *   router.use(authorize_user_types(user_type.SUPER_ADMIN, user_type.ADMIN));
 *
 * Pass roles from the `user_type` enum, never bare strings, so a renamed role
 * stays a change in one file.
 *
 * The role list is checked when the middleware is built rather than when a
 * request arrives, so a misspelled or unknown role fails at startup instead
 * of silently locking everyone out of a route nobody tested. That is also why
 * it throws here rather than passing an error to `next`: there is no request
 * yet, and the mistake is the developer's, not a caller's.
 *
 * A missing `req.user` is refused with the same 403 as a wrong role. It means
 * this was mounted without `authenticate_user` in front of it, and failing
 * closed is the only safe reading of that.
 *
 * @param   {...string} allowed_user_types  One or more values from
 *                                          `user_type`.
 * @returns {import("express").RequestHandler} Middleware that calls `next()`
 *                                             for an allowed role and
 *                                             `next(error)` otherwise.
 *
 * @throws  {TypeError} At mount time, when no role is given or one of them is
 *                      not a supported `user_type`.
 * @throws  {app_error} 403 `ACCESS_FORBIDDEN` at request time, when the
 *                      caller's role is not in the list, or `req.user` is
 *                      absent. Passed to `next`, not thrown.
 */
const authorize_user_types = (...allowed_user_types) => {
  if (
    !allowed_user_types.length ||
    allowed_user_types.some((type) => !supported_user_types.includes(type))
  ) {
    throw new TypeError("At least one supported user type is required");
  }

  return (req, _res, next) => {
    if (!req.user || !allowed_user_types.includes(req.user.user_type)) {
      return next(
        new app_error(http_status.FORBIDDEN, user_messages.ACCESS_FORBIDDEN),
      );
    }

    return next();
  };
};

module.exports = { authenticate_user, authorize_user_types };
