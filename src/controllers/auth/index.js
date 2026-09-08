const admin_signin = require("@controllers/auth/admin_signin");
const employee_signin = require("@controllers/auth/employee_signin");
const super_admin_signin = require("@controllers/auth/super_admin_signin");
const super_admin_signup = require("@controllers/auth/super_admin_signup");

module.exports = {
  admin_signin,
  employee_signin,
  super_admin_signin,
  super_admin_signup,
};
