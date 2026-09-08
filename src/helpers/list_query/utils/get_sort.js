const { sort_order, sort_defaults } = require("@validators/constants");

/**
 * Builds the Mongoose sort object from a validated query.
 *
 * Accepts either the multi column `sort` list the validator parsed, or the
 * single column `sort_by`/`sort_order` pair. A requested column that the
 * resource does not allow is dropped rather than refused here, because the
 * schema has already refused it for any request that came through a route.
 *
 * `_id` is always appended as the last key. A sort on a repeating value -- a
 * role, a shared surname -- is not deterministic on its own, which makes rows
 * jump between pages as a user pages through them.
 *
 * @param   {Object} [query={}]              The validated query string.
 * @param   {string[]} [allowed_fields=[]]   Columns this resource may sort on.
 * @returns {{sort: Object, applied: Array}} The sort object, and the keys that
 *                                           were actually used.
 */
const get_sort = (query = {}, allowed_fields = []) => {
  const requested = Array.isArray(query.sort) ? query.sort : [];
  const keys = requested.filter((key) => allowed_fields.includes(key.sort_by));

  const applied = keys.length
    ? keys
    : [
        {
          sort_by: allowed_fields.includes(query.sort_by)
            ? query.sort_by
            : sort_defaults.FIELD,
          sort_order:
            query.sort_order === sort_order.ASC
              ? sort_order.ASC
              : sort_defaults.ORDER,
        },
      ];

  const sort = {};

  for (const key of applied) {
    sort[key.sort_by] = key.sort_order === sort_order.ASC ? 1 : -1;
  }

  if (!("_id" in sort)) sort._id = -1;

  return { sort, applied };
};

module.exports = { get_sort };
