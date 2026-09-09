const express = require("express");

const { delete_company_address } = require("@controllers/company");
const { validate_params } = require("@middlewares/validate_request");
const {
  company_address_id_params_schema,
} = require("@validators/route_params");

const async_handler = require("@middlewares/async_handler");

const router = express.Router();

// No body validator: a delete takes nothing but the id. The cascade to the
// address's contacts is not something a caller opts into.
router.delete(
  "/addresses/:id",
  validate_params(company_address_id_params_schema),
  async_handler(delete_company_address),
);

module.exports = router;
