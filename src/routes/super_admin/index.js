const express = require("express");

const auth_router = require("@routes/super_admin/auth");

const router = express.Router();

router.use("/auth", auth_router);

module.exports = router;
