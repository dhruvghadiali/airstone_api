const express = require("express");

const { list_users } = require("@controllers/user");
const { validate_query } = require("@middlewares/validate_request");
const { list_users_query_schema } = require("@validators/query_params");

const async_handler = require("@middlewares/async_handler");

const router = express.Router();

router.get(
  "/",
  validate_query(list_users_query_schema),
  async_handler(list_users),
);

module.exports = router;
