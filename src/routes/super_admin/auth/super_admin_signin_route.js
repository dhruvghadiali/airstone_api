const express = require("express");

const { super_admin_signin } = require("@controllers/auth");
const { validate_body } = require("@middlewares/validate_request");
const { super_admin_signin_schema } = require("@validators/request_body");

const async_handler = require("@middlewares/async_handler");

const router = express.Router();

router.post(
  "/signin",
  validate_body(super_admin_signin_schema),
  async_handler(super_admin_signin),
);

module.exports = router;
