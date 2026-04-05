# Finance Data Processing and Access Control

Backend for a finance dashboard system where different users interact with financial records based on their role.

## Prerequisites

- Node.js >= 18.0.0
- pnpm >= 10.0.0

## Installation

Install dependencies using pnpm:

```bash
pnpm install
```

`postinstall` automatically runs Prisma client generation after install.

## Environment Setup

Create a local environment file:

```bash
cp .env.example .env
```

Required variables:

- `DATABASE_URL`: PostgreSQL connection string for your local/dev database
- Better Auth related env keys used by your auth configuration

## Database Setup (First Run)

Sync Prisma schema to your database:

```bash
pnpm db:push
```

Generate Prisma client manually (optional, already covered by `postinstall`):

```bash
pnpm db:generate
```

Seed initial users and financial records:

```bash
pnpm db:seed
```

What seeding does:

- Creates three users for role-based testing (`ADMIN`, `ANALYST`, `VIEWER`)
- Inserts sample financial records for dashboard and records features
- Replaces previously seeded financial records so reruns stay deterministic

#### Default Seeded Users

After running `pnpm db:seed`, the following test users are available:

| Name | Email | Password | Role |
| --- | --- | --- | --- |
| ashok | ashok@gmail.com | AshokAtragadda | ADMIN |
| bharani | bharani@gmail.com | BharaniRayudu | ANALYST |
| viewer | viewer@gmail.com | Viewer4220 | VIEWER |

If you skip `pnpm db:push`, the app can start but database queries may fail at runtime because required tables/columns may be missing.

## Development

Run the application directly with live reload:

```bash
pnpm dev
```

This starts the Express server from `src/app.ts`.

## Quick Start (Recommended)

Use this sequence on a fresh clone:

```bash
pnpm install
cp .env.example .env
pnpm db:push
pnpm db:seed
pnpm dev
```

## Deploy To Vercel

This repository can be deployed on Vercel as an Express app.

Vercel uses the exported app from `src/app.ts`, which handles both serverless deployment and local development startup.

### Vercel project setup

1. Import this repository into Vercel.
2. Keep the default framework preset as `Express` if Vercel asks.
3. Set the build command to `pnpm build` so Prisma client generation and TypeScript checks run during deploy.
4. Leave the output directory empty.

### Required environment variables on Vercel

- `DATABASE_URL`: production PostgreSQL connection string
- `BETTER_AUTH_SECRET`: Better Auth secret
- `BETTER_AUTH_URL`: your deployed backend URL (for example, `https://your-app-name.vercel.app`)

### Database preparation

Before first production traffic, ensure your database schema exists:

```bash
pnpm db:push
```

Optional seed (only if you want sample data in that database):

```bash
pnpm db:seed
```

### Deploy from CLI (optional)

```bash
pnpm dlx vercel
```

For production:

```bash
pnpm dlx vercel --prod
```

## API Reference

Base URL (local): `http://localhost:{PORT}`

### Auth and Authorization Model

- Session auth is cookie-based via Better Auth.
- Role enum values: `VIEWER`, `ANALYST`, `ADMIN`.
- Route guards use permission inheritance:
	- `authorize(VIEWER)`: any authenticated role (`VIEWER`, `ANALYST`, `ADMIN`)
	- `authorize(ANALYST)`: `ANALYST` or `ADMIN`
	- `authorize(ADMIN)`: `ADMIN` only

### Shared Error Response Shape

Most error responses follow:

```json
{
	"message": "Error message",
	"details": {}
}
```

Missed endpoint responses (`404`) are customized with a random quote:

```json
{
	"status": "error",
	"code": 404,
	"title": "Lost In The API",
	"message": "No endpoint found for GET /some/unknown/path",
	"quote": "Even the best maps have blank spaces.",
	"suggestions": [
		"Double-check the HTTP method and endpoint path.",
		"Verify route prefixes and version segments.",
		"Use documented endpoints from the API reference."
	],
	"requested": {
		"method": "GET",
		"path": "/some/unknown/path"
	},
	"timestamp": "2026-04-05T12:00:00.000Z"
}
```

### Unknown Endpoint Fallback

When no route matches the request path + method combination, the API falls back to a global `404` handler.

- Trigger condition: any unmatched endpoint
- Applies to: all HTTP methods
- Response type: JSON
- Quote behavior: quote is randomly selected from a curated quote list on every request

Fallback contract:

| Field | Type | Description |
| --- | --- | --- |
| `status` | `string` | Always `error` |
| `code` | `number` | Always `404` |
| `title` | `string` | Human-friendly title (`Lost In The API`) |
| `message` | `string` | Includes request method and path |
| `quote` | `string` | Random quote per request |
| `suggestions` | `string[]` | Next-step hints for fixing the request |
| `requested.method` | `string` | HTTP method used |
| `requested.path` | `string` | Original requested path |
| `timestamp` | `string` | ISO timestamp of the response |

