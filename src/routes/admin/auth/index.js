const express = require("express");

const admin_signin_route = require("@routes/admin/auth/admin_signin_route");
const employee_signup_route = require("@routes/admin/auth/employee_signup_route");

const router = express.Router();

router.use(admin_signin_route);
router.use(employee_signup_route);

module.exports = router;
