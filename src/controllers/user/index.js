const list_users = require("@controllers/user/list_users");
const delete_user = require("@controllers/user/delete_user");
const list_employees = require("@controllers/user/list_employees");
const delete_employee = require("@controllers/user/delete_employee");

module.exports = {
  list_users,
  delete_user,
  list_employees,
  delete_employee,
};
