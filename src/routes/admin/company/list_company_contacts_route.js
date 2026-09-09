const express = require("express");

const { list_company_contacts } = require("@controllers/company");
const { validate_query } = require("@middlewares/validate_request");
const {
  list_company_contacts_query_schema,
} = require("@validators/query_params");

const async_handler = require("@middlewares/async_handler");

const router = express.Router();

router.get(
  "/contacts",
  validate_query(list_company_contacts_query_schema),
  async_handler(list_company_contacts),
);

module.exports = router;
