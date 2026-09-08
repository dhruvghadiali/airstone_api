const express = require("express");

const { create_company } = require("@controllers/company");
const { validate_body } = require("@middlewares/validate_request");
const { create_company_schema } = require("@validators/request_body");

const async_handler = require("@middlewares/async_handler");

const router = express.Router();

router.post(
  "/",
  validate_body(create_company_schema),
  async_handler(create_company),
);

module.exports = router;
