const { user_model } = require("@models/user");

const { http_status } = require("@enums");
const { user_response } = require("@helpers/user");
const { user_messages } = require("@validators/messages");
const { send_response, get_response_shape } = require("@helpers/common");
const { build_list_query, build_pagination } = require("@helpers/list_query");
const {
  list_employees_config,
} = require("@validators/query_params/employee/list_employees_config");

/**
 * Lists the employee accounts, one page at a time.
 *
 * The admin's view of the same collection `list_users` reads for the super
 * admin. It is a second controller rather than the same one mounted twice
 * because the two differ in the one thing a mount cannot change: the rows they
 * may return. Each names its own list config, and the config is where the scope
 * lives.
 *
 * This controller names no column. What may be searched, filtered and sorted is
 * declared in `list_employees_config`, which also builds the Joi schema the
 * route validates against -- so a column cannot be accepted by one and unknown
 * to the other, and a parameter outside the contract is a 400 before this
 * function runs.
 *
 * Only employees are listed, and a caller cannot ask for anything else. The
 * scope is a `base_filter` in the config, applied to every request with no
 * parameter that switches it off, and the config exposes no `user_type` filter
 * that could replace it. An admin cannot use this to read another admin's
 * account, or their own.
 *
 * No password ever leaves here, and that is guaranteed twice below this file
 * rather than by anything in it. `password` is `select: false` on the schema, so
 * a query has to ask for it by name, and the model's `toJSON` deletes it again
 * on the way out. The projection this controller applies is a third layer and
 * the weakest of the three: it is presentation.
 *
 * `apply_reference_filters` is not called, because the config declares no
 * `reference_filters` and no `reference_search`. Every column a caller may
 * search, filter or sort by is the user's own, so `build_list_query` alone
 * builds the whole query and nothing here awaits a lookup.
 *
 * The two reads run together. The page and the count are independent questions
 * about the same filter, and running them in turn would double the wait for no
 * reason.
 *
 * `total` counts every row the filter matched, not the rows on this page, so the
 * frontend can draw the pager without asking again.
 *
 * Deactivated employees are hidden unless asked for. That is a default in the
 * config's `is_active` schema, not a rule here, so `?is_active=false` still
 * reaches them -- which is how an admin confirms a removal took effect.
 *
 * Only an admin may call this, enforced on the router rather than here.
 *
 * @route   GET /admin/employees
 * @access  Admin
 *
 * @param   {import("express").Request} req
 * @param   {Object} req.validated_query Validated by
 *                   `list_employees_query_schema`, which rejects any parameter
 *                   the config does not name.
 * @param   {number} [req.validated_query.page=1]   Page to read.
 * @param   {number} [req.validated_query.limit=20] Rows per page. At most 100.
 * @param   {string} [req.validated_query.search]   One term, tried against the
 *                   first name, last name, email, phone number, employee id and
 *                   username at once.
 * @param   {string} [req.validated_query.first_name]   Contains, per column.
 * @param   {string} [req.validated_query.last_name]    Contains, per column.
 * @param   {string} [req.validated_query.email]        Contains, per column.
 * @param   {string} [req.validated_query.phone_number] Contains, per column.
 * @param   {string} [req.validated_query.emp_id]       Contains, per column.
 * @param   {string} [req.validated_query.username]     Contains, per column.
 * @param   {boolean} [req.validated_query.is_active=true] Live employees by
 *                   default.
 * @param   {string} [req.validated_query.created_from]  Start of a created_at
 *                   range, read as IST.
 * @param   {string} [req.validated_query.created_to]    End of that range.
 * @param   {string} [req.validated_query.sort]      Up to three columns, as
 *                   `first_name:asc,created_at:desc`.
 * @param   {string} [req.validated_query.sort_by]   Single column form. Cannot
 *                   be sent alongside `sort`.
 * @param   {string} [req.validated_query.sort_order] `asc` or `desc`.
 * @param   {import("express").Response} res
 *
 * @returns {Promise<void>} 200 with `{ employees, sort, pagination }`. Each
 *                          employee carries the columns in `user_response`.
 *
 * @throws  {app_error} 401 when the caller sent no usable token.
 * @throws  {app_error} 403 `ACCESS_FORBIDDEN` when the caller is not an admin.
 */
const list_employees = async (req, res) => {
  const {
    filter,
    sort,
    applied_sort,
    options,
    page,
    limit,
    skip,
  } = build_list_query(req.validated_query, list_employees_config);

  const { select, populate } = get_response_shape(user_response, "list");

  const [employees, total] = await Promise.all([
    user_model
      .find(filter, null, options)
      .select(select)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate(populate),
    user_model.countDocuments(filter),
  ]);

  return send_response(res, http_status.OK, user_messages.EMPLOYEES_LISTED, {
    employees,
    sort: applied_sort,
    pagination: build_pagination(page, limit, total),
  });
};

module.exports = list_employees;
