/**
 * Lifts the schema half out of the filters that are not a column comparison --
 * stock's "in stock" is `exit_date: null` rather than a value anyone types.
 *
 * The parameter still needs a type before it reaches the controller, so the
 * config carries a schema alongside the conditions the value maps onto. This
 * takes the schema; the query builder reads `to_filter` from the same entry,
 * which is what stops the two drifting apart.
 *
 * @param   {Object} [config={}]              The resource's list config.
 * @param   {Object} [config.derived_filters] Parameter name to
 *   `{ schema, to_filter }`.
 * @returns {Object<string, import("joi").Schema>} Just the schemas, keyed by
 *   parameter name.
 */
const build_derived_filter_schemas = (config = {}) =>
  Object.fromEntries(
    Object.entries(config.derived_filters || {}).map(([field, { schema }]) => [
      field,
      schema,
    ]),
  );

module.exports = { build_derived_filter_schemas };
