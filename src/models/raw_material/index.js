/**
 * The raw material models, behind one import: `require("@models/raw_material")`.
 *
 * `raw_material_model` is the master: what a material is and how it is counted.
 * `raw_material_purchase_model` is one order placed with a supplier for one
 * material. Stock movements will be added here as their own collection.
 *
 * The payment sub-schema is not exported. It has no collection of its own, and
 * the purchase model is the only file that embeds it.
 *
 * Other folders import from this file. Files inside `src/models/raw_material`
 * import each other directly, never through it.
 */
const raw_material_model = require("@models/raw_material/raw_material_model");
const raw_material_purchase_model = require("@models/raw_material/raw_material_purchase_model");

module.exports = { raw_material_model, raw_material_purchase_model };
