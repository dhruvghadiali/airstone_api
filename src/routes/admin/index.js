const express = require("express");

const auth_router = require("@routes/admin/auth");
const company_router = require("@routes/admin/company");
const employee_router = require("@routes/admin/employee");

const router = express.Router();

router.use("/auth", auth_router);
router.use("/companies", company_router);
router.use("/employees", employee_router);

module.exports = router;
