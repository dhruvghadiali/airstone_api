const app_error = require("@middlewares/app_error");

const { http_status } = require("@enums");
const { send_response } = require("@helpers/common");
const { company_address_messages } = require("@validators/messages");
const {
  deactivate_company_address_with_relations,
} = require("@helpers/company");

/**
 * Deletes one company address, and the people at it, by deactivating them.
 *
 * A delete here flips `is_active` to false rather than removing the row. The
 * contacts filed under the address go with it, because a branch that has closed
 * takes its people with it: left behind, they would still be returned by every
 * contact list, pointing at a place nobody visits.
 *
 * The company is left alone. A firm usually trades from more than one address,
 * and closing a branch says nothing about whether the firm is still traded with.
 * Deactivating the company from here would be this endpoint deciding something
 * it was not asked to decide. `DELETE /admin/companies/:id` is how a whole
 * company goes, and that one does cascade down to here.
 *
 * The two writes are one transaction, owned by
 * `deactivate_company_address_with_relations`, so the address and its contacts
 * cannot disagree about whether the branch is open.
 *
 * Only an admin may call this, enforced on the router rather than here.
 *
 * An address that is already deactivated answers 404. It reads as missing rather
 * than being deleted a second time, which also stops a repeat call rewriting the
 * `updated_by` of a deletion somebody else made.
 *
 * Nothing is undone by this endpoint, as with every delete here. There is no
 * restore route, and the update endpoints do not accept `is_active`.
 *
 * @route   DELETE /admin/companies/addresses/:id
 * @access  Admin
 *
 * @param   {import("express").Request} req
 * @param   {Object} req.params
 * @param   {string} req.params.id  The address's id. 24 hex characters,
 *                                  validated by
 *                                  `company_address_id_params_schema`.
 * @param   {import("express").Response} res
 *
 * @returns {Promise<void>} 200 with a message and no payload, as every delete
 *                          here answers.
 *
 * @throws  {app_error} 401 when the caller sent no usable token.
 * @throws  {app_error} 403 `ACCESS_FORBIDDEN` when the caller is not an admin.
 * @throws  {app_error} 404 `NOT_FOUND` when no active address has that id --
 *                      whether it never existed or was already deactivated.
 */
const delete_company_address = async (req, res) => {
  const deactivated = await deactivate_company_address_with_relations(
    req.params.id,
    req.user.id,
  );

  if (!deactivated) {
    throw new app_error(
      http_status.NOT_FOUND,
      company_address_messages.NOT_FOUND,
    );
  }

  return send_response(
    res,
    http_status.OK,
    company_address_messages.DELETED,
  );
};

module.exports = delete_company_address;
