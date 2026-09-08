const admin_signin = require("@controllers/auth/admin_signin");
const admin_signup = require("@controllers/auth/admin_signup");
const employee_signin = require("@controllers/auth/employee_signin");
const employee_signup = require("@controllers/auth/employee_signup");
const super_admin_signin = require("@controllers/auth/super_admin_signin");
const super_admin_signup = require("@controllers/auth/super_admin_signup");

module.exports = {
  admin_signin,
  admin_signup,
  employee_signin,
  employee_signup,
  super_admin_signin,
  super_admin_signup,
};
