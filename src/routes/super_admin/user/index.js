const express = require("express");

const { user_type } = require("@enums");
const {
  authenticate_user,
  authorize_user_types,
} = require("@middlewares/authenticate_user");

const list_users_route = require("@routes/super_admin/user/list_users_route");

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
 * `GET /` is the only route today, and the missing ones are missing by design
 * rather than by oversight. There is no create route because an account is
 * created through the signup that names the role it makes -- an admin at
 * `/super-admin/auth/admin/signup`, an employee at `/admin/auth/employee/signup`
 * -- and a second door onto the same write would be a second place to forget to
 * fix the new account's user type. There is no get, update or delete route
 * because none has been asked for; `manageable_user_types` exists for the day
 * they are.
 *
 * The list never shows a super admin and never returns a password. Neither is
 * this file's doing: the first is a `base_filter` in the list config, the second
 * is `select: false` on the schema. They are written down here because a reader
 * checking who can see what starts at the router.
 */
router.use(authenticate_user, authorize_user_types(user_type.SUPER_ADMIN));
router.use(list_users_route);

module.exports = router;
