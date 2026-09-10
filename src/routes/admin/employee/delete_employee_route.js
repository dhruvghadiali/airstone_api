const express = require("express");

const { delete_employee } = require("@controllers/user");
const { validate_params } = require("@middlewares/validate_request");
const { user_id_params_schema } = require("@validators/route_params");

const async_handler = require("@middlewares/async_handler");

const router = express.Router();

// Shares `user_id_params_schema` with the super admin's delete route. Both name
// an account in the same collection by the same id; only the scope differs, and
// that lives in the controller.
router.delete(
  "/:id",
  validate_params(user_id_params_schema),
  async_handler(delete_employee),
);

module.exports = router;
