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

Unknown browser routes receive a responsive HTML 404 page. Unknown `/api/*`
routes receive a JSON 404 response.

Moment and Lodash are installed and ready for use in helpers and controllers.
