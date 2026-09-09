const express = require("express");

const { user_type } = require("@enums");
const {
  authenticate_user,
  authorize_user_types,
} = require("@middlewares/authenticate_user");

const list_companies_route = require("@routes/admin/company/list_companies_route");
const create_company_route = require("@routes/admin/company/create_company_route");
const delete_company_route = require("@routes/admin/company/delete_company_route");
const delete_company_contact_route = require("@routes/admin/company/delete_company_contact_route");
const delete_company_address_route = require("@routes/admin/company/delete_company_address_route");
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
 * List, create, one update per collection, and delete exist today. There is no
 * get route for a single company yet, by design rather than by oversight: it has
 * not been asked for. The list answers with company columns only, so the tree of
 * addresses and contacts has nowhere to be read from except the create reply.
 *
 * Every delete is a soft delete and each cascades downwards only. Deleting a
 * company deactivates its addresses and its contacts; deleting one address
 * deactivates that address and the contacts at it; deleting one contact
 * deactivates that contact and nothing else. Each stops where it does because a
 * closed branch says nothing about whether the firm is still traded with, and a
 * person leaving says nothing about either. No route reverses any of it.
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
router.use(list_companies_route);
router.use(create_company_route);
router.use(update_company_contact_route);
router.use(update_company_address_route);
router.use(update_company_route);
router.use(delete_company_contact_route);
router.use(delete_company_address_route);
router.use(delete_company_route);

module.exports = router;
