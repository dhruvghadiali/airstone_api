const { sort_order, sort_defaults } = require("@validators/constants");

const sort_orders = Object.values(sort_order).join(", ");

/**
 * What a caller is told when a list query breaks its resource's contract.
 *
 * Shared by every table, because the rules they break are the shared ones --
 * which columns may be sorted on, how many at once, whether a date range runs
 * forwards. A message naming a specific column is not written here; it is
 * assembled by `sort_field_message` below, since the list of allowed columns is
 * per resource and only known once a config is in hand.
 *
 * `{{#field}}`, `{{#from}}`, `{{#to}}` and `{{#label}}` are Joi placeholders,
 * filled at failure time with the parameter that actually went wrong.
 */
const list_query_validation_messages = Object.freeze({
  SORT_EMPTY: `"sort" must list at least one column`,
  SORT_MAX: `"sort" accepts at most ${sort_defaults.MAX_FIELDS} columns`,
  SORT_ORDER: `"sort" direction for {{#field}} must be one of [${sort_orders}]`,
  SORT_CONFLICT: `Use either "sort" or "sort_by", not both`,
  DATE_INVALID: `{{#label}} must be a date such as 2026-08-15, 2026-08-15 14:30, or 2026-08-15T14:30:00+05:30`,
  DATE_RANGE: `{{#from}} must be on or before {{#to}}`,
});

/**
 * The one message that has to name the resource's own columns, so a caller who
 * mistyped a sort column is told what they could have written instead.
 */
const sort_field_message = (sort_fields = []) =>
  `"sort" column {{#field}} must be one of [${sort_fields.join(", ")}]`;

module.exports = { list_query_validation_messages, sort_field_message };
