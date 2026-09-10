const user_type = Object.freeze({
  ADMIN: "admin",
  EMPLOYEE: "employee",
  SUPER_ADMIN: "super_admin",
});

/**
 * The user types a super admin may see and act on through the super admin's user
 * routes. The list is scoped to them and the delete may only reach them, so what
 * a super admin can see and what they can deactivate cannot drift apart.
 *
 * Super admins are deliberately excluded, and neither route can reach one. The
 * list can therefore never enumerate the accounts that administer the system,
 * and the delete can never remove the last account able to create an
 * administrator -- including the caller's own.
 */
const manageable_user_types = Object.freeze([
  user_type.ADMIN,
  user_type.EMPLOYEE,
]);

module.exports = { user_type, manageable_user_types };
