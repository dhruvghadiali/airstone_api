const express = require("express");

const { user_type } = require("@enums");
const {
  authenticate_user,
  authorize_user_types,
} = require("@middlewares/authenticate_user");

const create_company_route = require("@routes/admin/company/create_company_route");
const delete_company_route = require("@routes/admin/company/delete_company_route");
const update_company_route = require("@routes/admin/company/update_company_route");
const update_company_contact_route = require("@routes/admin/company/update_company_contact_route");
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
 * Create, one update per collection, and delete exist today. There is no get or
 * list route yet, by design rather than by oversight: the endpoints have not
 * been asked for.
 *
 * Delete is a soft delete and it cascades: deactivating a company deactivates
 * its addresses and its contacts in the same transaction. There is no route that
 * reverses it.
 *
 * Each update touches one collection and edits that row's own columns only.
 * `PATCH /:id` changes the company, `PATCH /addresses/:id` changes one address,
 * `PATCH /contacts/:id` changes one contact. None of them accepts the ids that
 * tie the three together, so no update can move a row from one parent to
 * another and leave its children pointing at the old one.
 *
 * `/addresses/:id` and `/contacts/:id` are mounted before `/:id`. Express would
 * not confuse them -- `/:id` matches a single segment -- but mounting the more
 * specific paths first is the project's rule and costs nothing.
 */
router.use(authenticate_user, authorize_user_types(user_type.ADMIN));
router.use(create_company_route);
router.use(update_company_contact_route);
router.use(update_company_address_route);
router.use(update_company_route);
router.use(delete_company_route);

module.exports = router;
