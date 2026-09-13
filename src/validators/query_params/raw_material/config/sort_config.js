/**
 * What the raw material table may be ordered by.
 *
 * `sort_fields` is the whitelist -- a column absent from it is a 400, not a
 * silently ignored parameter.
 *
 * `created_at` and `updated_at` are here although neither was asked for.
 * `created_at` descending is the order a request with no `sort` already comes
 * back in, because `get_sort` falls back to it whether or not it is listed.
 * Leaving it out would mean a caller receives that order but is refused when
 * they ask for it by name.
 *
 * `supplier` is not here, and should not be. A material with three suppliers
 * has three company ids, so there is no single value to order its row by.
 * Ordering by a joined column would also mean an aggregation, and pagination,
 * collation and the count would all change shape with it. The suppliers are in
 * the response, which is a projection; they are not part of the query.
 *
 * `text_sort_fields` is the subset that also gets English collation, so
 * `alumina` sorts before `Bauxite` rather than after it. Only the two columns
 * holding words a person wrote are listed: collation costs the database
 * something and buys nothing on an enum, a number or a date.
 */
const raw_material_sort_config = Object.freeze({
  sort_fields: Object.freeze([
    "material_name",
    "material_code",
    "unit",
    "minimum_stock_level",
    "created_at",
    "updated_at",
  ]),
  text_sort_fields: Object.freeze(["material_name", "material_code"]),
});

module.exports = { raw_material_sort_config };
