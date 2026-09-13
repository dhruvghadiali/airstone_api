const express = require("express");

const { user_type } = require("@enums");
const {
  authenticate_user,
  authorize_user_types,
} = require("@middlewares/authenticate_user");

const create_raw_material_route = require("@routes/admin/raw_material/create_raw_material_route");
const update_raw_material_route = require("@routes/admin/raw_material/update_raw_material_route");

const router = express.Router();

/**
 * Raw materials are an admin's to manage.
 *
 * Every route under here is protected, so the two guards sit on the router
 * rather than on each route. A route added later is then guarded by being
 * mounted, instead of by somebody remembering two lines.
 *
 * A super admin deliberately cannot reach this. Keeping the material list is
 * day to day work, and the super admin router is for the things only it can do.
 *
 * Create and update exist. There is no list, no get and no delete yet, by
 * design rather than by oversight: none has been asked for. Each needs a
 * decision this router has not taken -- a list needs the table's filter and
 * sort contract, and a delete needs an answer for the purchases, the stock
 * entries and the recipes that point at the material.
 */
router.use(authenticate_user, authorize_user_types(user_type.ADMIN));
router.use(create_raw_material_route);
router.use(update_raw_material_route);

module.exports = router;
