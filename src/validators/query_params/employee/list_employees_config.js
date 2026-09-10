const {
  user_sort_config,
} = require("@validators/query_params/user/config/sort_config");
const {
  user_search_config,
} = require("@validators/query_params/user/config/search_config");
const {
  employee_filter_config,
} = require("@validators/query_params/employee/config/filter_config");

/**
 * The employee table's contract.
 *
 * Read by two consumers: `build_list_query_schema` turns it into the Joi schema
 * the route validates against, and `build_list_query` turns a validated query
 * into the Mongo filter. Both read this one object, so a column can never be
 * available in one and unknown to the other.
 *
 * Only the filter concern is this feature's own. What may be searched and what
 * may be sorted are read straight from `@validators/query_params/user`, because
 * an employee row is a user row and the two tables show the same columns of it.
 * Making a column sortable therefore changes both tables in one edit, which is
 * the intent -- a caller should not find that a column orders the super admin's
 * table and 400s on the admin's.
 *
 * What the two tables do not share is scope, and that is the whole reason this
 * feature exists: `employee_filter_config` pins the rows to one user type where
 * the super admin's pins them to two.
 *
 * Every column it names is the user's own, so `list_employees` builds its query
 * synchronously and awaits no lookup. If a column from another collection is
 * ever made filterable or searchable, it arrives here as `reference_filters` or
 * `reference_search`, and the controller has to start awaiting
 * `apply_reference_filters` -- nothing else would remind whoever adds one.
 *
 * Pagination is deliberately absent: `page` and `limit` are the same on every
 * table and come from `pagination_defaults`.
 */
const list_employees_config = Object.freeze({
  ...employee_filter_config,
  ...user_search_config,
  ...user_sort_config,
});

module.exports = { list_employees_config };
