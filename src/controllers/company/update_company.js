const { company_model } = require("@models/company");
const app_error = require("@middlewares/app_error");

const { http_status } = require("@enums");
const { project } = require("@utils/projection");
const { company_messages } = require("@validators/messages");
const { send_response, get_response_shape } = require("@helpers/common");
const {
  company_response,
  run_with_company_duplicate_mapping,
} = require("@helpers/company");

/**
 * Changes a company's own details.
 *
 * The company only. Its addresses and the people at them are rows with ids of
 * their own, so they are edited through their own endpoints; sending an
 * `address` here is a 400 rather than a field that is quietly ignored.
 *
 * Only an admin may call this. That is enforced on the router by
 * `authenticate_user` followed by `authorize_user_types(ADMIN)`, not here.
 *
 * Every field is optional and at least one is required, so a caller sends what
 * changed rather than the whole company back.
 *
 * `updated_by` is the signed in caller, taken from the token. The schema refuses
 * an `updated_by` field, so a caller cannot record the change against somebody
 * else.
 *
 * A deactivated company can still be edited. There is no restore endpoint yet,
 * and `is_active` is not something this endpoint accepts, so the only thing
 * filtering it out would achieve is making a typo in a deactivated company
 * impossible to correct.
 *
 * The read takes no `select`. `save()` validates and writes the whole document,
 * and a projected document saves back a mutilated one. The response is narrowed
 * afterwards, to the response only.
 *
 * @route   PATCH /admin/companies/:id
 * @access  Admin
 *
 * @param   {import("express").Request} req
 * @param   {Object} req.params
 * @param   {string} req.params.id  The company's id. 24 hex characters,
 *                                  validated by `company_id_params_schema`.
 * @param   {Object} req.body Validated by `update_company_schema`, which
 *                            requires at least one field and rejects unknown
 *                            ones.
 * @param   {string} [req.body.company_name]  2-150 chars, trimmed.
 * @param   {string} [req.body.company_type]  One of supplier, customer, both.
 * @param   {string} [req.body.email]         5-254 chars, must be a valid
 *                                            email. Stored lower case.
 * @param   {string} [req.body.phone_number]  Exactly 10 digits.
 * @param   {string} [req.body.gst_number]    Exactly 15 chars, a valid GSTIN.
 *                                            Stored upper case. Unique.
 * @param   {string} [req.body.pan_number]    Exactly 10 chars, five letters,
 *                                            four digits, one letter. Stored
 *                                            upper case. Unique.
 * @param   {import("express").Response} res
 *
 * @returns {Promise<void>} 200 with the company columns listed in
 *                          `company_response`. Addresses and contacts are not
 *                          included; this endpoint does not touch them.
 *
 * @throws  {app_error} 401 when the caller sent no usable token.
 * @throws  {app_error} 403 `ACCESS_FORBIDDEN` when the caller is not an admin.
 * @throws  {app_error} 404 `NOT_FOUND` when no company has that id.
 * @throws  {app_error} 409 `ALREADY_EXISTS` when the new GST or PAN number is
 *                      already on another company. The `errors` list names which
 *                      of the two clashed.
 */
const update_company = async (req, res) => {
  const company = await company_model.findById(req.params.id);

  if (!company) {
    throw new app_error(http_status.NOT_FOUND, company_messages.NOT_FOUND);
  }

  Object.assign(company, req.body, { updated_by: req.user.id });

  // `save()` runs the schema validators over the merged document, and can trip
  // the GST and PAN unique indexes, which arrive as a bare driver error.
  await run_with_company_duplicate_mapping(() => company.save());

  const { select } = get_response_shape(company_response, "update");

  return send_response(
    res,
    http_status.OK,
    company_messages.UPDATED,
    project(company, select),
  );
};

module.exports = update_company;
