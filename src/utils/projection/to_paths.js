/**
 * Reads a mongoose select string into the plain list of column paths it names.
 *
 * Folder-private: used by both projection utils, and not re-exported by
 * `src/utils/projection/index.js`, because a caller has no reason to turn a
 * select string into a list on its own.
 *
 * Two prefixes are dropped on the way through, for different reasons.
 *
 * `+field` is mongoose's "include this even though the schema hides it", which
 * is a request to the query planner. A document already in memory either has
 * the field or does not, so the prefix carries no meaning here and only the
 * name is kept.
 *
 * `-field` is an exclusion, and an exclusion cannot be honoured by an allowlist
 * pick. The response configs are inclusion-only by rule, so a stray one is
 * dropped rather than silently inverting the shape into "everything but this".
 *
 * @param   {string} select  A mongoose select string, or null/undefined.
 * @returns {string[]} The column paths it names. Empty when nothing was given,
 *                     which callers read as "no opinion", not "return nothing".
 */
const to_paths = (select) =>
  String(select ?? "")
    .split(/\s+/)
    .filter(Boolean)
    .map((path) => (path.startsWith("+") ? path.slice(1) : path))
    .filter((path) => !path.startsWith("-"));

module.exports = { to_paths };
