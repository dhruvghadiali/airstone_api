/**
 * What the company table may be ordered by.
 *
 * `sort_fields` is the whitelist -- a column absent from it is a 400, not a
 * silently ignored parameter.
 *
 * No child column is here, and none should be. A company with three branches
 * and seven contacts has three PIN codes and seven contact names, so there is no
 * single value to order its row by. Picking the lowest or the oldest would
 * answer the request without answering the question, so `?sort=pincode:asc` is a
 * 400 naming the columns that do work.
 *
 * That is also what keeps this list a plain `find()`. Ordering by a joined
 * column would mean an aggregation, and pagination, collation and the count
 * would all change shape with it. The children are in the response, which is a
 * projection; they are not part of the query.
 *
 * `text_sort_fields` is the subset that also gets English collation, so
 * `airstone` sorts before `Bharat` rather than after it. Only the two columns
 * holding words a person wrote are listed: collation costs the database
 * something and buys nothing on a number, a date or an enum.
 */
const company_sort_config = Object.freeze({
  sort_fields: Object.freeze([
    "company_name",
    "company_type",
    "email",
    "phone_number",
    "gst_number",
    "pan_number",
    "is_active",
    "created_at",
    "updated_at",
  ]),
  text_sort_fields: Object.freeze(["company_name", "email"]),
});

module.exports = { company_sort_config };
