# devin-openapi-sample

A small Express + Prisma + Zod API used to demonstrate implementing endpoints directly from an
OpenAPI specification.

## Stack

- Express 4 (TypeScript)
- Prisma ORM (SQLite, so the test suite runs with no external services)
- Zod for request validation
- Jest + Supertest for integration tests

## Layout

```
openapi/                     OpenAPI 3.0 specs
prisma/schema.prisma         Data model
src/api/v2/<resource>/       router / controller / service / repository / schemas
src/middleware/              auth, authorize, validate, error handling
src/__tests__/               Supertest integration tests
```

Each resource follows the same layering: `router.ts` wires middleware, `controller.ts` handles
HTTP concerns, `service.ts` holds business rules, `repository.ts` owns Prisma queries and
`schemas.ts` holds the Zod schemas derived from the OpenAPI definitions.

Errors are thrown as `ApiError` subclasses (`src/lib/errors.ts`) and serialized by
`src/middleware/error-handler.ts` as:

```json
{ "error": { "code": "NOT_FOUND", "message": "Booking not found" } }
```

## Getting started

```bash
npm install
cp .env.example .env
npx prisma db push
npm run dev
```

## Tests

```bash
npm test
```

Requests are authenticated with a bearer JWT signed with `JWT_SECRET`; the payload carries
`{ id, email, role }`.
