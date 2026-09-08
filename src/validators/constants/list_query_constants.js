/**
 * The pieces of a list query that are the same on every table.
 *
 * `list_query_error_codes` are the custom Joi error identifiers the factory
 * raises and then maps to wording. They are named here because each one is
 * written twice -- once where the check fails and once where the message is
 * attached -- and a typo in either half produces a raw, unhelpful Joi error
 * rather than a failure anyone would notice.
 *
 * `list_query_limits` are the floors the factory applies. The ceilings live in
 * `pagination_defaults`, because a page size is a product decision and these
 * are not.
 */
const list_query_error_codes = Object.freeze({
  SORT_EMPTY: "list.sort_empty",
  SORT_MAX: "list.sort_max",
  SORT_FIELD: "list.sort_field",
  SORT_ORDER: "list.sort_order",
  DATE_INVALID: "list.date_invalid",
  DATE_RANGE: "list.date_range",
  SORT_CONFLICT: "object.oxor",
});

const list_query_limits = Object.freeze({
  MIN_PAGE: 1,
  MIN_LIMIT: 1,
  MIN_TEXT_FILTER_CHARS: 1,
});

module.exports = { list_query_error_codes, list_query_limits };
