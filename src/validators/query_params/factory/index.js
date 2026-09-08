const joi = require("joi");

const { list_query_error_codes } = require("@validators/constants");
const {
  build_sort_schemas,
} = require("@validators/query_params/factory/sort_schema");
const {
  build_search_schema,
} = require("@validators/query_params/factory/search_schema");
const {
  build_pagination_schema,
} = require("@validators/query_params/factory/pagination_schema");
const {
  build_text_filter_schemas,
} = require("@validators/query_params/factory/text_filter_schema");
const {
  build_exact_filter_schemas,
} = require("@validators/query_params/factory/exact_filter_schema");
const {
  build_derived_filter_schemas,
} = require("@validators/query_params/factory/derived_filter_schema");
const {
  build_reference_filter_schemas,
} = require("@validators/query_params/factory/reference_filter_schema");
const {
  build_date_filter_schemas,
  build_date_range_validator,
} = require("@validators/query_params/factory/date_filter_schema");
const {
  list_query_validation_messages,
} = require("@validators/messages");

/**
 * Builds the query schema for one list endpoint from that resource's config.
 *
 * The factory owns no knowledge of any resource. It asks each builder beside it
 * what parameters its part of the config implies, assembles the answers into
 * one object schema, and closes it -- so a parameter no builder produced is a
 * 400 rather than a key the controller quietly ignores.
 *
 * The same config feeds `build_list_query`, which turns a validated query into
 * the Mongo query. Because both read one list, a column can never be accepted
 * here and unknown there.
 *
 * Adding a capability -- a numeric range, a full text search -- means a new
 * builder file beside this one and a line in the spread below, not an edit to
 * any resource's config.
 *
 * @param   {Object} [config={}]  The resource's list config, from
 *   `@validators/query_params/<feature>/`. Every key is optional: a config that
 *   declares nothing still yields a schema accepting paging and search.
 * @returns {import("joi").ObjectSchema} The schema for that endpoint's query
 *   string. Pass it to `validate_query`, which puts the validated value on
 *   `req.validated_query`.
 */
const build_list_query_schema = (config = {}) =>
  joi
    .object({
      ...build_pagination_schema(),
      ...build_search_schema(),
      ...build_text_filter_schemas(config),
      ...build_date_filter_schemas(config),
      ...build_exact_filter_schemas(config),
      ...build_derived_filter_schemas(config),
      ...build_reference_filter_schemas(config),
      ...build_sort_schemas(config),
    })
    // The two sort forms say the same thing in different words, so a request
    // carrying both is ambiguous rather than redundant.
    .oxor("sort", "sort_by")
    // Anything the builders above did not produce is not in this resource's
    // contract, and is refused before the controller is reached.
    .unknown(false)
    // Applied last, so each boundary is already a parsed Date by the time the
    // range is compared.
    .custom(build_date_range_validator(config))
    .messages({
      [list_query_error_codes.SORT_CONFLICT]:
        list_query_validation_messages.SORT_CONFLICT,
      [list_query_error_codes.DATE_INVALID]:
        list_query_validation_messages.DATE_INVALID,
      [list_query_error_codes.DATE_RANGE]:
        list_query_validation_messages.DATE_RANGE,
    });

module.exports = { build_list_query_schema };
