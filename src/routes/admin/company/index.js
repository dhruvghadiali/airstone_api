const express = require("express");

const { user_type } = require("@enums");
const {
  authenticate_user,
  authorize_user_types,
} = require("@middlewares/authenticate_user");

const create_company_route = require("@routes/admin/company/create_company_route");
const update_company_route = require("@routes/admin/company/update_company_route");
const update_company_address_route = require("@routes/admin/company/update_company_address_route");

const router = express.Router();

/**
 * Companies are an admin's to manage.
 *
 * Every route under here is protected, so the two guards sit on the router
 * rather than on each route. A route added later is then guarded by being
 * mounted, instead of by somebody remembering two lines.
 *
 * A super admin deliberately cannot reach this. Managing suppliers and customers
 * is day to day work, and the super admin router is for the things only it can
 * do -- creating admins, and bootstrapping itself.
 *
 * Create, update, and update one address exist today. There is no get, list or
 * delete route yet, by design rather than by oversight: the endpoints have not
 * been asked for.
 *
 * Each update touches one collection. `PATCH /:id` changes the company's own
 * columns and `PATCH /addresses/:id` changes one address, so neither can reach
 * across into rows the caller did not name. Contacts have no endpoint yet.
 *
 * `/addresses/:id` is mounted before `/:id`. Express would not confuse the two
 * -- `/:id` matches a single segment -- but mounting the more specific path
 * first is the project's rule and costs nothing.
 */
router.use(authenticate_user, authorize_user_types(user_type.ADMIN));
router.use(create_company_route);
router.use(update_company_address_route);
router.use(update_company_route);

module.exports = router;
