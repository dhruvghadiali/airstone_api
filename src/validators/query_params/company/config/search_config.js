/**
 * What the single search box above the company table spans.
 *
 * Declared in full rather than left to fall back to `text_filters`, so the list
 * below is a decision a reader can see rather than an omission.
 *
 * The identifier columns -- `email`, `phone_number`, `gst_number`,
 * `pan_number` -- are in it, which is the opposite of the usual advice. This
 * table exists to look a firm up, and the thing an admin has in front of them is
 * usually a number off an invoice rather than a name they can spell. A GST
 * number pasted into the box should find the company that owns it.
 *
 * `company_type` is here so typing "supp" lists every supplier. It is matched by
 * "contains" like the rest, unlike the `company_type` filter beside it, which is
 * exact. The two are not in conflict: the box guesses, the filter is precise.
 *
 * Nothing on an address or a contact is searched, so a PIN code or a contact's
 * name typed into the box finds nothing. Reaching them means a lookup in another
 * collection per term, and the box stays over the company's own columns until
 * that is asked for.
 *
 * One term is tried against everything listed here at once, so the box widens
 * where a column filter narrows.
 */
const company_search_config = Object.freeze({
  search_fields: Object.freeze([
    "company_name",
    "company_type",
    "email",
    "phone_number",
    "gst_number",
    "pan_number",
  ]),
});

module.exports = { company_search_config };
