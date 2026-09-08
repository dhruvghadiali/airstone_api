const { sort_defaults } = require("@validators/constants");

/**
 * Splits one `column:direction` sort key.
 *
 * A key carries its column and its direction in one token, which is what keeps
 * the two in step; two parallel lists would not survive a caller sending three
 * columns and two directions.
 *
 * The direction is optional and falls back to the default order, so
 * `sort=first_name` stays valid shorthand.
 *
 * @param   {string} key  One key, for example `"email:asc"`.
 * @returns {{sort_by: string, sort_order: string}}
 */
const parse_sort_key = (key) => {
  const [field, direction] = String(key)
    .split(sort_defaults.KEY_SEPARATOR)
    .map((part) => part.trim());

  return {
    sort_by: field,
    sort_order: (direction || sort_defaults.ORDER).toLowerCase(),
  };
};

module.exports = { parse_sort_key };
