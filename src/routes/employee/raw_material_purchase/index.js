const express = require("express");

const { user_type } = require("@enums");
const {
  authenticate_user,
  authorize_user_types,
} = require("@middlewares/authenticate_user");

const create_raw_material_purchase_route = require("@routes/employee/raw_material_purchase/create_raw_material_purchase_route");

const router = express.Router();

/**
 * Raw material purchases are an employee's to record.
 *
 * Every route under here is protected, so the two guards sit on the router
 * rather than on each route. A route added later is then guarded by being
 * mounted, instead of by somebody remembering two lines.
 *
 * An admin deliberately cannot reach this, and neither can a super admin. The
 * admin router keeps the material master -- what the yard is allowed to buy --
 * and recording what was actually bought is the day to day work of the people
 * handling it. The two are kept apart on purpose, so this is the one resource
 * where the admin is not a superset of the employee.
 *
 * A purchase is a resource of its own rather than something filed under a
 * material, so it is mounted at its own path instead of under a material's id.
 * One purchase names one material, but it is read and listed by supplier and by
 * date at least as often.
 *
 * Only create exists today. There is no list, no get, no update and no delete,
 * by design rather than by oversight: none has been asked for. Each needs a
 * decision this router has not taken -- a list needs the table's filter and sort
 * contract, and an update has to say which figures may still move once payments
 * have been recorded against the bill.
 */
router.use(authenticate_user, authorize_user_types(user_type.EMPLOYEE));
router.use(create_raw_material_purchase_route);

module.exports = router;
