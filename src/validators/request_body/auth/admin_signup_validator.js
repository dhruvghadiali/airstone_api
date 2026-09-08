const joi = require("joi");

const { user_validation_messages } = require("@validators/messages");
const {
  email,
  first_name,
  last_name,
  phone_number,
  username,
} = require("@validators/request_body/auth/user_fields");

/**
 * The body a super admin sends to create an admin.
 *
 * The same five fields as `employee_signup_schema`, kept as its own file so the
 * two can be told apart at the route and can move apart later without one
 * endpoint quietly changing the other. This matches how the signin schemas are
 * declared.
 *
 * There is no `password` field. Every account starts on
 * `DEFAULT_USER_PASSWORD`, so the caller has nothing to send.
 *
 * There is no `user_type` and no `emp_id` field either, and `.unknown(false)`
 * means sending one is a 400 rather than a value that is quietly ignored. That
 * is what stops an admin from sending `user_type: "admin"` and promoting the
 * person they are creating.
 */
const admin_signup_schema = joi
  .object({
    first_name,
    last_name,
    email,
    phone_number,
    username,
  })
  .unknown(false)
  .messages({
    "object.unknown": user_validation_messages.UNKNOWN_FIELD,
  });

module.exports = admin_signup_schema;
