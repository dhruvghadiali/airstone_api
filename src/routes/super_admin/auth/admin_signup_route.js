const express = require("express");

const { user_type } = require("@enums");
const { admin_signup } = require("@controllers/auth");
const { validate_body } = require("@middlewares/validate_request");
const { admin_signup_schema } = require("@validators/request_body");
const {
  authenticate_user,
  authorize_user_types,
} = require("@middlewares/authenticate_user");

const async_handler = require("@middlewares/async_handler");

const router = express.Router();

// Lives on the super admin router because a super admin is who calls it, and
// the path names the group it creates. Guarded on the route rather than on the
// router above it, because the super admin's own signup and signin sit on that
// same router and have to stay public.
router.post(
  "/admin/signup",
  authenticate_user,
  authorize_user_types(user_type.SUPER_ADMIN),
  validate_body(admin_signup_schema),
  async_handler(admin_signup),
);

module.exports = router;
