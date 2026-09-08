const express = require("express");

const { admin_signin } = require("@controllers/auth");
const { validate_body } = require("@middlewares/validate_request");
const { admin_signin_schema } = require("@validators/request_body");

const async_handler = require("@middlewares/async_handler");

const router = express.Router();

router.post(
  "/signin",
  validate_body(admin_signin_schema),
  async_handler(admin_signin),
);

module.exports = router;
