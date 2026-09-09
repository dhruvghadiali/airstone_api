const express = require("express");

const { update_company } = require("@controllers/company");
const { update_company_schema } = require("@validators/request_body");
const { company_id_params_schema } = require("@validators/route_params");
const {
  validate_body,
  validate_params,
} = require("@middlewares/validate_request");

const async_handler = require("@middlewares/async_handler");

const router = express.Router();

router.patch(
  "/:id",
  validate_params(company_id_params_schema),
  validate_body(update_company_schema),
  async_handler(update_company),
);

module.exports = router;
