const { user_model } = require("@models/user");

/**
 * Deactivates one account, if the caller is allowed to reach it.
 *
 * The soft delete every user route performs. `is_active` goes to false and the
 * row stays where it is, because an account is referenced by whatever it created
 * and removing it would leave those rows pointing at nothing.
 *
 * The user types the caller may act on are an argument rather than a rule in
 * here, because they differ per route -- a super admin may deactivate an admin
 * or an employee, an admin may deactivate only an employee. Passing the scope in
 * keeps both checks in one query: an account outside it is not found rather than
 * found and refused, so neither route can be used to discover that an id it may
 * not touch exists.
 *
 * `is_active: true` is part of the same filter, so an account already
 * deactivated is not matched. That makes the write happen once however many
 * times it is called, and stops a repeat call rewriting a deletion somebody else
 * made.
 *
 * One atomic `findOneAndUpdate` rather than a read, an assign and a save. Two
 * callers deleting the same account at the same moment would both pass a
 * separate read; here the second one matches nothing. It also avoids loading a
 * document whose `password` is `select: false`, which cannot be saved back
 * without the hash being fetched first.
 *
 * Nothing records who did it. `user_model` carries no `updated_by`, so the row
 * knows it was deactivated and not by whom. Adding that means a field on the
 * model and a migration for the accounts already stored.
 *
 * @param   {string} id  The account's id. Expected to be a 24 character hex
 *                       string; the route param schema is what guarantees it.
 * @param   {string[]} allowed_user_types  The user types this caller may
 *                       deactivate, from `@enums`. An empty list matches
 *                       nothing, which fails closed.
 * @returns {Promise<Object|null>} The account as it was before the write, or
 *                       null when nothing matched -- the id is unknown, the
 *                       account was already deactivated, or its user type is
 *                       outside the caller's scope. A caller cannot tell those
 *                       three apart, which is the point.
 */
const deactivate_user = (id, allowed_user_types) =>
  user_model.findOneAndUpdate(
    {
      _id: id,
      is_active: true,
      user_type: { $in: allowed_user_types },
    },
    { is_active: false },
  );

module.exports = { deactivate_user };
