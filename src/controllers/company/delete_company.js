const app_error = require("@middlewares/app_error");

const { http_status } = require("@enums");
const { company_messages } = require("@validators/messages");
const { send_response } = require("@helpers/common");
const {
  deactivate_company_with_relations,
} = require("@helpers/company");

/**
 * Deletes a company, and everything filed under it, by deactivating it.
 *
 * A delete here flips `is_active` to false rather than removing the row. The
 * company's addresses and the people at them are deactivated in the same call,
 * because a branch nobody trades with is not a branch to keep listing. Left
 * behind, those rows would still be returned by every address and contact list,
 * belonging to a company nobody can reach.
 *
 * The three writes are one transaction, owned by
 * `deactivate_company_with_relations`, so the tree cannot be half deactivated.
 *
 * Only an admin may call this, enforced on the router rather than here.
 *
 * A company that is already deactivated answers 404. It reads as missing rather
 * than being deleted a second time, which also stops a repeat call rewriting the
 * `updated_by` of a deletion somebody else made.
 *
 * `updated_by` is the signed in caller, so the row records who deactivated it.
 *
 * Nothing is undone by this endpoint. There is no restore route, and the update
 * endpoints do not accept `is_active`, so bringing a company back is a database
 * job today. Worth knowing before this is put in front of a delete button.
 *
 * @route   DELETE /admin/companies/:id
 * @access  Admin
 *
 * @param   {import("express").Request} req
 * @param   {Object} req.params
 * @param   {string} req.params.id  The company's id. 24 hex characters,
 *                                  validated by `company_id_params_schema`.
 * @param   {import("express").Response} res
 *
 * @returns {Promise<void>} 200 with a message and no payload, as every delete
 *                          here answers.
 *
 * @throws  {app_error} 401 when the caller sent no usable token.
 * @throws  {app_error} 403 `ACCESS_FORBIDDEN` when the caller is not an admin.
 * @throws  {app_error} 404 `NOT_FOUND` when no active company has that id --
 *                      whether it never existed or was already deactivated.
 */
const delete_company = async (req, res) => {
  const deactivated = await deactivate_company_with_relations(
    req.params.id,
    req.user.id,
  );

  if (!deactivated) {
    throw new app_error(http_status.NOT_FOUND, company_messages.NOT_FOUND);
  }

  return send_response(res, http_status.OK, company_messages.DELETED);
};

module.exports = delete_company;
