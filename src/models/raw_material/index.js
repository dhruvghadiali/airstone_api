/**
 * The raw material model, behind one import: `require("@models/raw_material")`.
 *
 * One model for now. Raw material purchases and stock will be added here as
 * their own collections, so this folder is where they will sit.
 *
 * Other folders import from this file. Files inside `src/models/raw_material`
 * import each other directly, never through it.
 */
const raw_material_model = require("@models/raw_material/raw_material_model");

module.exports = { raw_material_model };
