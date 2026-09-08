const _ = require("lodash");

const { ALWAYS_INCLUDED } = require("@utils/constants");
const { to_paths } = require("@utils/projection/to_paths");

/**
 * Narrows a document the process is already holding down to the columns a
 * response config names.
 *
 * Read actions push their projection into the query, so the database never
 * sends the extra columns at all. A create or an update cannot: the document
 * was just written and is in memory, and mongoose has no projection to apply to
 * a document it did not fetch. Re-reading the row purely to reshape it would be
 * a round trip to reformat data already in hand, so it is projected here.
 *
 * Pure -- no database, no `req`, no `res` -- which is what makes it a util
 * rather than a helper.
 *
 * @param   {Object|Object[]|null} document  A mongoose document, a plain
 *                                           object, an array of either, or a
 *                                           falsy value.
 * @param   {string} select  The `select` from the feature's response config.
 * @returns {Object|Object[]|null} The same shape that was passed in, narrowed.
 *                                 A falsy `document` is returned unchanged so a
 *                                 caller can project a "not found" result
 *                                 without checking first. An empty `select`
 *                                 returns the whole document.
 */
const project = (document, select) => {
  if (!document) {
    return document;
  }

  if (Array.isArray(document)) {
    return document.map((entry) => project(entry, select));
  }

  // `toJSON` runs the model's own transforms -- the one that strips `password`
  // off a user, and the virtuals some models serialise with -- so the pick
  // happens over what a client would have been sent, not over the raw document.
  const json =
    typeof document.toJSON === "function" ? document.toJSON() : document;

  const paths = to_paths(select);

  // A feature that has not narrowed its response gets the whole document. An
  // empty select is "no opinion", not "return nothing".
  if (!paths.length) {
    return json;
  }

  // `_.pick` rather than a hand-rolled loop because it understands dotted
  // paths, so a config can name a nested column without special handling.
  return _.pick(json, [...ALWAYS_INCLUDED, ...paths]);
};

module.exports = { project };
