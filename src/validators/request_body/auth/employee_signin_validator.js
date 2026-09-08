const joi = require("joi");

const { user_validation_messages } = require("@validators/messages");
const {
  password,
  username,
} = require("@validators/request_body/auth/user_fields");

/**
 * The body a employee signin accepts: a username and a password, nothing else.
 *
 * One schema per role rather than one shared signin schema, because each is
 * mounted on its own role router and named in its own route file. They are
 * identical today; keeping them apart means the day one role needs an extra
 * field -- a workspace, a one time code -- it gains it without touching the
 * other two.
 *
 * `unknown(false)` refuses any other field instead of ignoring it, so a caller
 * sending `user_type` or `role` is told plainly that it is not accepted rather
 * than assuming it took effect. The role is decided by the endpoint, never by
 * the body.
 *
 * Both fields come from `user_fields`, so a signin and a signup can never
 * disagree about what a valid username is.
 *
 * @type {import("joi").ObjectSchema}
 */
const employee_signin_schema = joi
  .object({ username, password })
  .unknown(false)
  .messages({
    "object.unknown": user_validation_messages.UNKNOWN_FIELD,
  });

module.exports = employee_signin_schema;
