const { company_address_model } = require("@models/company");
const app_error = require("@middlewares/app_error");

const { http_status } = require("@enums");
const { project } = require("@utils/projection");
const { company_address_response } = require("@helpers/company");
const { company_address_messages } = require("@validators/messages");
const { send_response, get_response_shape } = require("@helpers/common");

/**
 * Changes one company address.
 *
 * The address only. The company it belongs to and the people who work at it are
 * rows of their own, edited through their own endpoints, so `company` and
 * `contact_person` in the body are both a 400.
 *
 * `company` is refused rather than ignored because moving an address to another
 * company is not an edit. Every contact filed under the address still points at
 * the old company, so the move would leave them naming a company that no longer
 * owns the place they work at. An address at a new company is a new address.
 *
 * The address is found by its own id, with no company id in the path. An address
 * id is unique, and an admin may edit every company's addresses, so there is
 * nothing for a second id to narrow.
 *
 * Only an admin may call this, enforced on the router rather than here.
 *
 * `updated_by` is the signed in caller, taken from the token. The schema refuses
 * an `updated_by` field, so a caller cannot record the change against somebody
 * else.
 *
 * A deactivated address can still be edited, for the same reason a deactivated
 * company can: `is_active` is not something this endpoint accepts, so filtering
 * would only make a typo impossible to correct.
 *
 * The read takes no `select`. `save()` validates and writes the whole document,
 * and a projected document saves back a mutilated one. The response is narrowed
 * afterwards, to the response only.
 *
 * @route   PATCH /admin/companies/addresses/:id
 * @access  Admin
 *
 * @param   {import("express").Request} req
 * @param   {Object} req.params
 * @param   {string} req.params.id  The address's id. 24 hex characters,
 *                                  validated by
 *                                  `company_address_id_params_schema`.
 * @param   {Object} req.body Validated by `update_company_address_schema`, which
 *                            requires at least one field and rejects unknown
 *                            ones.
 * @param   {string} [req.body.address]  3-500 chars, trimmed. The whole postal
 *                                       address as one block.
 * @param   {string} [req.body.pincode]  Exactly 6 digits, cannot start with
 *                                       zero.
 * @param   {import("express").Response} res
 *
 * @returns {Promise<void>} 200 with the address columns listed in
 *                          `company_address_response`. The company and the
 *                          contacts are not included; this endpoint does not
 *                          touch them.
 *
 * @throws  {app_error} 401 when the caller sent no usable token.
 * @throws  {app_error} 403 `ACCESS_FORBIDDEN` when the caller is not an admin.
 * @throws  {app_error} 404 `NOT_FOUND` when no address has that id.
 */
const update_company_address = async (req, res) => {
  const company_address = await company_address_model.findById(req.params.id);

  if (!company_address) {
    throw new app_error(
      http_status.NOT_FOUND,
      company_address_messages.NOT_FOUND,
    );
  }

  Object.assign(company_address, req.body, { updated_by: req.user.id });

  // No duplicate mapping here, unlike the company. An address carries no unique
  // index, so the only failure this save can raise is a validation error, which
  // the error handler already words per field.
  await company_address.save();

  const { select } = get_response_shape(company_address_response, "update");

  return send_response(
    res,
    http_status.OK,
    company_address_messages.UPDATED,
    project(company_address, select),
  );
};

module.exports = update_company_address;
