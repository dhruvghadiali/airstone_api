const express = require("express");

const { update_company_contact } = require("@controllers/company");
const {
  update_company_contact_schema,
} = require("@validators/request_body");
const {
  company_contact_id_params_schema,
} = require("@validators/route_params");
const {
  validate_body,
  validate_params,
} = require("@middlewares/validate_request");

const async_handler = require("@middlewares/async_handler");

const router = express.Router();

router.patch(
  "/contacts/:id",
  validate_params(company_contact_id_params_schema),
  validate_body(update_company_contact_schema),
  async_handler(update_company_contact),
);

module.exports = router;
