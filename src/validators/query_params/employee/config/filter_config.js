const { user_type } = require("@enums");
const {
  user_filter_config,
} = require("@validators/query_params/user/config/filter_config");

/**
 * What the admin's employee table may be narrowed by.
 *
 * `base_filter` pins the table to one user type and the caller cannot switch it
 * off. An admin sees employees; the accounts that administer the system,
 * including the admin's own, are not this table's business. That scope is the
 * only real difference between this contract and the super admin's, which is why
 * this is the one concern file the employee feature declares for itself.
 *
 * There is no `user_type` exact filter here, and its absence is the point. An
 * exact filter *replaces* the base scope for its column instead of intersecting
 * with it, so exposing the column at all would be handing the caller a way to
 * ask for a different user type. With one type in scope there is also nothing to
 * narrow to. `?user_type=admin` is therefore a 400 saying the parameter is not
 * allowed, which is the honest answer.
 *
 * `text_filters` and the `is_active` schema are read from the super admin's
 * filter config rather than copied. The two tables are the same rows through
 * different windows, so a column that is worth a header box on one is worth one
 * on the other, and a copy is the thing that drifts. `@validators/query_params/user`
 * owns those columns; the day the two tables genuinely need different boxes,
 * this file declares its own and the header says why.
 *
 * `is_active` still defaults to true, so the table shows live employees unless
 * asked otherwise. A default rather than part of the base scope, because an
 * admin has to be able to confirm that a removal took effect --
 * `?is_active=false` is how they do it.
 */
const employee_filter_config = Object.freeze({
  base_filter: Object.freeze({ user_type: user_type.EMPLOYEE }),
  text_filters: user_filter_config.text_filters,
  exact_filters: Object.freeze({
    is_active: user_filter_config.exact_filters.is_active,
  }),
  date_filters: Object.freeze(["created_at"]),
});

module.exports = { employee_filter_config };
