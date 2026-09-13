const express = require("express");

const { update_raw_material } = require("@controllers/raw_material");
const { update_raw_material_schema } = require("@validators/request_body");
const { raw_material_id_params_schema } = require("@validators/route_params");
const {
  validate_body,
  validate_params,
} = require("@middlewares/validate_request");

const async_handler = require("@middlewares/async_handler");

const router = express.Router();

router.patch(
  "/:id",
  validate_params(raw_material_id_params_schema),
  validate_body(update_raw_material_schema),
  async_handler(update_raw_material),
);

module.exports = router;
