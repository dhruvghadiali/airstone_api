const express = require("express");

const { delete_user } = require("@controllers/user");
const { validate_params } = require("@middlewares/validate_request");
const { user_id_params_schema } = require("@validators/route_params");

const async_handler = require("@middlewares/async_handler");

const router = express.Router();

// No body validator: a delete takes nothing but the id. Which accounts this id
// may name is the controller's scope, not something a caller opts into.
router.delete(
  "/:id",
  validate_params(user_id_params_schema),
  async_handler(delete_user),
);

module.exports = router;
