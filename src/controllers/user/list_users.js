const { user_model } = require("@models/user");

const { http_status } = require("@enums");
const { user_response } = require("@helpers/user");
const { user_messages } = require("@validators/messages");
const { send_response, get_response_shape } = require("@helpers/common");
const { build_list_query, build_pagination } = require("@helpers/list_query");
const {
  list_users_config,
} = require("@validators/query_params/user/list_users_config");

/**
 * Lists the admin and employee accounts, one page at a time.
 *
 * This controller names no column. What may be searched, filtered and sorted is
 * declared once in `list_users_config`, which also builds the Joi schema the
 * route validates against -- so a column cannot be accepted by one and unknown
 * to the other, and a parameter outside the contract is a 400 before this
 * function runs.
 *
 * No password ever leaves here, and that is guaranteed twice below this file
 * rather than by anything in it. `password` is `select: false` on the schema, so
 * a query has to ask for it by name, and the model's `toJSON` deletes it again
 * on the way out. The projection this controller applies is a third layer and
 * the weakest of the three: it is presentation. Anything that must never leave
 * the server has to be marked on the schema, not left off a select list.
 *
 * Super admin accounts are not listed, and a caller cannot ask for them. The
 * scope is a `base_filter` in the config, so it is applied to every request and
 * there is no parameter that switches it off -- this endpoint cannot be turned
 * into a way of enumerating the accounts that administer the system.
 *
 * `apply_reference_filters` is not called, because the config declares no
 * `reference_filters` and no `reference_search`. Every column a caller may
 * search, filter or sort by is the user's own, so `build_list_query` alone
 * builds the whole query and nothing here awaits a lookup. The day a column from
 * another collection becomes filterable, the config grows a `reference_filters`
 * entry and this controller has to start awaiting that call.
 *
 * The two reads run together. The page and the count are independent questions
 * about the same filter, and running them in turn would double the wait for no
 * reason.
 *
 * `total` counts every row the filter matched, not the rows on this page, so the
 * frontend can draw the pager without asking again.
 *
 * Deactivated accounts are hidden unless asked for. That is a default in the
 * config's `is_active` schema, not a rule here, so `?is_active=false` still
 * reaches them -- which today is the only way to see one at all.
 *
 * Only a super admin may call this, enforced on the router rather than here.
 *
 * @route   GET /super-admin/users
 * @access  Super admin
 *
 * @param   {import("express").Request} req
 * @param   {Object} req.validated_query Validated by `list_users_query_schema`,
 *                   which rejects any parameter the config does not name.
 * @param   {number} [req.validated_query.page=1]   Page to read.
 * @param   {number} [req.validated_query.limit=20] Rows per page. At most 100.
 * @param   {string} [req.validated_query.search]   One term, tried against the
 *                   first name, last name, email, phone number, employee id and
 *                   username at once. The user type is not searched; it has its
 *                   own exact filter.
 * @param   {string} [req.validated_query.first_name]   Contains, per column.
 * @param   {string} [req.validated_query.last_name]    Contains, per column.
 * @param   {string} [req.validated_query.email]        Contains, per column.
 * @param   {string} [req.validated_query.phone_number] Contains, per column.
 * @param   {string} [req.validated_query.emp_id]       Contains, per column.
 * @param   {string} [req.validated_query.username]     Contains, per column.
 * @param   {string} [req.validated_query.user_type]    Exactly one of admin,
 *                   employee. Super admin is refused.
 * @param   {boolean} [req.validated_query.is_active=true] Live accounts by
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
 * @returns {Promise<void>} 200 with `{ users, sort, pagination }`. Each user
 *                          carries the columns in `user_response`.
 *
 * @throws  {app_error} 401 when the caller sent no usable token.
 * @throws  {app_error} 403 `ACCESS_FORBIDDEN` when the caller is not a super
 *                      admin.
 */
const list_users = async (req, res) => {
  const {
    filter,
    sort,
    applied_sort,
    options,
    page,
    limit,
    skip,
  } = build_list_query(req.validated_query, list_users_config);

  const { select, populate } = get_response_shape(user_response, "list");

  const [users, total] = await Promise.all([
    user_model
      .find(filter, null, options)
      .select(select)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate(populate),
    user_model.countDocuments(filter),
  ]);

  return send_response(res, http_status.OK, user_messages.LISTED, {
    users,
    sort: applied_sort,
    pagination: build_pagination(page, limit, total),
  });
};

module.exports = list_users;
