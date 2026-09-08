const express = require("express");

const { employee_signin } = require("@controllers/auth");
const { validate_body } = require("@middlewares/validate_request");
const { employee_signin_schema } = require("@validators/request_body");

const async_handler = require("@middlewares/async_handler");

const router = express.Router();

router.post(
  "/signin",
  validate_body(employee_signin_schema),
  async_handler(employee_signin),
);

module.exports = router;
