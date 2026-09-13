const express = require("express");

const { delete_raw_material } = require("@controllers/raw_material");
const { validate_params } = require("@middlewares/validate_request");
const { raw_material_id_params_schema } = require("@validators/route_params");

const async_handler = require("@middlewares/async_handler");

const router = express.Router();

router.delete(
  "/:id",
  validate_params(raw_material_id_params_schema),
  async_handler(delete_raw_material),
);

module.exports = router;
