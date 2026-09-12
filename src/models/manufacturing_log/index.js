/**
 * The manufacturing log model, behind one import:
 * `require("@models/manufacturing_log")`.
 *
 * `manufacturing_log_model` is one batch of one manufacturing product: when it
 * started, when it ended, what it made, what it damaged and what it consumed.
 *
 * The raw material sub-schema is not exported. It has no collection of its own,
 * and only the model that embeds it imports it.
 *
 * A finished goods movement ledger is still to be built. It is what will answer
 * how much sellable stock the plant holds; a log only records what one batch
 * produced.
 *
 * Other folders import from this file. Files inside `src/models/manufacturing_log`
 * import each other directly, never through it.
 */
const manufacturing_log_model = require("@models/manufacturing_log/manufacturing_log_model");

module.exports = { manufacturing_log_model };
