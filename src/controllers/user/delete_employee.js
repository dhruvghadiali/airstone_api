const app_error = require("@middlewares/app_error");

const { user_type, http_status } = require("@enums");
const { deactivate_user } = require("@helpers/user");
const { send_response } = require("@helpers/common");
const { user_messages } = require("@validators/messages");

/**
 * Deletes an employee account by deactivating it.
 *
 * The admin's narrower version of what `delete_user` does for a super admin. It
 * is a second controller rather than the same one mounted twice because the two
 * differ in the one thing a mount cannot change: which accounts they may act on.
 * Each names its own scope, and the shared write lives in `deactivate_user`.
 *
 * A delete here flips `is_active` to false rather than removing the row. An
 * account is referenced by whatever it created, so removing it would leave those
 * rows pointing at nothing.
 *
 * The scope is the employee type alone. An admin cannot deactivate another
 * admin, their own account, or a super admin's -- the account is simply not
 * matched. That mirrors the employee list this route sits beside, so what an
 * admin can see is what an admin can delete.
 *
 * An account outside that scope answers 404 rather than 403, because the scope
 * is part of the query. A caller cannot tell an id that does not exist from one
 * belonging to an administrator, which is the point: a 403 here would confirm
 * that an id names one.
 *
 * An account that is already deactivated answers 404 for the same reason. It
 * reads as missing rather than being deleted a second time.
 *
 * Nothing records who did it, and nothing is undone by this endpoint. There is
 * no restore route, so bringing an employee back is a database job today, and a
 * deactivated account cannot sign in.
 *
 * Only an admin may call this, enforced on the router rather than here.
 *
 * @route   DELETE /admin/employees/:id
 * @access  Admin
 *
 * @param   {import("express").Request} req
 * @param   {Object} req.params
 * @param   {string} req.params.id  The employee's id. 24 hex characters,
 *                                  validated by `user_id_params_schema`.
 * @param   {import("express").Response} res
 *
 * @returns {Promise<void>} 200 with a message and no payload, as every delete
 *                          here answers.
 *
 * @throws  {app_error} 401 when the caller sent no usable token.
 * @throws  {app_error} 403 `ACCESS_FORBIDDEN` when the caller is not an admin.
 * @throws  {app_error} 404 `EMPLOYEE_NOT_FOUND` when no active employee has that
 *                      id -- whether it never existed, was already deactivated,
 *                      or belongs to an admin or a super admin.
 */
const delete_employee = async (req, res) => {
  const deactivated = await deactivate_user(req.params.id, [
    user_type.EMPLOYEE,
  ]);

  if (!deactivated) {
    throw new app_error(
      http_status.NOT_FOUND,
      user_messages.EMPLOYEE_NOT_FOUND,
    );
  }

  return send_response(res, http_status.OK, user_messages.EMPLOYEE_DELETED);
};

module.exports = delete_employee;
