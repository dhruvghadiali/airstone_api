/**
 * The raw material models, behind one import: `require("@models/raw_material")`.
 *
 * `raw_material_model` is the master: what a material is and how it is counted.
 * `raw_material_purchase_model` is one order placed with a supplier.
 * `raw_material_stock_entry_model` is one consignment arriving on one vehicle
 * against those orders.
 *
 * The three sub-schemas are not exported. None has a collection of its own, and
 * only the model that embeds each one imports it.
 *
 * A movement ledger is still to be built. It is what will answer how much of a
 * material the yard holds; a stock entry only records what arrived.
 *
 * Other folders import from this file. Files inside `src/models/raw_material`
 * import each other directly, never through it.
 */
const raw_material_model = require("@models/raw_material/raw_material_model");
const raw_material_purchase_model = require("@models/raw_material/raw_material_purchase_model");
const raw_material_stock_entry_model = require("@models/raw_material/raw_material_stock_entry_model");

module.exports = {
  raw_material_model,
  raw_material_purchase_model,
  raw_material_stock_entry_model,
};
