/**
 * The list of utils. Import a util, not this file.
 *
 * A util is pure logic: no database, no `req`, no `res`. That is the whole test
 * -- a util may still read this project's constants and build its errors, as
 * `reference_error` does. What it may not do is query or touch a request.
 * Anything that does either is a helper, under `src/helpers/<feature>/`.
 *
 * A util with more than one exported function, or with shared internals, gets a
 * folder holding `index.js` and one file per function. A single standalone
 * function stays a flat file.
 *
 *   projection/       narrowing a document to the columns a response declares
 *   financial_year/   which Indian financial year a moment falls in
 *   reference_error   the 400 for a body reference that points nowhere
 *
 * Importing `@utils` and destructuring would load every util -- moment and
 * lodash included -- on every request, so callers name the one they want:
 * `require("@utils/projection")`. This file exists so a reader can see them all
 * in one place, and so a new one is registered somewhere rather than only
 * discovered by searching.
 */
const projection = require("@utils/projection");
const financial_year = require("@utils/financial_year");
const { reference_error } = require("@utils/reference_error");

module.exports = { projection, financial_year, reference_error };
