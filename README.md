# AIRSTONE API

Express.js API backed by MongoDB through Mongoose.

## Setup

1. Copy `.env.example` to `.env` and provide the MongoDB connection string.
   Set `JWT_SECRET` to a long, random value. `JWT_EXPIRES_IN` defaults to `1d`.
2. Install packages with `npm install`.
3. Run the development server with `npm run dev`.

The server defaults to `http://localhost:3000`.

## Production build

Create the production server bundle and copy its public assets:

```bash
npm run build
npm start
```

The build output is written to `dist/` and targets Node.js 20 or newer.

## Module aliases

Internal modules use aliases instead of relative paths:

- `@src`
- `@config`
- `@controllers`
- `@enums`
- `@helpers`
- `@middlewares`
- `@models`
- `@routes`
- `@scripts`
- `@utils`
- `@validators`

Aliases are registered automatically by the start, development, and test
scripts.

## Roles

Three user types exist, each with its own router. A token issued at one role's
signin opens only that role's routes.

| Role          | `user_type`   | Router base      |
| ------------- | ------------- | ---------------- |
| Super admin   | `super_admin` | `/super-admin`   |
| Admin         | `admin`       | `/admin`         |
| Employee      | `employee`    | `/employee`      |

## Routes

### Auth

- `POST /super-admin/auth/signup` — create the one super admin account;
  refused once it exists. Public
- `POST /super-admin/auth/admin/signup` — create an admin. Super admin only
- `POST /admin/auth/employee/signup` — create an employee. Admin only
- `POST /super-admin/auth/signin`
- `POST /admin/auth/signin`
- `POST /employee/auth/signin`

A signup sits under the router of whoever calls it, and names the role it
creates in the path. The super admin signup is the exception, since nobody
calls it.

The super admin signup accepts `first_name`, `last_name`, `email`,
`phone_number`, `username` and `password`. The admin and employee signups accept
the same list without `password`; those accounts start on
`DEFAULT_USER_PASSWORD` in `@validators/constants`, and the creator passes it
on. `emp_id` and `user_type` are always set by the server and are rejected if
sent. Signin accepts `username` and `password` only.

Send the returned JWT with every authenticated request as
`Authorization: Bearer <token>`. `authenticate_user` reads the token and
`authorize_user_types(...)` narrows a route to specific roles.

### Companies

- `GET /admin/companies` — list companies, paged. Admin only
- `POST /admin/companies` — create a company with its addresses and their
  contacts. Admin only
- `PATCH /admin/companies/:id` — change a company's own details. Admin only
- `PATCH /admin/companies/addresses/:id` — change one address. Admin only
- `PATCH /admin/companies/contacts/:id` — change one contact. Admin only
- `DELETE /admin/companies/:id` — deactivate a company and everything under it.
  Admin only
- `DELETE /admin/companies/addresses/:id` — deactivate one address and its
  contacts. Admin only
- `DELETE /admin/companies/contacts/:id` — deactivate one contact. Admin only

The body accepts `company_name`, `company_type`, `email`, `phone_number`,
`gst_number`, `pan_number` and `address`. `company_type` is one of `supplier`,
`customer` or `both`.

`address` is a list and needs at least one entry. Each entry accepts `address`,
`pincode` and `contact_person`. `contact_person` is a list and needs at least
one entry; each contact accepts `name`, `phone_number` and `position`.
`position` is one of `owner`, `manager`, `accounts`, `purchase`, `sales` or
`other`.

Each row carries the company's active addresses under `addresses`, and each
address's active contacts under `contacts`.

The list accepts `page`, `limit`, `search`, `sort` (or `sort_by` +
`sort_order`), the column filters `company_name`, `email`, `phone_number`,
`gst_number` and `pan_number`, the exact filters `company_type` and `is_active`,
and the date range `created_from` / `created_to`. Anything else is a 400 — the
contract is `src/validators/query_params/company/`.

