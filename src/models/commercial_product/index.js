/**
 * The commercial product model, behind one import:
 * `require("@models/commercial_product")`.
 *
 * `commercial_product_model` is the sellable item: what the bundle holds, who
 * it is offered to, and what it costs and sells for.
 *
 * The bundle line sub-schema is not exported. It has no collection of its own,
 * and only the model that embeds it imports it.
 *
 * A finished goods ledger is still to be built. It is what will answer how many
 * units are on hand.
 *
 * Other folders import from this file. Files inside
 * `src/models/commercial_product` import each other directly, never through it.
 */
const commercial_product_model = require("@models/commercial_product/commercial_product_model");

module.exports = { commercial_product_model };
