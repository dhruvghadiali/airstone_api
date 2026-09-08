/**
 * Builds the pagination block every list response ends with.
 *
 * `total` counts the rows the filter matched rather than the rows on this page,
 * so the frontend can draw the pager without asking a second time.
 *
 * @param   {number} page   The page that was read.
 * @param   {number} limit  Rows per page.
 * @param   {number} total  Rows the filter matched in all.
 * @returns {{page: number, limit: number, total: number, total_pages: number}}
 */
const build_pagination = (page, limit, total) => ({
  page,
  limit,
  total,
  total_pages: Math.ceil(total / limit),
});

module.exports = { build_pagination };
