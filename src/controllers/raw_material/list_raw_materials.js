const { raw_material_model } = require("@models/raw_material");

const { http_status } = require("@enums");
const { raw_material_response } = require("@helpers/raw_material");
const { raw_material_messages } = require("@validators/messages");
const { send_response, get_response_shape } = require("@helpers/common");
const { build_list_query, build_pagination } = require("@helpers/list_query");
const {
  list_raw_materials_config,
} = require("@validators/query_params/raw_material/list_raw_materials_config");

/**
 * Lists raw materials, one page at a time.
 *
 * This controller names no column. What may be searched, filtered and sorted is
 * declared once in `list_raw_materials_config`, which also builds the Joi schema
 * the route validates against -- so a column cannot be accepted by one and
 * unknown to the other, and a parameter outside the contract is a 400 before
 * this function runs.
 *
 * `apply_reference_filters` is not called, because the config declares no
 * `reference_filters` and no `reference_search`. Every column a caller may
 * search, filter or sort by is the material's own, so `build_list_query` alone
 * builds the whole query and nothing here awaits a lookup.
 *
 * That is a contract decision, not a limitation of this file. The day a supplier
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
 * Each row expands its suppliers into the firms behind them. They are real
 * reference fields rather than a populate virtual, so the whole page's companies
 * are read in one extra query, not one per material.
 *
 * The suppliers are a projection, not part of the query. No filter, search term
 * or sort key reaches them: `?company_name=shree` is a 400, and so is
 * `?sort=supplier:asc`. A row shows every firm linked to it, including one that
 * was deactivated after it was linked -- the company's own `is_active` says so.
 *
 * Deactivated materials are hidden unless asked for. That is a default in the
 * config's `is_active` schema, not a rule here, so `?is_active=false` still
 * reaches them -- which is how a caller finds a material to restore.
 *
 * Only an admin may call this, enforced on the router rather than here.
 *
 * @route   GET /admin/raw-materials
 * @access  Admin
 *
 * @param   {import("express").Request} req
 * @param   {Object} req.validated_query Validated by
 *                   `list_raw_materials_query_schema`, which rejects any
 *                   parameter the config does not name.
 * @param   {number} [req.validated_query.page=1]   Page to read.
 * @param   {number} [req.validated_query.limit=20] Rows per page. At most 100.
 * @param   {string} [req.validated_query.search]   One term, tried against the
 *                   material's name and code. Nothing on a supplier is
 *                   searched.
 * @param   {string} [req.validated_query.material_name]  Contains, per column.
 * @param   {string} [req.validated_query.material_code]  Contains, per column.
 * @param   {string} [req.validated_query.unit]           Exactly one of bag,
 *                   gram, litre, piece, kilogram, cubic_meter, metric_tonne.
 * @param   {number} [req.validated_query.minimum_stock_level] Matched exactly.
 *                   1-1000000. There is no range form.
 * @param   {boolean} [req.validated_query.is_active=true] Live materials by
 *                   default.
 * @param   {string} [req.validated_query.sort]      Up to three columns, as
 *                   `material_name:asc,created_at:desc`.
 * @param   {string} [req.validated_query.sort_by]   Single column form. Cannot
 *                   be sent alongside `sort`.
 * @param   {string} [req.validated_query.sort_order] `asc` or `desc`.
 * @param   {import("express").Response} res
 *
 * @returns {Promise<void>} 200 with `{ raw_materials, sort, pagination }`. Each
 *                          material carries the columns in
 *                          `raw_material_response`, with its suppliers expanded
 *                          under `supplier`.
 *
 * @throws  {app_error} 401 when the caller sent no usable token.
 * @throws  {app_error} 403 `ACCESS_FORBIDDEN` when the caller is not an admin.
 */
const list_raw_materials = async (req, res) => {
  const { filter, sort, applied_sort, options, page, limit, skip } =
    build_list_query(req.validated_query, list_raw_materials_config);

  const { select, populate } = get_response_shape(
    raw_material_response,
    "list",
  );

  const [raw_materials, total] = await Promise.all([
    raw_material_model
      .find(filter, null, options)
      .select(select)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate(populate),
    raw_material_model.countDocuments(filter),
  ]);

  return send_response(res, http_status.OK, raw_material_messages.LISTED, {
    raw_materials,
    sort: applied_sort,
    pagination: build_pagination(page, limit, total),
  });
};

module.exports = list_raw_materials;
