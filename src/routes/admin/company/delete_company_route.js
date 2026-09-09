const express = require("express");

const { delete_company } = require("@controllers/company");
const { validate_params } = require("@middlewares/validate_request");
const { company_id_params_schema } = require("@validators/route_params");

const async_handler = require("@middlewares/async_handler");

const router = express.Router();

// No body validator: a delete takes nothing but the id. The cascade to the
// company's addresses and contacts is not something a caller opts into.
router.delete(
  "/:id",
  validate_params(company_id_params_schema),
  async_handler(delete_company),
);

module.exports = router;
