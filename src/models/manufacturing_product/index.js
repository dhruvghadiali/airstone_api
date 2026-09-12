/**
 * The manufacturing product model, behind one import:
 * `require("@models/manufacturing_product")`.
 *
 * `manufacturing_product_model` is the master: what a product is, how it is
 * measured, what it is made of, and what it costs and sells for.
 *
 * The recipe sub-schema is not exported. It has no collection of its own, and
 * only the model that embeds it imports it.
 *
 * A stock ledger for finished products is still to be built. It is what will
 * answer how many units the plant holds.
 *
 * Other folders import from this file. Files inside
 * `src/models/manufacturing_product` import each other directly, never through
 * it.
 */
const manufacturing_product_model = require("@models/manufacturing_product/manufacturing_product_model");

module.exports = { manufacturing_product_model };
