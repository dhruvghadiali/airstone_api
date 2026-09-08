/**
 * Values the sorting utils share.
 */

/**
 * How text columns are compared when sorting.
 *
 * Mongo compares strings byte by byte, so "Bob" sorts before "alice". English
 * collation at strength 2 is what makes an alphabetical column read the way a
 * person expects.
 *
 * Exported rather than kept private because an aggregation that orders by a
 * human readable name needs the same collation a sorted `find()` uses, and two
 * definitions would drift.
 *
 * @type {Readonly<{locale: string, strength: number}>}
 */
const TEXT_COLLATION = Object.freeze({ locale: "en", strength: 2 });

module.exports = { TEXT_COLLATION };
