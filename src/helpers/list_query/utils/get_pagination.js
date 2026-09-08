const { pagination_defaults } = require("@validators/constants");

/**
 * Turns the validated query into the window a `find()` reads.
 *
 * Both ends are clamped rather than rejected. A request that arrived through a
 * route has already had `page` and `limit` bounded by the list query schema, so
 * the clamping here is what protects internal callers that build a query object
 * by hand. It must never be the only guard a request passes.
 *
 * @param   {Object} [query={}]        The validated query string.
 * @param   {number} [query.page]      1 based page number.
 * @param   {number} [query.limit]     Rows per page.
 * @returns {{page: number, limit: number, skip: number}} The window to read.
 */
const get_pagination = (query = {}) => {
  const page = Math.max(
    Number.parseInt(query.page, 10) || pagination_defaults.PAGE,
    1,
  );

  const requested_limit =
    Number.parseInt(query.limit, 10) || pagination_defaults.LIMIT;

  const limit = Math.min(
    Math.max(requested_limit, 1),
    pagination_defaults.MAX_LIMIT,
  );

  return { page, limit, skip: (page - 1) * limit };
};

module.exports = { get_pagination };
