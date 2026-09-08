/**
 * Works out the two query parameters that filter one date column.
 *
 * A column is filtered through a pair named after it without the `_at`, so
 * `created_at` is filtered by `created_from` and `created_to`. Deriving the
 * names rather than declaring them per resource is what keeps every table's date
 * filter spelled the same way.
 *
 * @param   {string} field  The date column, for example `"created_at"`.
 * @returns {{from: string, to: string}} The two parameter names.
 */
const date_filter_params = (field) => {
  const prefix = field.replace(/_at$/, "");

  return { from: `${prefix}_from`, to: `${prefix}_to` };
};

module.exports = { date_filter_params };
