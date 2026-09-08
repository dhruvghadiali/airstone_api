/**
 * Passes through the fixed value sets -- enums and booleans -- that are matched
 * exactly rather than by substring.
 *
 * These arrive already typed: the resource declares the Joi schema next to the
 * column name, because only the resource knows which values are valid, and its
 * schema is what produces the message a caller sees. Nothing is inferred here,
 * which is why this is a pass through rather than a builder.
 *
 * It is still a named seam rather than an inline spread, so the day exact
 * filters need shared treatment -- a default, a coercion, a label -- there is
 * one place to add it.
 *
 * @param   {Object} [config={}]            The resource's list config.
 * @param   {Object} [config.exact_filters] Column name to Joi schema.
 * @returns {Object<string, import("joi").Schema>} The same entries, copied so
 *   the caller cannot mutate the config.
 */
const build_exact_filter_schemas = (config = {}) => ({
  ...(config.exact_filters || {}),
});

module.exports = { build_exact_filter_schemas };
