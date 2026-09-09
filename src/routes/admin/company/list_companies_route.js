const express = require("express");

const { list_companies } = require("@controllers/company");
const { validate_query } = require("@middlewares/validate_request");
const { list_companies_query_schema } = require("@validators/query_params");

const async_handler = require("@middlewares/async_handler");

const router = express.Router();

router.get(
  "/",
  validate_query(list_companies_query_schema),
  async_handler(list_companies),
);

module.exports = router;
