const express = require("express");

const auth_router = require("@routes/super_admin/auth");
const user_router = require("@routes/super_admin/user");

const router = express.Router();

router.use("/auth", auth_router);
router.use("/users", user_router);

module.exports = router;
