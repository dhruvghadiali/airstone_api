# AIRSTONE API — Technical Requirements Document

**Version:** 1.0
**Status:** Base version — describes what is built today
**Last updated:** 2026-09-08
**Related document:** `docs/prd/v1/prd_v1.md`

---

## 1. About this document

The product document (the PRD) says **what** the API must do.
This document says **how** it does it.

It covers the tools we use, how the code is arranged, how data is stored, how
login and permissions work, what each address accepts and returns, and the rules
new code must follow.

It is written for developers, but in plain language. Terms are explained where
they first appear.

Scope: the three groups, the separate route sets, passes, the first-time signup,
and the three logins.

---

## 2. Tools we use

| What for | Tool | Version | Notes |
| -------- | ---- | ------- | ----- |
| Runtime | Node.js | 20 or newer | The build is made for version 20 |
| Module style | CommonJS | — | We use `require`, not `import` |
| Web framework | Express | 5.2 | Handles web requests |
| Database | MongoDB with Mongoose | 9.9 | One database, one connection |
| Password scrambling | bcryptjs | 3.0 | 12 rounds |
| Passes | jsonwebtoken | 9.0 | Signed with a shared secret |
| Checking input | Joi | 18.2 | One rule set per address |
| Safety headers | helmet | 8.3 | On every reply |
| Cross-site access | cors | 2.8 | Open to all right now — see 10.4 |
| Request logging | morgan | 1.11 | `dev` format |
| Settings | dotenv | 17.4 | Loaded once when the server starts |
| Dates and times | moment | 2.30 | Used for Indian time and the employee ID |
| Small helpers | lodash | 4.18 | |
| Short import names | module-alias | 2.3 | Set up by the start, dev, and test commands |
| Bundler | esbuild | 0.28 (dev only) | Builds the `dist/` folder |
| Auto-restart | nodemon | 3.1 (dev only) | Restarts while you code |
| Testing requests | supertest | 7.2 (dev only) | Used with the Node test runner |

---

## 3. How the code is arranged

### 3.1 What happens to a request

Every request goes through the same set of steps. Each step does one job and
passes the request on. No step reaches around another.

```
Request comes in
  → helmet            adds safety headers
  → cors              decides which websites may call us
  → body readers      reads JSON and form data
  → morgan            writes one log line
  → group router      /super-admin | /admin | /employee
    → auth router     /auth
      → authenticate_user           (protected addresses only)
                                    checks the pass, then sets
                                    req.user = { id, user_type }
      → authorize_user_types(...)   (protected addresses only)
                                    checks the group is allowed
      → validate_body/query/params  checks the input with Joi
      → async_handler(controller)   does the actual work
  → not_found_handler   nothing matched the address
  → error_handler       the one place every failure is turned into a reply
Reply goes out
```

The two guard steps sit on the individual route, not on the router above it.
Every auth router carries a mix: the admin router holds a public signin and a
guarded employee signup. A router-level guard would have locked the public ones
too. The cost is that each protected route has to name its own guards, so 5.7
lists the three places the rule is held.

A controller never sends an error itself. It throws the error, and
`error_handler` turns it into a status code. Keeping this in one place is what
makes every error reply look the same.

### 3.2 Folder rules

| Layer | Folder | Its job | What it must not do |
| ----- | ------ | ------- | ------------------- |
| Routes | `src/routes/<group>/` | Set the addresses and attach the steps | Hold any logic |
| Middlewares | `src/middlewares/` | Jobs that apply to many addresses | Know about one feature |
| Validators | `src/validators/` | Input shape, limits, patterns, wording | Touch the database |
| Controllers | `src/controllers/<feature>/` | Run one address end to end | Query the database directly |
| Helpers | `src/helpers/<feature>/` | Database work and plain logic | Reach inside another helper folder |
| Models | `src/models/<name>/` | The shape of stored data and its hooks | Hold address logic |
| Enums, utils | `src/enums/`, `src/utils/` | Shared fixed values and plain functions | Depend on Express |

**One door per helper folder.** Each helper folder (`auth`, `common`,
`list_query`) is split into `constants/`, `db/`, and `utils/`, and offers a
single `index.js`. Code outside imports only `@helpers/<name>`, never a path
inside it. This means a file can move between those three folders without
breaking anyone. A helper moves into `helpers/common` only after a second
feature needs it. Until then it stays with the feature that uses it.