`search`, the filters and the sort all work on the company's own columns only.
The addresses and contacts are a projection, not part of the query: they are
returned with every row, but `?pincode=411001` and `?sort=contact_name:asc` are
both 400s. Reaching a child column would mean resolving it to a set of company
ids before the list query could run, and that has not been asked for.

`is_active` defaults to true, so deactivated companies need `?is_active=false`.
Each row carries all of that company's active addresses and contacts.

`is_active`, `created_by` and `updated_by` are set by the server and are
rejected if sent. The three collections are written in one transaction, so the
endpoint needs MongoDB running as a replica set. The reply mirrors the request
with the new ids in place.

The company update body accepts the same six company fields, all optional, and
needs at least one of them. It does not accept `address`. The reply is the
company alone.

The address update body accepts `address` and `pincode`, both optional, and
needs at least one of them. It does not accept `company`: an address cannot be
moved to another company, because the contacts filed under it would then name a
company that no longer owns the place they work at. It does not accept
`contact_person` either — a contact is a row with an id of its own. The reply is
the address alone.

The contact update body accepts `name`, `phone_number` and `position`, all
optional, and needs at least one of them. It does not accept `company` or
`company_address`: a contact cannot be moved to another branch, because an
address already knows its company and accepting one id without the other would
leave the pair disagreeing. The reply is the contact alone.

Each update endpoint changes one collection and its own columns only. None of
them accepts the ids that tie the three together, so an update can never move a
row to a new parent and leave its children pointing at the old one.

Every delete is a soft delete: it sets `is_active` to false rather than removing
rows, takes no body, and cascades downwards only.

Deleting a company deactivates the company, every one of its addresses and every
one of its contacts. Deleting one address deactivates that address and the
contacts at it, and leaves the company alone — closing a branch says nothing
about whether the firm is still traded with. Deleting one contact deactivates
that contact and nothing else. The two cascading deletes are each one
transaction; the contact delete is a single write.

A row that is already deactivated answers 404, so a repeat call cannot overwrite
the `updated_by` of the deletion that came first. Deleting a company's last
address is allowed, even though create requires at least one.

Nothing reverses a delete. There is no restore route, and no update endpoint
accepts `is_active`, so bringing a row back is a database job today.

## Migrations

Backfills are declared in `scripts/generator/backfill_config.js` and turned into
migration files:

```bash
npm run migrate:generate
npm run migrate
npm run migrate:rollback
```

## Conventions

`.claude/skills` holds the project's conventions, so every feature comes out the
same shape regardless of who wrote it.

**Start with `project-structure`** — where each kind of file lives, how folders
and files are named and imported, and the one JSDoc comment pattern every layer
follows. It routes to the skill that owns the layer you are touching:

| Skill | Covers |
| --- | --- |
| `project-structure` | the map, the file and folder rules, the comment pattern |
| `controller-structure` | controller layout, error and response contract |
| `controller-comments` | the JSDoc header on a controller |
| `helper-structure` | `src/helpers` — `index.js`, `constants/`, `db/`, `utils/` |
| `helper-comments` | the JSDoc header on a helper |
| `model-structure` | schemas, limits, ref lookups |
| `model-comments` | the block above a schema, keyed by field name |
| `enum-structure` | `src/enums` — creating, extending, renaming, removing |
| `enum-comments` | what an enum block records, and when none is needed |
| `route-structure` | routers, route files, middleware order |
| `route-comments` | who may reach a resource, and what is not mounted |
| `utils-structure` | `src/utils` — purity test, folder vs flat file, comments |
| `validators-structure` | the validators tree, `constants/`, `messages/` |
| `request-body-structure` | Joi body validators |
| `route-params-structure` | Joi route param validators |
| `query-params` | list endpoint query strings |
| `mongoose-migrations` | data migrations under `scripts/` |
| `comment-placement` | where a comment may sit, in any file |
| `plain-english` | the wording of every comment and document |

Unknown browser routes receive a responsive HTML 404 page. Unknown `/api/*`
routes receive a JSON 404 response.

Moment and Lodash are installed and ready for use in helpers and controllers.
