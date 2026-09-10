const app_error = require("@middlewares/app_error");

const { deactivate_user } = require("@helpers/user");
const { send_response } = require("@helpers/common");
const { user_messages } = require("@validators/messages");
const { http_status, manageable_user_types } = require("@enums");

/**
 * Deletes an admin or an employee account by deactivating it.
 *
 * A delete here flips `is_active` to false rather than removing the row. An
 * account is referenced by whatever it created, so removing it would leave those
 * rows pointing at nothing, and the person's history would stop making sense.
 *
 * The scope is `manageable_user_types`, passed to the helper rather than checked
 * here. A super admin account is not in that list, so this endpoint cannot
 * deactivate one -- not another super admin's, and not the caller's own. That is
 * what stops the last account able to create administrators being deleted
 * through the API, and it is the same list the user list is scoped by, so what a
 * super admin can see and what they can delete cannot drift apart.
 *
 * An account outside the scope answers 404 rather than 403, because the scope is
 * part of the query. A caller cannot tell an id that does not exist from one
 * belonging to a super admin, which is the point: a 403 here would confirm that
 * an id names an administrator.
 *
 * An account that is already deactivated answers 404 for the same reason it does
 * everywhere else in this API. It reads as missing rather than being deleted a
 * second time.
 *
 * Nothing records who did it. `user_model` carries no `updated_by`, so the row
 * knows it was deactivated and not by whom.
 *
 * Nothing is undone by this endpoint either. There is no restore route, so
 * bringing an account back is a database job today -- and a deactivated account
 * cannot sign in. Worth knowing before this is put behind a delete button.
 *
 * Only a super admin may call this, enforced on the router rather than here.
 *
 * @route   DELETE /super-admin/users/:id
 * @access  Super admin
 *
 * @param   {import("express").Request} req
 * @param   {Object} req.params
 * @param   {string} req.params.id  The account's id. 24 hex characters,
 *                                  validated by `user_id_params_schema`.
 * @param   {import("express").Response} res
 *
 * @returns {Promise<void>} 200 with a message and no payload, as every delete
 *                          here answers.
 *
 * @throws  {app_error} 401 when the caller sent no usable token.
 * @throws  {app_error} 403 `ACCESS_FORBIDDEN` when the caller is not a super
 *                      admin.
 * @throws  {app_error} 404 `NOT_FOUND` when no active admin or employee has that
 *                      id -- whether it never existed, was already deactivated,
 *                      or belongs to a super admin.
 */
const delete_user = async (req, res) => {
  const deactivated = await deactivate_user(
    req.params.id,
    manageable_user_types,
  );

  if (!deactivated) {
    throw new app_error(http_status.NOT_FOUND, user_messages.NOT_FOUND);
  }

  return send_response(res, http_status.OK, user_messages.DELETED);
};

module.exports = delete_user;
