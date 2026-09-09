const { company_contact_model } = require("@models/company");
const app_error = require("@middlewares/app_error");

const { http_status } = require("@enums");
const { send_response } = require("@helpers/common");
const { company_contact_messages } = require("@validators/messages");

/**
 * Deletes one company contact by deactivating them.
 *
 * A delete here flips `is_active` to false rather than removing the row.
 *
 * Nothing cascades. A contact is the bottom of the tree -- no row is filed under
 * one -- and the address they worked at and the company that owns it are both
 * untouched. A person leaving a firm says nothing about whether the branch is
 * open or the firm is still traded with. This is the one delete in the feature
 * that reaches a single collection.
 *
 * That is also why there is no helper and no transaction behind this. Both exist
 * on the other two deletes to keep several collections in step, and one write to
 * one collection has nothing to keep in step with. A `findOneAndUpdate` is
 * already atomic.
 *
 * Only an admin may call this, enforced on the router rather than here.
 *
 * `is_active: true` is in the filter, so a contact that is already deactivated
 * reads as missing and answers 404 rather than being deleted a second time. That
 * also stops a repeat call rewriting the `updated_by` of a deletion somebody
 * else made -- including one made by deleting the address or the company above
 * them, which is how a contact is most often deactivated today.
 *
 * Nothing is undone by this endpoint, as with every delete here. There is no
 * restore route, and the update endpoints do not accept `is_active`.
 *
 * @route   DELETE /admin/companies/contacts/:id
 * @access  Admin
 *
 * @param   {import("express").Request} req
 * @param   {Object} req.params
 * @param   {string} req.params.id  The contact's id. 24 hex characters,
 *                                  validated by
 *                                  `company_contact_id_params_schema`.
 * @param   {import("express").Response} res
 *
 * @returns {Promise<void>} 200 with a message and no payload, as every delete
 *                          here answers.
 *
 * @throws  {app_error} 401 when the caller sent no usable token.
 * @throws  {app_error} 403 `ACCESS_FORBIDDEN` when the caller is not an admin.
 * @throws  {app_error} 404 `NOT_FOUND` when no active contact has that id --
 *                      whether they never existed or were already deactivated.
 */
const delete_company_contact = async (req, res) => {
  const company_contact = await company_contact_model.findOneAndUpdate(
    { _id: req.params.id, is_active: true },
    { is_active: false, updated_by: req.user.id },
    { new: true, runValidators: true },
  );

  if (!company_contact) {
    throw new app_error(
      http_status.NOT_FOUND,
      company_contact_messages.NOT_FOUND,
    );
  }

  return send_response(
    res,
    http_status.OK,
    company_contact_messages.DELETED,
  );
};

module.exports = delete_company_contact;