**One folder per model.** Each model gets its own folder under `models/` with
its own `index.js`, so `require("@models/user")` returns `{ user_model }`. A
model that later grows companion files — sub-schemas, static queries, a seed —
then has somewhere to put them, instead of the top of `models/` filling up with
loose files as the system grows.

### 3.3 Short import names

We do not use relative paths like `../../models` between folders. Short names
are listed in `package.json` under `_moduleAliases`, and turned on by
`module-alias/register` in the start, dev, and test commands.

`@src` `@config` `@controllers` `@enums` `@helpers` `@middlewares` `@models`
`@routes` `@scripts` `@utils` `@validators`

### 3.4 Folder map

```
src/
  app.js               builds the Express app and its shared steps
  server.js            loads settings, connects the database, starts listening
  config/database.js   the database connection
  controllers/auth/    signing in, and all three signups
  enums/               user_type, http_status, manageable_user_types
  helpers/             auth/, common/, list_query/ — each split into
                       constants | db | utils
  middlewares/         app_error, async_handler, authenticate_user,
                       error_handler, not_found_handler, validate_request
  models/user/         the user model, behind its own index
  public/              images, styles, and the 404 page
  routes/              super_admin/, admin/, employee/ — each with auth/
  utils/               projection/, financial_year/, constants/
  validators/          constants/, messages/, request_body/,
                       query_params/, route_params/
scripts/
  build.js             builds dist/ with esbuild
  migrate.js  rollback.js  generator/  migrations/
docs/
  prd/v1/  trd/v1/
```

---

## 4. How data is stored

Version 1 has one collection: `users`.

### 4.1 The user record

| Field | Type | Rules | Index |
| ----- | ---- | ----- | ----- |
| `first_name` | Text | needed, spaces trimmed, 1–100 characters | — |
| `last_name` | Text | needed, spaces trimmed, 1–100 characters | — |
| `email` | Text | needed, trimmed, made lowercase, 5–254, must look like an email | unique |
| `phone_number` | Text | needed, trimmed, exactly 10 digits | unique |
| `emp_id` | Text | needed, trimmed, made uppercase, exactly 7 letters or digits | unique |
| `username` | Text | needed, trimmed, made lowercase, 3–50 characters | unique |
| `password` | Text | needed, 8–500 stored, hidden by default | — |
| `user_type` | Text | needed, one of the three groups, `employee` by default | yes |
| `is_active` | Yes/No | `true` by default | yes |
| `created_at`, `updated_at` | Date | set by the system | — |

Mongoose's version field is switched off. The date fields are named
`created_at` and `updated_at` to match the naming style used everywhere else.

### 4.2 What the user record does by itself

- **Scrambling the password.** Before saving, the record scrambles the password
  with bcrypt at 12 rounds. It only does this when the password is new or has
  changed. Without that check, a normal read-and-save would scramble an
  already scrambled password and lock the user out. This runs for the shared
  default password too, so that is never stored in plain text either.
- **Checking a password.** `compare_password(typed_password)` is a method on the
  record. If the record was loaded without the password, it returns `false`
  instead of crashing. So a developer who forgets to ask for the password field
  gets a failed login, not a broken server. Failing this way round is the safe
  one.
- **Hiding the password, twice.** `select: false` keeps it out of every read that
  does not ask for it by name. A second rule removes it again from anything sent
  out. We do not rely on either one alone.

### 4.3 Keeping values unique

MongoDB itself enforces that emails, phone numbers, usernames, and employee IDs
are unique. We do not check in code first and then save, because two requests
arriving at the same moment could both pass that check and both save.

When the database refuses a duplicate, it raises error code 11000.
`error_handler` turns that into a 409 reply naming the field.

### 4.4 Making the employee ID

Shape: `YYMMNNN` — two digits for the year, two for the month, three for a
running number. Example: `2609001` is the first account made in September 2026.

- The month is worked out in **Indian Standard Time**, not the server's own
  time zone.
- The running number goes back to `001` when the month or year changes.
- To get the next ID, the system reads the highest number used this month and
  adds one.
- Two accounts created at the same moment therefore work out the **same** ID.
  The database refuses the second one. When that happens, the system reads the
  number again and retries, up to 5 times.
