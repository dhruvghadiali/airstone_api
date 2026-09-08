const express = require("express");

const { http_status } = require("@enums");
const { send_response } = require("@helpers/common");

const auth_router = require("@routes/admin/auth");

const router = express.Router();

router.get("/", (_req, res) =>
  send_response(res, http_status.OK, "Admin API is available"),
);
router.use("/auth", auth_router);

module.exports = router;
