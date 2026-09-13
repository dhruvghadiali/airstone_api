const express = require("express");

const { user_type } = require("@enums");
const {
  authenticate_user,
  authorize_user_types,
} = require("@middlewares/authenticate_user");

const list_raw_materials_route = require("@routes/admin/raw_material/list_raw_materials_route");
const create_raw_material_route = require("@routes/admin/raw_material/create_raw_material_route");
const update_raw_material_route = require("@routes/admin/raw_material/update_raw_material_route");
const delete_raw_material_route = require("@routes/admin/raw_material/delete_raw_material_route");
const restore_raw_material_route = require("@routes/admin/raw_material/restore_raw_material_route");

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
 * List, create, update, delete and restore exist. There is no get yet, by
 * design rather than by oversight: nobody has asked for one, and the list
 * answers with the same columns a single material would.
 *
 * Restore is mounted before the two routes that end in `/:id`. Express matches
 * one path segment per placeholder, so `/:id` would not swallow `/:id/restore`
 * today, but mounting the longer path first is what keeps that true when a
 * wildcard or an optional segment is added later.
 *
 * The delete deactivates the material and nothing else. It does not touch the
 * purchases and stock entries that name it, and `delete_raw_material` says why.
 * Restore is its mirror, so there is nothing to bring back with the material.
 * The list shows live materials unless `?is_active=false` is asked for, which
 * is how a caller finds a deactivated one to restore.
 */
router.use(authenticate_user, authorize_user_types(user_type.ADMIN));
router.use(list_raw_materials_route);
router.use(create_raw_material_route);
router.use(restore_raw_material_route);
router.use(update_raw_material_route);
router.use(delete_raw_material_route);

module.exports = router;
