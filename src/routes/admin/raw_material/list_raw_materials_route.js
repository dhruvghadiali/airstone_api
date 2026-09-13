const express = require("express");

const { list_raw_materials } = require("@controllers/raw_material");
const { validate_query } = require("@middlewares/validate_request");
const { list_raw_materials_query_schema } = require("@validators/query_params");

const async_handler = require("@middlewares/async_handler");

const router = express.Router();

router.get(
  "/",
  validate_query(list_raw_materials_query_schema),
  async_handler(list_raw_materials),
);

module.exports = router;
