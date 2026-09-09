const { company_contact_model } = require("@models/company");
const app_error = require("@middlewares/app_error");

const { http_status } = require("@enums");
const { project } = require("@utils/projection");
const { company_contact_response } = require("@helpers/company");
const { company_contact_messages } = require("@validators/messages");
const { send_response, get_response_shape } = require("@helpers/common");

/**
 * Changes one company contact.
 *
 * Who the person is and what they do. Where they sit is not editable here:
 * `company` and `company_address` are both a 400 rather than fields that are
 * quietly ignored.
 *
 * The two are refused together because they are one fact. An address already
 * knows its company, so taking one without the other would let a caller leave
 * the contact naming a company that does not own the address it points at.
 * Taking both would make this a move rather than an edit, and a move has to
 * prove the pair agree before it writes -- the check `create_company` runs with
 * `find_active_company_address`. A contact who has changed branch is added at
 * the new one.
 *
 * The contact is found by its own id, with no company or address id in the path.
 * A contact id is unique, and an admin may edit every company's contacts, so
 * there is nothing for a second id to narrow.
 *
 * Only an admin may call this, enforced on the router rather than here.
 *
 * `updated_by` is the signed in caller, taken from the token. The schema refuses
 * an `updated_by` field, so a caller cannot record the change against somebody
 * else.
 *
 * A deactivated contact can still be edited, for the same reason a deactivated
 * company or address can: `is_active` is not something this endpoint accepts, so
 * filtering would only make a typo impossible to correct.
 *
 * The read takes no `select`. `save()` validates and writes the whole document,
 * and a projected document saves back a mutilated one. The response is narrowed
 * afterwards, to the response only.
 *
 * @route   PATCH /admin/companies/contacts/:id
 * @access  Admin
 *
 * @param   {import("express").Request} req
 * @param   {Object} req.params
 * @param   {string} req.params.id  The contact's id. 24 hex characters,
 *                                  validated by
 *                                  `company_contact_id_params_schema`.
 * @param   {Object} req.body Validated by `update_company_contact_schema`, which
 *                            requires at least one field and rejects unknown
 *                            ones.
 * @param   {string} [req.body.name]          2-100 chars, trimmed. The whole
 *                                            name in one field.
 * @param   {string} [req.body.phone_number]  Exactly 10 digits.
 * @param   {string} [req.body.position]      One of owner, manager, accounts,
 *                                            purchase, sales, other.
 * @param   {import("express").Response} res
 *
 * @returns {Promise<void>} 200 with the contact columns listed in
 *                          `company_contact_response`. The company and the
 *                          address are not included; this endpoint does not
 *                          touch them.
 *
 * @throws  {app_error} 401 when the caller sent no usable token.
 * @throws  {app_error} 403 `ACCESS_FORBIDDEN` when the caller is not an admin.
 * @throws  {app_error} 404 `NOT_FOUND` when no contact has that id.
 */
const update_company_contact = async (req, res) => {
  const company_contact = await company_contact_model.findById(req.params.id);

  if (!company_contact) {
    throw new app_error(
      http_status.NOT_FOUND,
      company_contact_messages.NOT_FOUND,
    );
  }

  Object.assign(company_contact, req.body, { updated_by: req.user.id });

  // No duplicate mapping here, as on the address. A contact carries no unique
  // index -- two people at one branch may share a landline -- so the only
  // failure this save can raise is a validation error, which the error handler
  // already words per field.
  await company_contact.save();

  const { select } = get_response_shape(company_contact_response, "update");

  return send_response(
    res,
    http_status.OK,
    company_contact_messages.UPDATED,
    project(company_contact, select),
  );
};

module.exports = update_company_contact;
