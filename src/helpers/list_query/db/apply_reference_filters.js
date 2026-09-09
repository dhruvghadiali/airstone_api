/**
 * Applies the list clauses that need a lookup in another collection first, and
 * returns the filter to query with.
 *
 * Lives in `db/` because it awaits lookups that read the database, even though
 * it holds no query of its own -- the config supplies those. Kept out of
 * `build_list_query` so that stays synchronous for the endpoints that need
 * nothing of the sort: a controller with reference filters awaits this on the
 * filter it was handed, one without never calls it.
 *
 * Two config keys land here, and they differ in how they combine rather than in
 * what they read. `reference_filters` are per column and narrow: each is its own
 * condition, and all of them have to hold. `reference_search` is the single box
 * and widens: each entry adds one branch to the search `$or`, so one term typed
 * once can match a supplier's name or a product's.
 *
 * The narrowing conditions go into `$and` rather than being assigned onto the
 * filter. Assignment looks equivalent and is not: a lookup answers with the ids
 * it found, so two of them both produce `{ _id: { $in: [...] } }` and the second
 * silently replaces the first. Filtering by PIN code and by contact name would
 * quietly apply only one of the two. `$and` keeps every condition, whatever key
 * each one happens to use.
 *
 * An existing `$and` on the filter is extended rather than replaced, so a
 * resource that grows another source of `$and` clauses does not lose these.
 *
 * Every lookup runs together rather than one after another, since they are
 * independent. Running them in turn would cost a round trip each before the list
 * query has even started.
 *
 * @param   {Object} filter       The filter `build_filter` produced.
 * @param   {Object} [query={}]   The validated query string.
 * @param   {Object} [config={}]  The resource's list config.
 * @returns {Promise<Object>} The filter with the looked up clauses merged in --
 *                            the narrowing ones under `$and`, the widening ones
 *                            appended to `$or`. The original is left untouched.
 */
const apply_reference_filters = async (filter, query = {}, config = {}) => {
  const entries = Object.entries(config.reference_filters || {}).filter(
    ([field]) => query[field] !== undefined,
  );

  const searched = query.search
    ? Object.values(config.reference_search || {})
    : [];

  if (!entries.length && !searched.length) {
    return filter;
  }

  const [conditions, branches] = await Promise.all([
    Promise.all(
      entries.map(([field, { to_filter }]) => to_filter(query[field])),
    ),
    Promise.all(searched.map((to_branch) => to_branch(query.search))),
  ]);

  const applied = { ...filter };

  if (conditions.length) {
    applied.$and = [...(applied.$and || []), ...conditions];
  }

  if (!branches.length) {
    return applied;
  }

  // Appended to the `$or` `build_search_filter` already put there rather than
  // replacing it, so the box spans the resource's own columns and the joined
  // ones together. A resource with nothing in `search_fields` has no `$or` yet
  // and gets one made of these branches alone.
  applied.$or = [...(applied.$or || []), ...branches];

  return applied;
};

module.exports = { apply_reference_filters };
