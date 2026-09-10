const joi = require("joi");

const { manageable_user_types } = require("@enums");
const { user_validation_messages } = require("@validators/messages");

/**
 * What the super admin's user table may be narrowed by.
 *
 * `base_filter` is always applied and the caller cannot switch it off: a super
 * admin account is never listed, so this endpoint can never be used to enumerate
 * the accounts that administer the system. That is the whole reason the scope is
 * a `base_filter` and not a default in a schema -- a default is something a
 * caller may override, and this must not be.
 *
 * `user_type` is exposed as an exact filter all the same, so the table can be
 * narrowed to admins or to employees. That is safe only because its Joi
 * `valid(...)` list is `manageable_user_types` rather than every user type: an
 * exact filter *replaces* the base scope for its column instead of intersecting
 * with it, so `?user_type=super_admin` would reach super admin rows if the
 * schema accepted the value. It does not, so the request is a 400 naming the two
 * types that work. Never widen that list without also removing this column from
 * the filters.
 *
 * `text_filters` are the per column boxes in the table header. Each is a case
 * insensitive "contains" and each narrows independently, so filling in two of
 * them asks for rows matching both. The identifier columns are here even though
 * they are kept out of the single search box: a box under a column heading is a
 * caller saying which column they mean, which is exactly what the global box
 * cannot know.
 *
 * `is_active` defaults to true, so the table shows live accounts unless the
 * caller asks otherwise. A default rather than part of the base scope, because a
 * deactivated account must stay reachable -- `?is_active=false` is the only way
 * to see one at all today.
 */
const user_filter_config = Object.freeze({
  base_filter: Object.freeze({
    user_type: Object.freeze({ $in: manageable_user_types }),
  }),
  text_filters: Object.freeze([
    "first_name",
    "last_name",
    "email",
    "phone_number",
    "emp_id",
    "username",
  ]),
  exact_filters: Object.freeze({
    user_type: joi
      .string()
      .trim()
      .valid(...manageable_user_types)
      .messages({
        "string.base": user_validation_messages.USER_TYPE_BASE,
        "string.empty": user_validation_messages.USER_TYPE_EMPTY,
        "any.only": user_validation_messages.USER_TYPE_UNLISTABLE,
      }),
    is_active: joi.boolean().default(true).messages({
      "boolean.base": user_validation_messages.IS_ACTIVE_BASE,
    }),
  }),
  date_filters: Object.freeze(["created_at"]),
});

module.exports = { user_filter_config };
