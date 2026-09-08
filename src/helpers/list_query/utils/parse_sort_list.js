const { sort_defaults } = require("@validators/constants");
const { parse_sort_key } = require("@helpers/list_query/utils/parse_sort_key");

/**
 * Turns the `sort` query string into an ordered list of keys.
 *
 * Duplicate columns are dropped, so `sort=email:asc,email:desc` cannot produce a
 * contradictory sort. The first occurrence wins, because that is the column the
 * user clicked first.
 *
 * The list query schema parses incoming keys with this same function, so a
 * column can never be sortable in one place and unknown in the other.
 *
 * @param   {string} value  The raw `sort` parameter.
 * @returns {Array<{sort_by: string, sort_order: string}>} Keys in the order given.
 */
const parse_sort_list = (value) =>
  String(value)
    .split(sort_defaults.LIST_SEPARATOR)
    .map((key) => key.trim())
    .filter(Boolean)
    .map(parse_sort_key)
    .filter(
      (key, index, keys) =>
        keys.findIndex((other) => other.sort_by === key.sort_by) === index,
    );

module.exports = { parse_sort_list };
