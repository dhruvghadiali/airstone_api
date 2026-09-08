/**
 * Escapes the characters that mean something to a regular expression.
 *
 * A caller searching for "c.g." means those three characters, not "any
 * character, g, any character". Escaping first is also what stops a pasted value
 * from becoming a pattern that takes the server a long time to run.
 *
 * @param   {*} value  The raw term a caller typed.
 * @returns {string} The same text, safe to put inside a pattern.
 */
const escape_regex = (value) =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * The case insensitive "contains" match every text search in a list query is
 * built from.
 *
 * The search box and the per column filters both use it, so a term behaves the
 * same whichever box it was typed into.
 *
 * Matching is unanchored, which no index can serve. That is affordable at the
 * row counts this API carries today, and it is the first thing to revisit if a
 * list ever slows down -- either a text index behind `$text`, or an anchored
 * prefix match a btree can answer.
 *
 * @param   {*} value  The term to look for.
 * @returns {RegExp} A case insensitive "contains" pattern.
 */
const contains = (value) => new RegExp(escape_regex(value), "i");

module.exports = { contains };
