const { TEXT_COLLATION } = require("@helpers/list_query/constants");

/**
 * Builds the `find()` options an applied sort needs.
 *
 * Collation costs the database something, so it is only asked for when a column
 * that actually reads as text is being sorted on. A resource names those in
 * `text_sort_fields`; sorting a date or an enum asks for nothing extra.
 *
 * @param   {Array} [applied=[]]              Keys `get_sort` applied.
 * @param   {string[]} [text_sort_fields=[]]  Columns that read as text.
 * @returns {Object} `{ collation }` when needed, otherwise an empty object.
 */
const get_sort_options = (applied = [], text_sort_fields = []) =>
  applied.some((key) => text_sort_fields.includes(key.sort_by))
    ? { collation: TEXT_COLLATION }
    : {};

module.exports = { get_sort_options };
