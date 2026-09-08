const express = require("express");

const admin_signin_route = require("@routes/admin/auth/admin_signin_route");

const router = express.Router();

router.use(admin_signin_route);

module.exports = router;
