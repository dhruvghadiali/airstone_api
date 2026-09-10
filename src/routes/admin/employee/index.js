const express = require("express");

const { user_type } = require("@enums");
const {
  authenticate_user,
  authorize_user_types,
} = require("@middlewares/authenticate_user");

const list_employees_route = require("@routes/admin/employee/list_employees_route");

const router = express.Router();

/**
 * Employees are an admin's to look at.
 *
 * Every route under here is protected, so the two guards sit on the router
 * rather than on each route. A route added later is then guarded by being
 * mounted, instead of by somebody remembering two lines.
 *
 * A super admin deliberately cannot reach this, and has no need to: the super
 * admin's own table at `/super-admin/users` already carries every employee, plus
 * the admins this one hides. The two are the same rows through different
 * windows, so a super admin reaching this router would only be reading a
 * narrower copy of what it already has.
 *
 * `GET /` is the only route today, and the missing ones are missing by design.
 * There is no create route because an employee account is created through the
 * signup that names the role it makes, at `/admin/auth/employee/signup`, and a
 * second door onto the same write would be a second place to forget to fix the
 * new account's user type. There is no get, update or delete route because none
 * has been asked for.
 *
 * The list shows employees and nothing else, and never returns a password.
 * Neither is this file's doing: the first is a `base_filter` in the list config,
 * the second is `select: false` on the schema. They are written down here
 * because a reader checking who can see what starts at the router.
 */
router.use(authenticate_user, authorize_user_types(user_type.ADMIN));
router.use(list_employees_route);

module.exports = router;
