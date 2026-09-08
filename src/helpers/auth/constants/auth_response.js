/**
 * The shape every signin response is built from.
 *
 * `password` is absent, and its absence here is presentation rather than
 * protection: the schema marks it `select: false` and the model's `toJSON`
 * deletes it again, so nothing sensitive is left to this list to hide. The
 * signin query does ask for it -- a bcrypt comparison needs the hash -- but it
 * asks separately, using `CREDENTIAL_SELECT`.
 *
 * `_id` is listed even though Mongo returns it whether a projection names it or
 * not, because this list is read twice: once as the query's projection and once
 * as the set of columns the payload carries. Leaving it implicit would put it in
 * the document and out of the response.
 *
 * `is_active` and `updated_at` are deliberately absent. A client that has just
 * signed in knows its account is live -- an inactive one could not have got here
 * -- and has no edit screen to version.
 *
 * @type {string}
 */
const SIGNED_IN_USER_SELECT = [
  "_id",
  "first_name",
  "last_name",
  "email",
  "phone_number",
  "username",
  "user_type",
  "created_at",
].join(" ");

/**
 * Read through `get_response_shape(auth_response, "<action>")`. Only `default`
 * is declared, so every action falls back to it.
 *
 * One shape serves all three signins, because an account reads the same
 * whichever door it came through. They differ in which user type they admit and
 * in the wording of their success message, never in the columns they answer
 * with, so a per endpoint variant would only be a way for them to drift.
 *
 * `populate` is an empty array rather than missing. A user owns every column it
 * answers with -- `user_model` declares no `ref` and no virtual -- so there is
 * nothing to expand today. Spelling it out keeps the signin query's shape
 * handling identical to every other feature's, so the day an account gains a
 * reference the change is one line here and nothing in the helper.
 *
 * @type {Readonly<Object>}
 */
const auth_response = Object.freeze({
  default: Object.freeze({
    select: SIGNED_IN_USER_SELECT,
    populate: Object.freeze([]),
  }),
});

module.exports = { auth_response };
