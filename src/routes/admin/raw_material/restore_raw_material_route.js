const express = require("express");

const { restore_raw_material } = require("@controllers/raw_material");
const { validate_params } = require("@middlewares/validate_request");
const { raw_material_id_params_schema } = require("@validators/route_params");

const async_handler = require("@middlewares/async_handler");

const router = express.Router();

router.patch(
  "/:id/restore",
  validate_params(raw_material_id_params_schema),
  async_handler(restore_raw_material),
);

module.exports = router;