Common statuses across routes:

- `400` bad request (invalid params, invalid pagination)
- `401` unauthorized (not logged in / invalid session)
- `403` forbidden (insufficient role)
- `404` not found
- `409` conflict (duplicate resource)
- `422` validation failed (Zod schema failures)
- `500` internal server error

### Route Summary

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| `ALL` | `/api/auth/*splat` | Public (framework-managed) | Better Auth handler endpoints |
| `GET` | `/` | Public | Health/service info |
| `POST` | `/auth/sign-up` | Public | Register user |
| `POST` | `/auth/sign-in` | Public | Sign in user |
| `POST` | `/auth/sign-out` | Authenticated session | Sign out current user |
| `GET` | `/auth/me` | Public (session-aware) | Current user profile from session |
| `GET` | `/dashboard` | Authenticated, role `VIEWER+` | Combined high-level dashboard payload (summary + trends + recent) |
| `GET` | `/dashboard/summary` | Authenticated, role `VIEWER+` | High-level totals |
| `GET` | `/dashboard/trends` | Authenticated, role `VIEWER+` | Weekly and monthly trend data |
| `GET` | `/dashboard/recent-activity` | Authenticated, role `VIEWER+` | Read-only recent record activity |
| `GET` | `/dashboard/category-wise-totals` | Authenticated, role `ANALYST+` | Category-wise net totals |
| `GET` | `/records` | Authenticated, role `ANALYST+` | List records with filters/pagination |
| `POST` | `/records` | Authenticated, role `ADMIN` | Create single record |
| `POST` | `/records/batch` | Authenticated, role `ADMIN` | Create records in bulk |
| `PATCH` | `/records/:id` | Authenticated, role `ADMIN` | Update one record |
| `DELETE` | `/records/:id` | Authenticated, role `ADMIN` | Soft-delete one record |
| `GET` | `/users` | Authenticated, role `ADMIN` | List users with search/pagination |
| `POST` | `/users` | Authenticated, role `ADMIN` | Create user |
| `PATCH` | `/users/:id` | Authenticated, role `ADMIN` | Update user |
| `DELETE` | `/users/:id` | Authenticated, role `ADMIN` | Delete user |

### Framework-managed Auth Catch-all

#### `ALL /api/auth/*splat`

- Mounted with Better Auth node handler.
- This route is framework-managed and supports multiple auth actions internally.
- Refer to Better Auth endpoint docs for exact subpaths and payload contracts.

### Welcome

#### `GET /`

Access: Public

Request:

- Path params: none
- Query params: none
- Body: none

Success `200`:

```json
{
	"status": "ok",
	"service": "Finance Data Processing Backend",
	"message": "API is running",
	"developedBy": {
		"name": "Ashok Atragadda",
		"alias": "cygnuxxs",
		"linkedIn": "https://linkedin.com/in/ashok-atragadda",
		"github": "https://github.com/cygnuxxs"
	}
}
```

### Auth

#### `POST /auth/sign-up`

Access: Public

Body schema:

- `name`: string, minimum length `3`
- `email`: valid email
- `password`: string, minimum length `8`

Success `201`:

```json
{
	"message": "User successfully created.",
	"user": {
		"id": "string",
		"email": "user@example.com",
		"name": "User Name"
	}
}
```

Errors:

- `422` invalid payload
- `409` email already exists
- `500` unexpected error

#### `POST /auth/sign-in`

Access: Public

Body schema:

- `email`: valid email
- `password`: string, minimum length `8`

Success `200`:

```json
{
	"message": "User logged in successfully",
	"user": {
		"id": "string",
		"email": "user@example.com",
		"name": "User Name"
	}
}
```

Notes:

- For valid credentials, response sets auth cookie headers.

Errors:

- `401` invalid credentials
- `422` invalid payload
- `500` unexpected error

#### `POST /auth/sign-out`

Access: Authenticated session required

Request:

- Path params: none
- Query params: none
- Body: none

Success `200`:

```json
{
	"message": "User logged out successfully"
}
```

Errors:

- `401` not logged in
- `500` sign-out failure

#### `GET /auth/me`

Access: Public (returns session-aware response)

Request:

- Path params: none
- Query params: none
- Body: none

Success `200` (not authenticated):

```json
{
	"currentUser": null
}
```

Success `200` (authenticated):

```json
{
	"currentUser": {
		"id": "string",
		"email": "user@example.com",
		"name": "User Name",
		"role": "ADMIN",
		"status": "ACTIVE",
		"image": null,
		"emailVerified": false
	}
}
```

