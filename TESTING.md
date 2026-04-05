# Integration Testing Guide

This project includes comprehensive integration tests for all API endpoints using Jest and Supertest.

## Project Structure

```
tests/
├── setup.ts                 # Global test setup and teardown
├── fixtures/                # Test data and fixtures
│   ├── user.fixture.ts      # User test data
│   └── record.fixture.ts    # Financial record test data
├── helpers/                 # Test utilities and helpers
│   ├── auth.helper.ts       # Authentication helpers
│   └── db.helper.ts         # Database helpers
└── integration/             # Integration test suites
    ├── welcome.test.ts      # Welcome endpoint tests
    ├── auth.test.ts         # Auth routes tests
    ├── users.test.ts        # User management tests
    ├── records.test.ts      # Financial records tests
    └── dashboard.test.ts    # Dashboard routes tests
```

## Running Tests

### Run all tests
```bash
pnpm test
```

### Run tests in watch mode
```bash
pnpm test:watch
```

### Run tests with coverage
```bash
pnpm test:coverage
```

### Run specific test file
```bash
pnpm test auth.test.ts
```

### Run tests matching pattern
```bash
pnpm test --testNamePattern="POST /auth/sign-up"
```

## Test Setup

### Global Setup (setup.ts)
- Connects to test database
- Clears test data between tests
- Handles database cleanup

### Fixtures
- Pre-defined test data for users and records
- Reusable test payloads for API requests
- Examples of valid and invalid data

### Helpers

#### auth.helper.ts
- `createTestSession()` - Create authenticated session
- `createAuthHeaders()` - Generate auth headers
- `createTestUser()` - Create user with specific role
- `setupAuthenticatedRequest()` - Setup complete auth flow

#### db.helper.ts
- `cleanDatabase()` - Reset all test data
- `createUser()` - Create test user
- `createRecord()` - Create financial record
- `getRecordCount()` - Count records (including soft-deleted)

## Test Coverage

### Welcome Route
- ✅ GET / - Service status and developer info

### Authentication Routes
- ✅ POST /auth/sign-up - User registration
  - Valid user creation
  - Invalid email validation
  - Password strength validation
  - Duplicate email prevention

- ✅ POST /auth/sign-in - User login
  - Valid credentials
  - Invalid password
  - Non-existent user
  - Missing fields

- ✅ POST /auth/sign-out - User logout
  - Authenticated logout
  - Unauthenticated rejection

### User Management Routes (Admin Only)
- ✅ GET /users - List users with pagination
  - Pagination support
  - Search by name and email
  - Pagination validation

- ✅ POST /users - Create user
  - User creation
  - Role-based access control
  - Duplicate prevention

- ✅ PATCH /users/:id - Update user
  - User profile update
  - Role changes
  - Non-existent user handling
  - Validation requirements

- ✅ DELETE /users/:id - Delete user
  - Soft delete (cascading)
  - Role-based access control
  - Session cleanup

### Records Routes
- ✅ GET /records - List records (Analyst+)
  - Pagination
  - Filtering by category, type, date
  - Soft-delete exclusion
  - Role-based access

- ✅ POST /records - Create record (Admin)
  - Record creation
  - Validation
  - Role-based access

- ✅ POST /records/batch - Batch create (Admin)
  - Multiple records
  - Batch size limits
  - Role-based access

- ✅ PATCH /records/:id - Update record (Admin)
  - Record update
  - Soft-delete protection
  - Role-based access

- ✅ DELETE /records/:id - Soft delete record (Admin)
  - Soft delete with deletedAt and deletedBy
  - Idempotent deletion
  - Auditing (tracks who deleted)

### Dashboard Route
- ✅ GET /dashboard - Dashboard access (Viewer+)
  - All roles access
  - Unauthenticated rejection

## Key Testing Concepts

### Authentication
Tests use session-based authentication to mirror production behavior:
- Sessions are created with valid tokens
- Headers include cookie and authorization
- Missing/invalid auth returns 401

### Authorization
Role-based access control is tested:
- VIEWER: can view dashboard and records
- ANALYST: can view and read records
- ADMIN: can create, update, delete records and manage users

### Soft Delete
Records are soft-deleted with auditing:
- `deletedAt` timestamp captures deletion time
- `deletedBy` captures which user deleted the record
- Soft-deleted records are excluded from list queries
- Cannot update or re-delete already soft-deleted records

### Validation
All endpoints validate input data:
- Required fields
- Data type validation
- Business rule validation (e.g., pagination limits)
- Returns 422 for validation errors

## Database Setup

Tests are configured to use `.env.test` and must point to a dedicated test database:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/FinanceTest
```

**Important:**
1. Test scripts set `NODE_ENV=test` and `DOTENV_CONFIG_PATH=.env.test`.
2. A safety check blocks test execution if `DATABASE_URL` does not look like a test database.
3. Test setup clears data before each test, so never point test runs at a development or production DB.

## Example: Running a Single Test

```bash
# Run only user signup tests
pnpm test auth.test.ts -t "should create a new user"

# Run all user management tests
pnpm test users.test.ts

# Run with verbose output
pnpm test --verbose
```

## Debugging Tests

### View test output
```bash
pnpm test --verbose
```

### Run single test and pause
```bash
pnpm test --testNamePattern="specific test name" --detectOpenHandles
```

### Check database state after test
Add breakpoints in test or inspect database:
```bash
pnpm exec prisma studio
```

## Best Practices

1. **Isolation**: Each test creates its own test data
2. **Cleanup**: Database is cleaned between tests via `beforeEach`
3. **Assertions**: Tests check both response status and body
4. **Authentication**: Auth helpers simplify session setup
5. **Fixtures**: Reuse test data rather than creating in tests
6. **Error Cases**: Test both success and failure paths

## Adding New Tests

When adding new endpoints:

1. Create test file in `tests/integration/{name}.test.ts`
2. Use helper functions for auth and setup
3. Test success and error paths
4. Include pagination, filtering, and validation tests
5. Update this guide with coverage

Example:
```typescript
import request from "supertest";
import { createTestUser, createAuthHeaders } from "../helpers/auth.helper";
import { cleanDatabase } from "../helpers/db.helper";

describe("New Endpoint", () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  it("should do something", async () => {
    const user = await createTestUser({ role: Role.ADMIN });
    const headers = await createAuthHeaders(user.id);

    const res = await request(app)
      .post("/endpoint")
      .set("cookie", headers.cookie)
      .send({ /* test data */ })
      .expect(200);

    expect(res.body).toBeDefined();
  });
});
```

## Troubleshooting

### "Cannot find module" errors
- Ensure tsconfig paths are setup correctly
- Check jest.config.js moduleNameMapper

### Database connection errors
- Verify DATABASE_URL is set
- Ensure PostgreSQL is running
- Check database exists and is accessible

### Auth failures in tests
- Verify `getSession()` helper works
- Check session table is created
- Ensure auth middleware is properly mocked

### Timeout errors
- Increase test timeout: `jest.setTimeout(10000)`
- Check for unresolved promises
- Verify database queries complete
