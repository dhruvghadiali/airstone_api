/**
 * The list of helper features. Import a feature, not this file.
 *
 * A helper is imported as `@helpers/<feature>` -- `@helpers/auth`,
 * `@helpers/common`, `@helpers/list_query`. This file exists so a reader can see
 * every feature in one place, and so a new one is registered somewhere rather
 * than only discovered by searching.
 *
 *   auth        signin, tokens, employee ids, user write conflicts
 *   common      the response envelope, response shapes, retrying, money maths
 *   company     the reference checks a company, address or contact write runs
 *   list_query  turning a query string into filter, sort, options and window
 *   user        the columns an admin or employee row answers with
 *
 * Importing `@helpers` and destructuring a feature off it would load all five
 * on every request, so callers name the feature they want.
 */
const user = require("@helpers/user");
const auth = require("@helpers/auth");
const common = require("@helpers/common");
const company = require("@helpers/company");
const list_query = require("@helpers/list_query");

module.exports = { user, auth, common, company, list_query };
