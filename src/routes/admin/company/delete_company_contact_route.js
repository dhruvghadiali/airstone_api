const express = require("express");

const { delete_company_contact } = require("@controllers/company");
const { validate_params } = require("@middlewares/validate_request");
const {
  company_contact_id_params_schema,
} = require("@validators/route_params");

const async_handler = require("@middlewares/async_handler");

const router = express.Router();

// No body validator: a delete takes nothing but the id. Nothing cascades from a
// contact either, so this is the one delete here that touches one collection.
router.delete(
  "/contacts/:id",
  validate_params(company_contact_id_params_schema),
  async_handler(delete_company_contact),
);

module.exports = router;
