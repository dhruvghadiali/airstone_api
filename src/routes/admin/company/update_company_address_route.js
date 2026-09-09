const express = require("express");

const { update_company_address } = require("@controllers/company");
const {
  update_company_address_schema,
} = require("@validators/request_body");
const {
  company_address_id_params_schema,
} = require("@validators/route_params");
const {
  validate_body,
  validate_params,
} = require("@middlewares/validate_request");

const async_handler = require("@middlewares/async_handler");

const router = express.Router();

router.patch(
  "/addresses/:id",
  validate_params(company_address_id_params_schema),
  validate_body(update_company_address_schema),
  async_handler(update_company_address),
);

module.exports = router;
