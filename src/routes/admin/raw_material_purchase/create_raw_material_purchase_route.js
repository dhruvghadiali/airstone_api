const express = require("express");

const { validate_body } = require("@middlewares/validate_request");
const {
  create_raw_material_purchase,
} = require("@controllers/raw_material_purchase");
const {
  create_raw_material_purchase_schema,
} = require("@validators/request_body");

const async_handler = require("@middlewares/async_handler");

const router = express.Router();

router.post(
  "/",
  validate_body(create_raw_material_purchase_schema),
  async_handler(create_raw_material_purchase),
);

module.exports = router;
