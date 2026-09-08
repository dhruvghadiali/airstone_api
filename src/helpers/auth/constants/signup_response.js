/**
 * The columns a created account is described with.
 *
 * `emp_id` is here, and it is the reason this list is not just a copy of
 * `auth_response`. The server makes that id, so the reply is the only place the
 * caller can learn it. Leaving it out would mean an admin creates an employee
 * and then has to go and look the id up.
 *
 * `is_active` is here for the same kind of reason: the caller did not set it,
 * so the reply is where they find out the account is live.
 *
 * `password` is absent, as everywhere. The account was created on the shared
 * default, so there is nothing account-specific to send back even if we wanted
 * to.
 *
 * @type {string}
 */
const CREATED_USER_SELECT = [
  "_id",
  "first_name",
  "last_name",
  "email",
  "phone_number",
  "emp_id",
  "username",
  "user_type",
  "is_active",
  "created_at",
].join(" ");

/**
 * Read through `get_response_shape(signup_response, "<action>")`. Only `default`
 * is declared, so every action falls back to it.
 *
 * One shape serves both signup endpoints, because an account reads the same
 * whether an admin or an employee was made. They differ in who may call them
 * and in the wording of their success message, never in the columns they answer
 * with.

 * It is kept apart from `auth_response`, which the signin endpoints use. That
 * one describes the person who just signed in; this one describes an account
 * somebody else just made, so it carries `emp_id` and `is_active` and no token.
 */
const signup_response = Object.freeze({
  default: Object.freeze({
    select: CREATED_USER_SELECT,
    populate: Object.freeze([]),
  }),
});

module.exports = { signup_response };
