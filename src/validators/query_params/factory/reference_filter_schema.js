/**
 * Lifts the schema half out of the filters whose value has to be resolved
 * against another collection before it means anything -- a product filtered by
 * its agency's *name* when the row stores the agency's id.
 *
 * Identical to a derived filter as far as the schema is concerned: the value is
 * typed here and the lookup sits beside it in the config. The two are kept
 * apart because they part company later -- a reference filter's lookup is
 * asynchronous, so the controller applies it after the synchronous query has
 * been built.
 *
 * @param   {Object} [config={}]                The resource's list config.
 * @param   {Object} [config.reference_filters] Parameter name to
 *   `{ schema, to_filter }`.
 * @returns {Object<string, import("joi").Schema>} Just the schemas, keyed by
 *   parameter name.
 */
const build_reference_filter_schemas = (config = {}) =>
  Object.fromEntries(
    Object.entries(config.reference_filters || {}).map(
      ([field, { schema }]) => [field, schema],
    ),
  );

module.exports = { build_reference_filter_schemas };
