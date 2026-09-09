/**
 * What the contact table may be ordered by.
 *
 * `sort_fields` is the whitelist -- a column absent from it is a 400, not a
 * silently ignored parameter.
 *
 * Nothing on the company or the address is here. Both are returned with every
 * row, but ordering by a joined column would mean an aggregation, and
 * pagination, collation and the count would all change shape with it. The
 * parents are a projection; they are not part of the query.
 *
 * `text_sort_fields` is the subset that also gets English collation, so `imran`
 * sorts before `Ramesh` rather than after it. Only `name` is listed: collation
 * costs the database something and buys nothing on a phone number, a date or an
 * enum.
 */
const company_contact_sort_config = Object.freeze({
  sort_fields: Object.freeze([
    "name",
    "phone_number",
    "position",
    "is_active",
    "created_at",
    "updated_at",
  ]),
  text_sort_fields: Object.freeze(["name"]),
});

module.exports = { company_contact_sort_config };
