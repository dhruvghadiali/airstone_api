const express = require("express");

const { user_type } = require("@enums");
const { employee_signup } = require("@controllers/auth");
const { validate_body } = require("@middlewares/validate_request");
const { employee_signup_schema } = require("@validators/request_body");
const {
  authenticate_user,
  authorize_user_types,
} = require("@middlewares/authenticate_user");

const async_handler = require("@middlewares/async_handler");

const router = express.Router();

// Lives on the admin router because an admin is who calls it, and the path
// names the group it creates. A super admin deliberately cannot call it: each
// group creates the group below it. Guarded on the route rather than on the
// router above it, because the admin signin sits on that same router and has to
// stay public.
router.post(
  "/employee/signup",
  authenticate_user,
  authorize_user_types(user_type.ADMIN),
  validate_body(employee_signup_schema),
  async_handler(employee_signup),
);

module.exports = router;
