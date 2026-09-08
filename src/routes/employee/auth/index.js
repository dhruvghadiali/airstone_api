const express = require("express");

const employee_signin_route = require("@routes/employee/auth/employee_signin_route");

const router = express.Router();

router.use(employee_signin_route);

module.exports = router;
