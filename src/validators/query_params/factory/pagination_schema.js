const joi = require("joi");

const {
  list_query_limits,
  pagination_defaults,
} = require("@validators/constants");

/**
 * Builds the two parameters every list endpoint accepts, whatever its config
 * says.
 *
 * Paging is uniform across the API, so it is not something a resource declares
 * -- there is no config key to switch it on. Both values are defaulted here, so
 * a request that names neither still reaches the controller with a page and a
 * size, and `MAX_LIMIT` is the ceiling that stops a caller asking for the whole
 * collection in one go.
 *
 * @returns {Object<string, import("joi").Schema>} `page` and `limit`, keyed by
 *   parameter name. Meant to be spread into the endpoint's object schema, not
 *   validated on its own.
 */
const build_pagination_schema = () => ({
  page: joi
    .number()
    .integer()
    .min(list_query_limits.MIN_PAGE)
    .default(pagination_defaults.PAGE),
  limit: joi
    .number()
    .integer()
    .min(list_query_limits.MIN_LIMIT)
    .max(pagination_defaults.MAX_LIMIT)
    .default(pagination_defaults.LIMIT),
});

module.exports = { build_pagination_schema };
