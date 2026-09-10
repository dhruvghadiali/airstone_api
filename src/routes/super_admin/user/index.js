const express = require("express");

const { user_type } = require("@enums");
const {
  authenticate_user,
  authorize_user_types,
} = require("@middlewares/authenticate_user");

const list_users_route = require("@routes/super_admin/user/list_users_route");
const delete_user_route = require("@routes/super_admin/user/delete_user_route");

const router = express.Router();

/**
 * Staff accounts are the super admin's to look at.
 *
 * Every route under here is protected, so the two guards sit on the router
 * rather than on each route. A route added later is then guarded by being
 * mounted, instead of by somebody remembering two lines. That is the opposite of
 * the auth router beside this one, which carries the public signins and so has
 * to guard each protected route on its own.
 *
 * An admin deliberately cannot reach this, even though the table lists employees
 * an admin creates. Reading every account in the system, admins included, is a
 * super admin's business.
 *
 * `GET /` lists the accounts and `DELETE /:id` deactivates one. The rest are
 * missing by design rather than by oversight. There is no create route because
 * an account is created through the signup that names the role it makes -- an
 * admin at `/super-admin/auth/admin/signup`, an employee at
 * `/admin/auth/employee/signup` -- and a second door onto the same write would
 * be a second place to forget to fix the new account's user type. There is no
 * get or update route because neither has been asked for.
 *
 * The delete is a soft delete and reverses nothing: no route here brings an
 * account back, and a deactivated one cannot sign in.
 *
 * Neither route can reach a super admin, and neither returns a password. None of
 * that is this file's doing: the list is scoped by a `base_filter` in its
 * config, the delete by the user types its controller passes to the helper, and
 * the password by `select: false` on the schema. They are written down here
 * because a reader checking who can see and change what starts at the router.
 */
router.use(authenticate_user, authorize_user_types(user_type.SUPER_ADMIN));
router.use(list_users_route);
router.use(delete_user_route);

module.exports = router;
