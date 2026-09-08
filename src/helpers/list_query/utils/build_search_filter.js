const { contains } = require("@helpers/list_query/utils/contains");

/**
 * Builds the `$or` behind the single search box above a table.
 *
 * One term is tried against every column the resource lists, so the search box
 * widens the result set where a per column filter narrows it.
 *
 * `search_fields` falls back to `text_filters`, because a column worth filtering
 * is usually worth searching. A resource lists both only when the two genuinely
 * differ -- a product filters on its description but leaves it out of the global
 * box, where a paragraph of text matches almost anything.
 *
 * @param   {Object} query   The validated query string.
 * @param   {Object} config  The resource's list config.
 * @returns {Object|null} An `$or` clause, or null when the resource has nothing
 *                        to search or the caller searched for nothing.
 */
const build_search_filter = (query = {}, config = {}) => {
  const search_fields = config.search_fields || config.text_filters || [];

  if (!query.search || !search_fields.length) {
    return null;
  }

  const search = contains(query.search);

  return { $or: search_fields.map((field) => ({ [field]: search })) };
};

module.exports = { build_search_filter };
