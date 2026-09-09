const { company_contact_model } = require("@models/company");

const { http_status } = require("@enums");
const { company_contact_response } = require("@helpers/company");
const { send_response, get_response_shape } = require("@helpers/common");
const { build_list_query, build_pagination } = require("@helpers/list_query");
const {
  company_contact_messages,
} = require("@validators/messages");
const {
  list_company_contacts_config,
} = require("@validators/query_params/company_contact/list_company_contacts_config");

/**
 * Lists company contacts across every company, one page at a time.
 *
 * This controller names no column. What may be searched, filtered and sorted is
 * declared once in `list_company_contacts_config`, which also builds the Joi
 * schema the route validates against -- so a column cannot be accepted by one
 * and unknown to the other, and a parameter outside the contract is a 400 before
 * this function runs.
 *
 * The contract covers the contact's own columns only. `apply_reference_filters`
 * is not called, because the config declares no `reference_filters` and no
 * `reference_search`, so `build_list_query` alone builds the whole query and
 * nothing here awaits a lookup. The day the company or the address becomes
 * filterable, the config grows a `reference_filters` entry and this controller
 * has to start awaiting that call.
 *
 * Each row still carries the branch the person works at and the firm that owns
 * it. Both are real reference fields on the contact, so they are one populate
 * each rather than a hop through the other, and they sit side by side rather
 * than nested. They are a projection, not part of the query: a firm's name typed
 * into `search` finds nothing, and `?sort=company_name:asc` is a 400.
 *
 * Neither parent is filtered by `is_active`. A `match` on a to-one reference
 * replaces the document with null rather than hiding the row, so a contact under
 * a deactivated company would arrive claiming to belong to nobody. Both selects
 * carry `is_active`, which says the same thing honestly.
 *
 * The two reads run together. The page and the count are independent questions
 * about the same filter, and running them in turn would double the wait for no
 * reason.
 *
 * `total` counts every row the filter matched, not the rows on this page, so the
 * frontend can draw the pager without asking again.
 *
 * Deactivated contacts are hidden unless asked for. That is a default in the
 * config's `is_active` schema, not a rule here, so `?is_active=false` still
 * reaches them -- which is how the people who have left, and everyone under a
 * deleted branch or company, are found.
 *
 * Only an admin may call this, enforced on the router rather than here.
 *
 * @route   GET /admin/companies/contacts
 * @access  Admin
 *
 * @param   {import("express").Request} req
 * @param   {Object} req.validated_query Validated by
 *                   `list_company_contacts_query_schema`, which rejects any
 *                   parameter the config does not name.
 * @param   {number} [req.validated_query.page=1]   Page to read.
 * @param   {number} [req.validated_query.limit=20] Rows per page. At most 100.
 * @param   {string} [req.validated_query.search]   One term, tried against the
 *                   contact's name, phone number and position. Nothing on the
 *                   company or the address is searched.
 * @param   {string} [req.validated_query.name]         Contains, per column.
 * @param   {string} [req.validated_query.phone_number] Contains, per column.
 * @param   {string} [req.validated_query.position]     Exactly one of owner,
 *                   manager, accounts, purchase, sales, other.
 * @param   {boolean} [req.validated_query.is_active=true] Current people by
 *                   default.
 * @param   {string} [req.validated_query.created_from]  Start of a created_at
 *                   range, read as IST.
 * @param   {string} [req.validated_query.created_to]    End of that range.
 * @param   {string} [req.validated_query.sort]      Up to three columns, as
 *                   `name:asc,created_at:desc`.
 * @param   {string} [req.validated_query.sort_by]   Single column form. Cannot
 *                   be sent alongside `sort`.
 * @param   {string} [req.validated_query.sort_order] `asc` or `desc`.
 * @param   {import("express").Response} res
 *
 * @returns {Promise<void>} 200 with `{ contacts, sort, pagination }`. Each
 *                          contact carries the columns in
 *                          `company_contact_response`, its address under
 *                          `company_address`, and its firm under `company`.
 *
 * @throws  {app_error} 401 when the caller sent no usable token.
 * @throws  {app_error} 403 `ACCESS_FORBIDDEN` when the caller is not an admin.
 */
const list_company_contacts = async (req, res) => {
  const { filter, sort, applied_sort, options, page, limit, skip } =
    build_list_query(req.validated_query, list_company_contacts_config);

  const { select, populate } = get_response_shape(
    company_contact_response,
    "list",
  );

  const [contacts, total] = await Promise.all([
    company_contact_model
      .find(filter, null, options)
      .select(select)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate(populate),
    company_contact_model.countDocuments(filter),
  ]);

  return send_response(res, http_status.OK, company_contact_messages.LISTED, {
    contacts,
    sort: applied_sort,
    pagination: build_pagination(page, limit, total),
  });
};

module.exports = list_company_contacts;
