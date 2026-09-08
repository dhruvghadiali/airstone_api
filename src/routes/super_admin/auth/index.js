const express = require("express");

const admin_signup_route = require("@routes/super_admin/auth/admin_signup_route");
const super_admin_signin_route = require("@routes/super_admin/auth/super_admin_signin_route");
const super_admin_signup_route = require("@routes/super_admin/auth/super_admin_signup_route");

const router = express.Router();

router.use(super_admin_signup_route);
router.use(super_admin_signin_route);
router.use(admin_signup_route);

module.exports = router;