Errors:

- `500` unexpected error

### Dashboard

Viewer vs Analyst access model:

- Viewer: read-only high-level dashboard (`summary`, `trends`, optional `recent-activity`)
- Analyst: everything Viewer can access, plus category-wise totals and full records access (`GET /records`)
- Viewer cannot create/update/delete records (those remain admin-only)

#### `GET /dashboard/summary`

Access: Authenticated, role `VIEWER+`

Request:

- Path params: none
- Query params: none
- Body: none

Success `200`:

```json
{
	"totalIncome": 0,
	"totalExpense": 0,
	"netBalance": 0
}
```

Errors:

- `401` not logged in
- `403` insufficient role

#### `GET /dashboard/trends`

Access: Authenticated, role `VIEWER+`

Request:

- Path params: none
- Query params: none
- Body: none

Success `200`:

```json
{
	"weeklyTrends": [
		{
			"period": "2026-W14",
			"income": 0,
			"expense": 0,
			"netBalance": 0
		}
	],
	"monthlyTrends": [
		{
			"period": "2026-04",
			"income": 0,
			"expense": 0,
			"netBalance": 0
		}
	]
}
```

Errors:

- `401` not logged in
- `403` insufficient role

#### `GET /dashboard/recent-activity`

Access: Authenticated, role `VIEWER+`

Request:

- Path params: none
- Query params: none
- Body: none

Success `200`:

```json
{
	"recentActivity": [
		{
			"id": 1,
			"amount": 100,
			"type": "INCOME",
			"category": "Salary",
			"date": "2026-04-05T00:00:00.000Z",
			"notes": "string"
		}
	]
}
```

Errors:

- `401` not logged in
- `403` insufficient role

#### `GET /dashboard/category-wise-totals`

Access: Authenticated, role `ANALYST+`

Request:

- Path params: none
- Query params: none
- Body: none

Success `200`:

```json
{
	"categoryWiseTotals": [
		{
			"category": "Salary",
			"netBalance": 10000
		}
	]
}
```

Errors:

- `401` not logged in
- `403` insufficient role

#### `GET /dashboard`

Access: Authenticated, role `VIEWER+`

Request:

- Path params: none
- Query params: none
- Body: none

Success `200`:

```json
{
	"totalIncome": 0,
	"totalExpense": 0,
	"netBalance": 0,
	"weeklyTrends": [
		{
			"period": "2026-W14",
			"income": 0,
			"expense": 0,
			"netBalance": 0
		}
	],
	"monthlyTrends": [
		{
			"period": "2026-04",
			"income": 0,
			"expense": 0,
			"netBalance": 0
		}
	],
	"recentActivity": []
}
```

Errors:

- `401` not logged in
- `403` insufficient role

### Records

#### Record Input Schema

- `category`: string, required
- `date`: date-like value, optional (coerced to `Date`)
- `type`: enum, one of `INCOME`, `EXPENSE`
- `notes`: string, optional, max length `500`
- `amount`: number, must be `> 0`

#### `GET /records`

Access: Authenticated, role `ANALYST+`

Query params:

- `category`: string, optional
- `date`: date-like string, optional
- `type`: enum `INCOME | EXPENSE`, optional
- `page`: integer `>= 1`, optional, default `1`
- `limit`: integer `>= 1`, optional, default `25`, capped at `100`

Success `200`:

```json
{
	"message": "Records fetched successfully",
	"count": 2,
	"pagination": {
		"page": 1,
		"limit": 25,
		"total": 2,
		"totalPages": 1,
		"hasNextPage": false,
		"hasPreviousPage": false
	},
	"filters": {
		"category": null,
		"date": null,
		"type": null
	},
	"data": [
		{
			"id": 1,
			"amount": 100,
			"type": "INCOME",
			"category": "Salary",
			"date": "2026-04-05T00:00:00.000Z",
			"notes": "string"
		}
	]
}
```

Errors:

- `400` invalid `page` or `limit`
- `401` not logged in
- `403` insufficient role
- `422` invalid filter values
- `500` unexpected error

#### `POST /records`

Access: Authenticated, role `ADMIN`

Body: Record Input Schema

Success `201`:

```json
{
	"message": "Record created successfully",
	"data": {
		"id": 1,
		"amount": 100,
		"type": "INCOME",
		"category": "Salary",
		"date": "2026-04-05T00:00:00.000Z",
		"notes": "string",
		"deletedAt": null,
		"deletedBy": null
	}
}
```

Errors:

- `401` not logged in
- `403` insufficient role
- `422` invalid payload
- `500` unexpected error

#### `POST /records/batch`

Access: Authenticated, role `ADMIN`

Body:

- Array of Record Input Schema
- Maximum items: `1000`

Success `201`:

