/**
 * What the user table may be ordered by.
 *
 * `sort_fields` is the whitelist -- a column absent from it is a 400, not a
 * silently ignored parameter. `password` is absent from it for that reason as
 * much as any other: ordering by a hash would leak the order of the hashes.
 *
 * `text_sort_fields` is the subset that also gets English collation, so
 * `anita` sorts before `Bhavna` rather than after it. Only the two name columns
 * are listed. `email` and `username` read as text but the schema stores both
 * lower cased, so there is no mixed case left for collation to fix and it would
 * cost the database something for nothing. `emp_id` is fixed width and
 * upper cased, so its text order and its number order already agree.
 */
const user_sort_config = Object.freeze({
  sort_fields: Object.freeze([
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
  ]),
  text_sort_fields: Object.freeze(["first_name", "last_name"]),
});

module.exports = { user_sort_config };
