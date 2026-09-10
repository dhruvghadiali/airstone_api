/**
 * What the single search box above the user table spans.
 *
 * Declared in full rather than left to fall back to `text_filters`, so the list
 * below is a decision a reader can see rather than an omission.
 *
 * The two names are in it because a name is what a person has in their head when
 * they go looking for a colleague.
 *
 * The identifier columns -- `email`, `phone_number`, `emp_id`, `username` -- are
 * in it too, which is the opposite of the usual advice about a global search
 * box. This table exists to look a person up, and what the reader has in front
 * of them is as often a number off a message or an address off an email as it is
 * a name they can spell. A phone number pasted into the box should find the
 * person it belongs to.
 *
 * The cost of that is worth stating, because it is the reason the usual advice
 * exists. One term is tried against every column at once, so a short term
 * matches widely: `?search=98` will list everybody whose phone number contains
 * those two digits. That is the box guessing, which is its job -- a caller who
 * knows which column they mean should use that column's own filter, where the
 * term is matched against one thing.
 *
 * `user_type` is the one column left out. It is already an exact filter, and a
 * table of two roles is narrowed by picking one rather than by typing at it.
 */
const user_search_config = Object.freeze({
  search_fields: Object.freeze([
    "first_name",
    "last_name",
    "email",
    "phone_number",
    "emp_id",
    "username",
  ]),
});

module.exports = { user_search_config };
