const { company_model } = require("@models/company");

const { http_status } = require("@enums");
const { company_response } = require("@helpers/company");
const { company_messages } = require("@validators/messages");
const { send_response, get_response_shape } = require("@helpers/common");
const { build_list_query, build_pagination } = require("@helpers/list_query");
const {
  list_companies_config,
} = require("@validators/query_params/company/list_companies_config");

/**
 * Lists companies, one page at a time.
 *
 * This controller names no column. What may be searched, filtered and sorted is
 * declared once in `list_companies_config`, which also builds the Joi schema the
 * route validates against -- so a column cannot be accepted by one and unknown
 * to the other, and a parameter outside the contract is a 400 before this
 * function runs.
 *
 * `apply_reference_filters` is not called, because the config declares no
 * `reference_filters` and no `reference_search`. Every column a caller may
 * search, filter or sort by is the company's own, so `build_list_query` alone
 * builds the whole query and nothing here awaits a lookup.
 *
 * That is a contract decision, not a limitation of this file. The day a child
 * column becomes filterable, the config grows a `reference_filters` entry and
 * this controller has to start awaiting that call -- the config's header says
 * so, because nothing else would remind whoever adds one.
 *
 * The two reads run together. The page and the count are independent questions
 * about the same filter, and running them in turn would double the wait for no
 * reason.
 *
 * `total` counts every row the filter matched, not the rows on this page, so the
 * frontend can draw the pager without asking again.
 *
 * Each row carries the company's active addresses and, under each, the active
 * people at it. They are populate virtuals, so the child rows are read in two
 * extra queries for the whole page rather than one per company.
 *
 * The children are a projection, not part of the query. No filter, search term
 * or sort key reaches them: `?pincode=411001` is a 400, and so is
 * `?sort=contact_name:asc`. A row shows every active child of whichever
 * companies the company level query matched.
 *
 * Deactivated companies are hidden unless asked for. That is a default in the
 * config's `is_active` schema, not a rule here, so `?is_active=false` still
 * reaches them -- which today is the only way to see one at all.
 *
 * Only an admin may call this, enforced on the router rather than here.
 *
 * @route   GET /admin/companies
 * @access  Admin
 *
 * @param   {import("express").Request} req
 * @param   {Object} req.validated_query Validated by
 *                   `list_companies_query_schema`, which rejects any parameter
 *                   the config does not name.
 * @param   {number} [req.validated_query.page=1]   Page to read.
 * @param   {number} [req.validated_query.limit=20] Rows per page. At most 100.
 * @param   {string} [req.validated_query.search]   One term, tried against the
 *                   company's name, type, email, phone number, GST number and
 *                   PAN number. Nothing on an address or a contact is searched.
 * @param   {string} [req.validated_query.company_name]  Contains, per column.
 * @param   {string} [req.validated_query.email]         Contains, per column.
 * @param   {string} [req.validated_query.phone_number]  Contains, per column.
 * @param   {string} [req.validated_query.gst_number]    Contains, per column.
 * @param   {string} [req.validated_query.pan_number]    Contains, per column.
 * @param   {string} [req.validated_query.company_type]  Exactly one of
 *                   supplier, customer, both.
 * @param   {boolean} [req.validated_query.is_active=true] Live companies by
 *                   default.
 * @param   {string} [req.validated_query.created_from]  Start of a created_at
 *                   range, read as IST.
 * @param   {string} [req.validated_query.created_to]    End of that range.
 * @param   {string} [req.validated_query.sort]      Up to three columns, as
 *                   `company_name:asc,created_at:desc`.
 * @param   {string} [req.validated_query.sort_by]   Single column form. Cannot
 *                   be sent alongside `sort`.
 * @param   {string} [req.validated_query.sort_order] `asc` or `desc`.
 * @param   {import("express").Response} res
 *
 * @returns {Promise<void>} 200 with `{ companies, sort, pagination }`. Each
 *                          company carries the columns in `company_response`,
 *                          its active addresses under `addresses`, and each
 *                          address's active contacts under `contacts`.
 *
 * @throws  {app_error} 401 when the caller sent no usable token.
 * @throws  {app_error} 403 `ACCESS_FORBIDDEN` when the caller is not an admin.
 */
const list_companies = async (req, res) => {
  const {
    filter,
    sort,
    applied_sort,
    options,
    page,
    limit,
    skip,
  } = build_list_query(req.validated_query, list_companies_config);

  const { select, populate } = get_response_shape(company_response, "list");

  const [companies, total] = await Promise.all([
    company_model
      .find(filter, null, options)
      .select(select)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate(populate),
    company_model.countDocuments(filter),
  ]);

  return send_response(res, http_status.OK, company_messages.LISTED, {
    companies,
    sort: applied_sort,
    pagination: build_pagination(page, limit, total),
  });
};

module.exports = list_companies;
