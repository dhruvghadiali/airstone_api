const express = require("express");

const auth_router = require("@routes/employee/auth");
const raw_material_purchase_router = require("@routes/employee/raw_material_purchase");

const router = express.Router();

router.use("/auth", auth_router);
router.use("/raw-material-purchases", raw_material_purchase_router);

module.exports = router;
