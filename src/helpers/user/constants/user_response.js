/**
 * The columns of a user that any endpoint may return.
 *
 * `password` is absent, and its absence here is presentation rather than
 * protection. The column is `select: false` on the schema and the model's
 * `toJSON` deletes it again, so nothing sensitive is left to this list to hide.
 * Never introduce a sensitive column and rely on leaving it out of a projection.
 *
 * `emp_id` and `username` are here because they are how a person is referred to
 * in the office and how they sign in. A directory row without them sends the
 * reader off to another screen to find out who the row is.
 *
 * `user_type` is here because this table mixes admins and employees in one list,
 * so a row that did not say which it is would be unreadable.
 *
 * `is_active` is here because a row that can be deactivated has to tell the
 * client which state it is in, and `updated_at` so a client can tell whether the
 * copy it holds is still the current one.
 *
 * @type {string}
 */
const USER_SELECT = [
  "first_name",
  "last_name",
  "email",
  "phone_number",
  "emp_id",
  "username",
  "user_type",
  "is_active",
  "created_at",
  "updated_at",
].join(" ");

/**
 * The shape every user response is built from.
 *
 * Read through `get_response_shape(user_response, "<action>")`.
 *
 * Only `default` is declared, so every action falls back to it. Listing is the
 * only thing this feature does today, and a `list` variant that was identical to
 * `default` would only be a way for the two to drift.
 *
 * This is a third config over the same collection `auth_response` and
 * `signup_response` describe, and it is deliberately its own rather than a
 * variant of either. Those two describe an event -- who has just signed in, what
 * account has just been created -- and carry the columns that event makes
 * interesting. This one describes a row in a table somebody is reading.
 *
 * `populate` is an empty array rather than missing. `user_model` declares no
 * `ref` and no virtual, so there is nothing to expand; spelling it out keeps the
 * shape handling identical to every other feature's, so the day an account gains
 * a reference the change is one line here and nothing in the controller.
 *
 * @type {Readonly<Object>}
 */
const user_response = Object.freeze({
  default: Object.freeze({
    select: USER_SELECT,
    populate: Object.freeze([]),
  }),
});

module.exports = { user_response, USER_SELECT };
