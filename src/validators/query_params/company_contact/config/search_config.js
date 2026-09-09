/**
 * What the single search box above the contact table spans.
 *
 * Declared in full rather than left to fall back to `text_filters`, so the list
 * below is a decision a reader can see rather than an omission. It differs from
 * `text_filters` by one column: `position` is searchable but filtered exactly.
 * The box guesses, so typing "purch" should still find the purchase desks; the
 * filter is a chosen value and is compared as one.
 *
 * `phone_number` is in it, which is the opposite of the usual advice about
 * identifiers. A contact table is exactly where someone pastes a number to find
 * out who called.
 *
 * Nothing on the company or the address is searched. A firm's name typed into
 * this box finds nothing, even though the firm is returned with every row --
 * reaching it means a lookup in another collection per term, and the company
 * list already answers that question with its contacts nested.
 *
 * One term is tried against everything listed here at once, so the box widens
 * where a column filter narrows.
 */
const company_contact_search_config = Object.freeze({
  search_fields: Object.freeze(["name", "phone_number", "position"]),
});

module.exports = { company_contact_search_config };
