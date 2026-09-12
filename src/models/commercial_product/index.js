/**
 * The commercial product models, behind one import:
 * `require("@models/commercial_product")`.
 *
 * `commercial_product_model` is the sellable item: what the bundle holds, who
 * it is offered to, and what it costs and sells for.
 *
 * `commercial_product_stock_model` is one tested quantity of one of those, and
 * the batches it came off. Two collections rather than a count on the product,
 * because stock arrives in bookings and each one has its own test, its own
 * batches and its own sale.
 *
 * The bundle line sub-schema is not exported. It has no collection of its own,
 * and only the model that embeds it imports it.
 *
 * A finished goods movement ledger is still to be built. A stock row records
 * what came in; nothing yet records what leaves.
 *
 * Other folders import from this file. Files inside
 * `src/models/commercial_product` import each other directly, never through it.
 */
const commercial_product_model = require("@models/commercial_product/commercial_product_model");
const commercial_product_stock_model = require("@models/commercial_product/commercial_product_stock_model");

module.exports = {
  commercial_product_model,
  commercial_product_stock_model,
};