```json
{
	"message": "Records created successfully",
	"count": 2
}
```

Errors:

- `401` not logged in
- `403` insufficient role
- `422` invalid payload
- `413` payload too large (possible for oversized batch payloads)
- `500` unexpected error

#### `PATCH /records/:id`

Access: Authenticated, role `ADMIN`

Path params:

- `id`: number, required

Body:

- Partial Record Input Schema
- Must contain at least one field

Success `200`:

```json
{
	"message": "Record update was successful",
	"record": {
		"id": 1,
		"amount": 150,
		"type": "INCOME",
		"category": "Freelance",
		"date": "2026-04-05T00:00:00.000Z",
		"notes": "string"
	}
}
```

Errors:

- `400` invalid record id
- `401` not logged in
- `403` insufficient role
- `404` record not found
- `422` invalid payload
- `500` unexpected error

#### `DELETE /records/:id`

Access: Authenticated, role `ADMIN`

Path params:

- `id`: number, required

Request body: none

Success `200`:

```json
{
	"message": "Record deletion was successful"
}
```

Behavior:

- Performs soft-delete by setting `deletedAt` and `deletedBy`.

Errors:

- `400` invalid record id
- `401` not logged in
- `403` insufficient role
- `404` record not found
- `500` unexpected error

### Users

#### User Input Schema (`POST /users`)

- `name`: string, minimum length `3`
- `email`: valid email
- `password`: string, minimum length `8`

#### User Patch Schema (`PATCH /users/:id`)

- Partial object, at least one field required
- Allowed fields:
	- `name`: string (min length `3`)
	- `email`: valid email
	- `role`: enum `VIEWER | ANALYST | ADMIN`
	- `status`: enum `ACTIVE | INACTIVE`

#### `GET /users`

Access: Authenticated, role `ADMIN`

Query params:

- `search`: string, optional (matches name or email, case-insensitive)
- `page`: integer `>= 1`, optional, default `1`
- `limit`: integer `>= 1`, optional, default `25`, capped at `100`

Success `200`:

```json
{
	"message": "Users fetched successfully",
	"data": [
		{
			"id": "string",
			"email": "user@example.com",
			"status": "ACTIVE",
			"role": "VIEWER",
			"name": "User Name",
			"emailVerified": false,
			"image": null,
			"createdAt": "2026-04-05T00:00:00.000Z",
			"updatedAt": "2026-04-05T00:00:00.000Z"
		}
	],
	"filters": {
		"search": null
	},
	"pagination": {
		"page": 1,
		"limit": 25,
		"total": 1,
		"totalPages": 1,
		"hasNextPage": false,
		"hasPreviousPage": false
	}
}
```

Errors:

- `400` invalid `page` or `limit`
- `401` not logged in
- `403` insufficient role
- `500` unexpected error

#### `POST /users`

Access: Authenticated, role `ADMIN`

Body: User Input Schema

Success `201`:

```json
{
	"message": "User successfully created.",
	"user": {
		"id": "string",
		"email": "user@example.com",
		"name": "User Name"
	}
}
```

Errors:

- `401` not logged in
- `403` insufficient role
- `409` duplicate email
- `422` invalid payload
- `500` unexpected error

#### `PATCH /users/:id`

Access: Authenticated, role `ADMIN`

Path params:

- `id`: string, required

Body: User Patch Schema

Success `200`:

```json
{
	"message": "User updated successfully",
	"user": {
		"id": "string",
		"email": "user@example.com",
		"status": "ACTIVE",
		"role": "ANALYST",
		"name": "Updated Name",
		"emailVerified": false,
		"image": null,
		"createdAt": "2026-04-05T00:00:00.000Z",
		"updatedAt": "2026-04-05T00:00:00.000Z"
	}
}
```

Errors:

- `400` invalid user id
- `401` not logged in
- `403` insufficient role
- `404` user not found
- `422` invalid payload
- `500` unexpected error

#### `DELETE /users/:id`

Access: Authenticated, role `ADMIN`

Path params:

- `id`: string, required

Request body: none

Success `200`:

```json
{
	"message": "User deleted successfully"
}
```

Errors:

- `400` invalid user id
- `401` not logged in
- `403` insufficient role
- `404` user not found
- `500` unexpected error

## Build

Compile TypeScript to JavaScript:

```bash
pnpm run build
```

## Running

Start the compiled application:

```bash
pnpm start
```

Or run directly after building:

```bash
pnpm run build && pnpm start
```

## Project Structure

```
src/                 # TypeScript source files
dist/                # Compiled JavaScript output
tsconfig.json        # TypeScript configuration
package.json         # Project metadata and dependencies
.npmrc               # pnpm configuration
.gitignore          # Git ignore rules
```

## License

ISC
