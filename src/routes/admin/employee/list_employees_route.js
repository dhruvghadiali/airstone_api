const express = require("express");

const { list_employees } = require("@controllers/user");
const { validate_query } = require("@middlewares/validate_request");
const { list_employees_query_schema } = require("@validators/query_params");

const async_handler = require("@middlewares/async_handler");

const router = express.Router();

router.get(
  "/",
  validate_query(list_employees_query_schema),
  async_handler(list_employees),
);

module.exports = router;
