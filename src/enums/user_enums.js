const user_type = Object.freeze({
  ADMIN: "admin",
  EMPLOYEE: "employee",
  SUPER_ADMIN: "super_admin",
});

/**
 * The user types a super admin may create, edit, or delete through the employee
 * router. Super admins are deliberately excluded so the endpoint can never be
 * used to remove the last administrator.
 */
const manageable_user_types = Object.freeze([
  user_type.ADMIN,
  user_type.EMPLOYEE,
]);

module.exports = { user_type, manageable_user_types };