- The retry only reacts to a clash on the employee ID. A clash on email, phone
  number, or username is the caller's own to fix, so it is reported at once and
  not retried.
- **The order matters.** The code that renames duplicate errors wraps the retry,
  never the other way round. If it ran first, it would rename the employee ID
  clash into something the retry no longer recognises, and the retry would never
  happen.
- After 999 accounts in one month, the system stops and says the numbers for
  this month are used up. It does not fail with a general error.

---

## 5. Login and permissions

### 5.1 The pass

- Signed with the HS256 method, using the `JWT_SECRET` setting.
- Lasts as long as `JWT_EXPIRES_IN` says. If that is not set, one day.
- Holds two things: `sub` (the user's ID) and `user_type` (their group).
- Sent by the app as `Authorization: Bearer <pass>`.

If `JWT_SECRET` is missing, the service must fail, not carry on. A missing key
shows up as a 500, never as a 401. Telling a user their password was wrong when
the real problem is a missing setting would send someone debugging in the wrong
direction for hours.

### 5.2 Reading the header

The `Authorization` value is trimmed, split on spaces, and checked as a whole.
`Bearer` with no pass, a pass with no `Bearer`, and `Bearer a b` are all
refused, rather than half read. The word `Bearer` is matched whether it is
upper or lower case, because the web standard treats it that way and some apps
send `bearer`.

Anything broken is treated as a **missing** pass. Someone who sent a broken
header has not proved anything either way.

### 5.3 `authenticate_user`

This checks the pass and sets `req.user = { id, user_type }`. Every controller
after it reads that object, and nothing else is allowed to write to it.

A pass with no user ID, or with a group this API does not have, is treated as
invalid rather than as our fault. It is a correctly signed pass that cannot
describe a real user. In practice it came from another system, or was made
before a group was renamed.

| What went wrong | Status | Message name |
| --------------- | :----: | ------------ |
| No usable pass sent | 401 | `AUTH_TOKEN_REQUIRED` |
| Pass has run out of time | 401 | `AUTH_TOKEN_EXPIRED` |
| Wrong signature, broken, or unusable contents | 401 | `INVALID_AUTH_TOKEN` |
| Anything else, such as a missing secret key | 500 | passed through as it is |

A pass that has run out is kept separate from a broken one on purpose. That user
did nothing wrong and only needs to log in again, which is worth saying. Neither
message gives away anything about the account.

### 5.4 `authorize_user_types(...groups)`

This builds a step that lets only the named groups through. Put it **after**
`authenticate_user`:

```js
router.use(authenticate_user);
router.use(authorize_user_types(user_type.SUPER_ADMIN));
```

- Always pass group names from the `user_type` list, never as plain text. Then
  renaming a group stays a change in one file.
- The group names are checked **when the app starts**, not when a request
  arrives. A spelling mistake stops the service from starting. Without this, a
  misspelled group would quietly lock everyone out of an address nobody tested.
- A missing `req.user` is refused with the same 403 as a wrong group. It means
  someone attached this step without `authenticate_user` in front of it, and
  refusing is the only safe way to read that.

### 5.5 A known trade-off: old information in a pass

Both the user ID and the group come from the pass, not from a fresh database
read. This saves one database call on every single request. The cost is that
changes made after the pass was given out are not seen until it runs out:

- A user switched off an hour ago still gets through.
- A group taken away from an account still opens that group's addresses.

So any action that must not run on an old account has to read the account again
first. `assert_caller_password` in `@helpers/auth` shows the pattern to copy.

### 5.6 Only one super admin

The system holds exactly one super admin (PRD FR-1.9).
`assert_no_super_admin_exists` in `@helpers/auth` enforces it, and the signup
controller calls it before anything else.

It runs first on purpose. A caller who is going to be turned away should not use
up an employee ID number on an account that will never be created.

**Switched-off super admins still count.** The check looks for the group, not
for an active account. If it only counted active ones, switching the super admin
off would reopen public signup, and anyone able to do that could then claim the
role for themselves.

This check also **closes the signup address**. That address has to be open,
because there is no account yet to approve the request. This rule makes it shut
by itself the moment the account exists, so it is open only until it is first
used. Before this rule, that address stayed open forever, and anyone who could
reach the service could make themselves a super admin.

**One known hole.** This is a read followed by a write, so two signups sent at
the very same moment could both get past it. The window is tiny and the address
is used once at install time, so we accept it for now. The unique indexes still
stop the two from sharing an email, phone number, or username; what they do not
stop is two *different* super admins being made together. Closing this properly
needs a unique index on `user_type` that applies only to super admins, which
means a data migration. That is left for v2.

### 5.7 Who may create whom

Each group creates the group below it.

| Creator | Address | Creates | Cannot create |
| ------- | ------- | ------- | ------------- |
| Nobody (install time) | `POST /super-admin/auth/signup` | The one super admin | — |
| Super admin | `POST /super-admin/auth/admin/signup` | Admins | A second super admin, or employees |
| Admin | `POST /admin/auth/employee/signup` | Employees | Another admin, or a super admin |
| Employee | — | Nobody | — |

A super admin is **not** allowed to create employees, even though they outrank
an admin. If both could, the chain would be a suggestion rather than a rule, and
there would be two paths to the same account with only one of them tested.

The rule is held in three separate places, and all three have to agree before an
account is created:

1. **The route** decides who may call, with `authenticate_user` then
   `authorize_user_types(...)` in its own handler chain. These sit on the route
   rather than on the router above it, because the signin and signup routes next
   door on that same router have to stay public.
2. **The controller** fixes the new account's group. `admin_signup` passes
   `user_type.ADMIN` and `employee_signup` passes `user_type.EMPLOYEE`. Neither
   reads the group from the request.
3. **The rule set** refuses a `user_type` field outright, because both signup
   schemas say `.unknown(false)`.

Points 2 and 3 meet in the middle on purpose. Without the second, an admin could
send `user_type: "admin"` and create a colleague at their own level. Without the
third, that attempt would be silently ignored rather than refused, and the
caller would never learn their request was not doing what they thought.

`manageable_user_types` lists admin and employee and leaves super admin out. It
is there for the edit and switch-off addresses still to be built, so none of
them can ever reach a super admin.

#### The starting password

Every account made this way starts on `DEFAULT_USER_PASSWORD`, a single fixed
value in `@validators/constants`. The creator passes it to the new user
themselves. The reply does not repeat it, because it is the same for everyone
and is not a secret this endpoint is keeping.

It is written in the source, so treat it as public knowledge. It is a starting
point for a new account, not protection for it. Two things follow, and neither
is built yet:

- a new user must be made to change it the first time they sign in;
- until that exists, every account that has not changed it can be opened by
  anyone who knows the value.

It is hashed by the model before saving, exactly like a typed password, so it is
never stored in plain text.

#### Creating the account

`create_managed_user(details, group)` in `@helpers/auth` does the write. It
repeats the signup's employee ID handling for the same reasons (4.4): the ID
clash is retried because the server caused it, while a clashing email, phone
number, or username is returned because the caller did.

### 5.8 Logging in

`authenticate_by_user_type(details, group)` runs **one** database search that
matches all three of: the username, the fixed group, and `is_active: true`. It
asks for the password field by name, because the record hides it by default.

The group is a fixed value inside each controller. It is never read from the
request body. This is what stops an employee from logging in at the admin
address.

A username that does not exist, a wrong password, a wrong group, and a
switched-off account all give the same 401 `INVALID_CREDENTIALS`. If we told
them apart, anyone could use the login page to find out which usernames exist.

The reply is built by `build_signin_payload(user)`, which uses the shared
`auth_response` field list and adds the pass. That list is `_id`, `first_name`,
`last_name`, `email`, `phone_number`, `username`, `user_type`, `created_at`.

Two small points about that list:

- `_id` is written out even though MongoDB always returns it. The same list is
  used twice: once to tell the database what to fetch, and once to decide what
  the reply carries. Leaving `_id` out would put it in the record but drop it
  from the reply.
- `is_active` and `updated_at` are left out on purpose. Someone who has just
  logged in already knows their account is on, and has no edit screen that needs
  a version.

---

## 6. What each address accepts and returns

Base address in development: `http://localhost:3000`

### 6.1 The addresses

| Method | Address | Pass needed | What it does |
| ------ | ------- | ----------- | ------------ |
| POST | `/super-admin/auth/signup` | No | Creates the one super admin. Refuses once it exists |
| POST | `/super-admin/auth/signin` | No | Logs a super admin in |
| POST | `/admin/auth/signin` | No | Logs an admin in |
| POST | `/employee/auth/signin` | No | Logs an employee in |
| POST | `/super-admin/auth/admin/signup` | Super admin | Creates an admin |
| POST | `/admin/auth/employee/signup` | Admin | Creates an employee |
| GET | `/assets/*` | No | Images and styles |

**Signup takes:** `first_name`, `last_name`, `email`, `phone_number`,
`username`, `password`. `emp_id` and `user_type` are set by the server, and the
request is **refused** if they are sent, because the rules reject any field they
do not know.

**Login takes:** `username` and `password` only.

**Both other signups take:** `first_name`, `last_name`, `email`,
`phone_number`, `username`. No password, no `user_type`, no `emp_id` — the
server sets all three. Sending any of them is a 400. They return **201** with
the new account, including the generated `emp_id`.

Signup addresses are laid out by **who calls them**, with the created group
named in the path: a super admin works under `/super-admin/auth/`, so the
address they use to make an admin is `/super-admin/auth/admin/signup`. An admin
works under `/admin/auth/`, so `/admin/auth/employee/signup` makes an employee.

`/super-admin/auth/signup` is the exception, and it has to be: it is the one
signup with no caller to file it under.

Signup returns **201** with the account and **no pass**. Creating an account is
not logging in. Login returns **200** with the account plus `token`.

Signup works **once**. Every call after the super admin exists returns **409**
with `SUPER_ADMIN_ALREADY_EXISTS`. See 5.6.

### 6.2 The shape of every reply

Every reply, good or bad, has the same three keys:

```json
{
  "status": 200,
  "data": { "_id": "...", "username": "amit", "user_type": "admin" },
  "message": "Admin signed in successfully"
}
```

- `data` is **always an object**. Never a list, never a plain value, never
  missing. An app can read `data.username` without first checking what it got.
- When there is nothing to send — a service check, or a 500 — `data` is `{}`.
  "Nothing to send" and "an empty payload" mean the same thing to whoever is
  reading, and keeping them apart would only give apps a check they can forget.
- `status` appears twice, once as the HTTP status and once inside the body. This
  is on purpose. Anything that reads only the body — a log file, a stored
  webhook, a saved test file — still needs to know how the call went.

#### Lists of records

A list is never the `data` value itself. It sits inside `data` under a name.
That way a single record and a list are told apart by name, not by shape, and
page information has somewhere to sit:

```json
{
  "status": 200,
  "data": {
    "employees": [ { "_id": "...", "username": "amit" } ],
    "sort": { "field": "created_at", "direction": "desc" },
    "pagination": { "page": 1, "limit": 20, "total": 37 }
  },
  "message": "Employees fetched successfully"
}
```

The list is keyed by the **resource plural**, not a generic name, so
`data.employees` reads for itself. `sort` and `pagination` sit beside it. This is
the shape the list addresses will use when they are built; the builders in
`helpers/list_query` and `validators/query_params/` already produce those two
pieces.

#### How this is kept true

`send_response` turns `null` and `undefined` into `{}`. If it is handed a list
or a plain value, it **throws an error on purpose**.

It does not quietly wrap a stray list, because the right name is different for
each address — the resource plural for a list, `errors` for bad fields. Guessing
would put a different name in the reply depending on who called. Throwing shows
the mistake while the developer is still writing the code, where fixing it costs
nothing.

### 6.3 Turning errors into replies

`error_handler` is the single exit for every failure. `normalize_error` turns
each kind of error into a status, a message, and field details. Every case that
has field details puts them in `data.errors`. That is always a list, even for
one bad field, so an app can loop over it without counting first.

| Where it came from | Status | Message | `data` |
| ------------------ | :----: | ------- | ------ |
| `app_error`, thrown by us on purpose | its own | its own | its own `details`; a list is put under `errors`, an object is used as it is |
| Joi found bad input | 400 | `VALIDATION_FAILED` | `{ errors: [{ field, message, type }] }` |
| Mongoose found bad input | 400 | `VALIDATION_FAILED` | `{ errors: [{ field, message, type }] }` |
| A bad ID in the address | 400 | `INVALID_IDENTIFIER` | `{ errors: [{ field, message, type: "cast_error" }] }` |
| Value already taken (11000) | 409 | `DUPLICATE_VALUE` | `{ errors: [{ field, "<field> already exists", type: "duplicate_value" }] }` |
| Broken JSON in the request | 400 | `INVALID_JSON` | `{}` |
| Anything else | 500 | `INTERNAL_SERVER_ERROR` | `{}` |

So bad input looks like this:

```json
{
  "status": 400,
  "data": {
    "errors": [
      { "field": "email", "message": "\"email\" must be a valid email", "type": "string.email" },
      { "field": "extra", "message": "\"extra\" is not allowed", "type": "object.unknown" }
    ]
  },
  "message": "Validation failed"
}
```

Only the 500 case writes the original error to the server log. Inner details are
never sent to the caller.

### 6.4 Status codes we use

`http_status` is the only place status numbers come from. We never write the
number directly in the code.

`200 OK`, `201 CREATED`, `400 BAD_REQUEST`, `401 UNAUTHORIZED`,
`403 FORBIDDEN`, `404 NOT_FOUND`, `409 CONFLICT`,
`500 INTERNAL_SERVER_ERROR`.

---

## 7. Checking what comes in

- One Joi rule set per address, kept in `src/validators/request_body/`. It runs
  before the controller, through `validate_body`, `validate_query`, or
  `validate_params`. These are thin wrappers around
  `validate_request(schema, property)`.
- Checking runs with `abortEarly: false`, so the caller is told about **every**
  bad field at once, instead of one per try. `convert: true` changes types where
  Joi can do so safely.
- `stripUnknown` is set to **false** on purpose. Unknown fields are not quietly
  dropped. Each rule set says `.unknown(false)`, so an unexpected field gives a
  400 naming it. This is what stops someone slipping `user_type` or `emp_id`
  into a signup. The request is refused, rather than accepted with the extra
  field silently thrown away.
- The checked values are written back to `req[property]`. Query values go to
  `req.validated_query` instead, because Express 5 does not allow writing to
  `req.query`.
- Shared field rules live in `request_body/auth/user_fields.js` and are reused by
  each rule set, so `email` means the same thing everywhere.

The six rule sets, one per address:

| Rule set | Address | Fields |
| -------- | ------- | ------ |
| `super_admin_signup_schema` | `/super-admin/auth/signup` | the five, plus `password` |
| `admin_signup_schema` | `/super-admin/auth/admin/signup` | the five |
| `employee_signup_schema` | `/admin/auth/employee/signup` | the five |
| `super_admin_signin_schema` | `/super-admin/auth/signin` | `username`, `password` |
| `admin_signin_schema` | `/admin/auth/signin` | `username`, `password` |
| `employee_signin_schema` | `/employee/auth/signin` | `username`, `password` |

"the five" means `first_name`, `last_name`, `email`, `phone_number`, `username`.

Several of these are identical today — the three signins match each other, and
the two five-field signups match each other. They are kept as separate files
anyway, so a route names its own rule set and one address can gain a field later
without silently changing another.

### 7.1 Field rules

| Field | Rule |
| ----- | ---- |
| `first_name`, `last_name` | 1 to 100 characters |
| `email` | 5 to 254 characters, must look like an email, stored lowercase |
| `phone_number` | exactly 10 digits |
| `username` | 3 to 50 characters, stored lowercase |
| `password` | 8 to 20 characters when typed in; up to 500 stored |
| `emp_id` | exactly 7 letters or digits, stored uppercase |

The two password limits are different on purpose. A person may type up to 20
characters. The stored value is the scrambled version, which is longer, so
storage allows up to 500.

---

## 8. Settings

| Setting | Needed | Default | What it is for |
| ------- | :----: | ------- | -------------- |
| `MONGODB_URI` | Yes | — | Where the database is. The server will not start without it. |
| `JWT_SECRET` | Yes | — | The key that signs passes. Must be long and random. |
| `JWT_EXPIRES_IN` | No | `1d` | How long a pass lasts. |
| `PORT` | No | `3000` | Which port to listen on. |

`.env` is loaded once, at the top of `src/server.js`, before any file that reads
a setting. `.env` is kept out of Git. `.env.example` is committed as a template
to copy.

Start-up order: turn on short import names → load `.env` → connect to the
database → start listening. If the database connection fails, the server writes
the reason and stops. It does not serve requests it cannot answer.

---

## 9. Commands, building, and data changes

| Command | What it does |
| ------- | ------------ |
| `npm run dev` | Runs from `src/` and restarts when you save a file |
| `npm run build` | Builds `dist/` and copies `src/public` into it |
| `npm start` | Runs the built `dist/server.js` |
| `npm run start:source` | Runs from `src/` without building |
| `npm test` | Runs the tests |
| `npm run migrate:generate` | Writes a data-change file from the settings |
| `npm run migrate` | Applies data changes that have not run yet |
| `npm run migrate:rollback` | Undoes the last data change |

Data changes are described in `scripts/generator/backfill_config.js`, written
into `scripts/migrations/`, and the ones already applied are recorded in
`scripts/migrations/executed/`. `migration_backup.js` saves a copy before a
change that removes or overwrites data, so undoing it has something to restore.

---

## 10. Security

### 10.1 Passwords
Scrambled with bcrypt at 12 rounds. The scrambling happens inside the user
record, so no controller can save a plain password even by mistake. The field is
hidden on read and removed again from anything sent out.

### 10.2 The shared starting password

Every account a super admin or an admin creates starts on the same fixed
password, held in `@validators/constants`. This is a known weak point, accepted
for now because there is no email provider to send an invite through.

Anyone who knows that value can sign in as any account that has not changed it,
and the value is in the source code. The fix is a forced password change at
first sign-in, which is not built yet. Until it is, treat every freshly created
account as open.

### 10.3 Passes
Signed with a key from the settings. There is no built-in fallback key, on
purpose — a fallback would let the service run insecurely without anyone
noticing. A short life (one day) is the **only** way a pass stops working in
version 1. There is no list of cancelled passes and no server-side session.

### 10.4 Not giving away usernames
Every login failure gives the same 401.

There is one exception. On **signup**, a clash does name the field. This is a
choice, not an oversight: the person calling that address is the one installing
the system, and an unhelpful error there would waste more time than the
information gives away. The address also works only once, so there is no way to
sit and probe it.

The admin and employee signup addresses (5.7) name the clashing field too. Those callers are ordinary staff rather than the installer, and they can
call as often as they like, so this is a real way to test whether an email or
phone number is already registered. It is accepted because both addresses need a
signed-in caller of the right group, which makes the caller known rather than
anonymous.

### 10.5 Known gaps we are carrying

| Gap | What to do in v2 |
| --- | ---------------- |
| ~~The super admin signup never closes~~ | **Done in v1.** The one-super-admin rule shuts it after first use (5.6) |
| Two signups sent at the very same moment could both create a super admin | Add a unique index on `user_type` limited to super admins, through a migration (5.6) |
| Losing the one super admin locks up the system, and there is no password reset | Build forgot-password, and until then keep those login details somewhere safe outside the system |
| Every created account starts on the same known password | Force a password change at first sign-in |
| CORS is open to every website | Limit it to our own apps |
| Nothing limits password guessing | Add a limit per IP and per username, and lock the account after too many tries |
| A pass can only be stopped by waiting for it to run out | Consider a cancelled list, or short passes plus a renew pass |
| Nothing records who did what | Log logins and admin actions |

---

## 11. Rules for writing code here

- **snake_case** for file names, variables, functions, and database fields.
  Model names stay in PascalCase (`"User"`).
- **One address per controller file**, named after the address.
- **No loose values.** Groups come from `user_type`. Status numbers come from
  `http_status`. Limits and patterns come from `@validators/constants`. Wording
  comes from `@validators/messages`.
- **Wrap controllers** at the route with `async_handler(controller)`. Then a
  failed promise reaches `error_handler` instead of crashing the service.
  Controllers do not use try/catch for failures we expect.
- **Throw errors we mean** as `app_error(status, message, details?)`. Never
  write `res.status(...).json(...)` inside a controller for a failure.
- **Trim replies** with `@utils/projection`. `project(doc, select)` narrows a
  record already in memory, so a record we just saved is reshaped without being
  read back from the database.
- **Fix the group at the controller, never read it from the body.** Every
  address that creates an account passes a `user_type` constant itself. This is
  the rule the whole permission model rests on, and it is paired with
  `.unknown(false)` on the rule set so an attempt to send one is refused rather
  than ignored.
- **Guards go on the route when its router carries public addresses too.** Put
  `authenticate_user` and `authorize_user_types(...)` on the router only when
  every address under it is protected.
- **Comments explain why, not what.** The code can already be read for what it
  does. The existing files explain the choices behind it — why the retry wraps
  the way it does, why the group is read from the pass, why group names are
  checked at start-up. New code is expected to do the same.

---

## 12. What must be tested

We use the Node test runner with supertest. At a minimum:

**Login and signup**
- Signup on an empty database makes an active super admin, with an `emp_id` made
  by the server, and returns no pass
- Signup refuses a `user_type` or `emp_id` sent by the caller
- A second signup is refused with 409 once a super admin exists
- A second signup is still refused when the existing super admin is switched off
- The refusal happens before an employee ID number is used up
- A repeated email, phone number, or username each give a 409 naming the field
- Each login accepts only its own group
- Wrong password, unknown username, wrong group, and switched-off account cannot
  be told apart
- No reply ever contains `password`

**Creating users**
- A super admin can create an admin at `/super-admin/auth/admin/signup`; the
  saved group is `admin`
- An admin can create an employee at `/admin/auth/employee/signup`; the saved
  group is `employee`
- The public routes on those same routers stay public
- An admin cannot create an admin, and a super admin cannot create an employee
- An employee cannot call either address
- Neither address can be called without a pass
- A `user_type` or `emp_id` in the body is a 400, not a value that is ignored
- The created account is saved with the default password, hashed, never plain
- The reply carries the generated `emp_id` and never carries `password`
- A repeated email, phone number, or username gives a 409 naming the field

**Permissions**
- A missing, broken, and run-out pass each give the documented 401
- A valid pass from the wrong group gives 403, not 401
- `authorize_user_types` with an unknown group fails when the app starts
- An address with `authorize_user_types` but no `authenticate_user` refuses
  everyone

**Employee ID**
- The number goes up within a month, and restarts at a new month in Indian time
- Two accounts made at once cause a retry, not a failure
- Account 1000 in one month gives the "numbers used up" error

**Errors**
- Each case in `normalize_error` gives the documented status and details
- Field problems arrive as `data.errors`, a list, even for one bad field
- A 500 shows the caller nothing from inside

**Reply shape**
- `data` is an object on every reply, good and bad
- An address with nothing to send returns `data: {}`, not `null`, and not a
  missing key
- `send_response` throws when handed a list or a plain value

---

## 13. Where each rule is handled

| Rule in the PRD | Handled by |
| --------------- | ---------- |
| FR-1.1 to FR-1.3 | `controllers/auth/super_admin_signup.js` — group and `emp_id` set by the server |
| FR-1.4, FR-1.5 | User record rules and unique indexes (4.1, 4.3) |
| FR-1.6 | The bcrypt step before saving (4.2) |
| FR-1.7 | Signup returns the `auth_response` fields with no pass (6.1) |
| FR-1.8 | Duplicate errors turned into 409 (6.3) |
| FR-1.9 | `assert_no_super_admin_exists`, called first in the signup controller (5.6) |
| FR-1.10 to FR-1.17 | `admin_signup`, `employee_signup`, and `create_managed_user` (5.7) |
| FR-2.1 to FR-2.5 | Three login controllers with a fixed group, and `authenticate_by_user_type` (5.6) |
| FR-2.6, FR-2.7 | `generate_auth_token`, `build_signin_payload` (5.1, 5.6) |
| FR-2.8 | Password hidden on read and removed from output (4.2) |
| FR-3.1 to FR-3.3 | `authenticate_user` (5.3) |
| FR-3.4, FR-3.5 | `authorize_user_types` (5.4) |
| FR-4.1 to FR-4.4 | Employee ID and its retry (4.4) |
| FR-5.1, FR-5.2 | `send_response` always returns an object, `{}` when empty (6.2) |
| FR-5.3 | A list keyed by its resource plural, beside `sort` and `pagination` (6.2) |
| FR-5.4 | `as_error_data` puts field problems under `errors` (6.3) |
| FR-5.5 | The 500 case returns a general message and `{}` (6.3) |

Wording for each address comes from one place, `@validators/messages`:
`CREATED` ("Super admin account created successfully"), `SIGNED_IN`,
`ADMIN_SIGNED_IN`, `EMPLOYEE_SIGNED_IN`.
