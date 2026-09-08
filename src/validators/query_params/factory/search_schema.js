const joi = require("joi");

/**
 * Builds the parameter behind the single search box above the table.
 *
 * Always accepted, on every list endpoint. Which columns it actually spans is
 * the resource's decision and lives in its `search_fields`; a table that names
 * none simply matches nothing rather than rejecting the request.
 *
 * @returns {Object<string, import("joi").Schema>} `search`, keyed by parameter
 *   name. Meant to be spread into the endpoint's object schema.
 */
const build_search_schema = () => ({
  search: joi.string().trim(),
});

module.exports = { build_search_schema };
