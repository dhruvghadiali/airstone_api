const express = require("express");

const { create_raw_material } = require("@controllers/raw_material");
const { validate_body } = require("@middlewares/validate_request");
const { create_raw_material_schema } = require("@validators/request_body");

const async_handler = require("@middlewares/async_handler");

const router = express.Router();

router.post(
  "/",
  validate_body(create_raw_material_schema),
  async_handler(create_raw_material),
);

module.exports = router;
