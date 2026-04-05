import { prisma } from "../../src/core/prisma";
import { Role } from "../../generated/prisma/enums";
import { auth } from "../../src/core/auth-config";

const DEFAULT_TEST_PASSWORD = "TestPassword123!";
const passwordByUserId = new Map<string, string>();

/**
 * Create a test session for an authenticated user
 */
export async function createTestSession(userId: string) {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { id: true, role: true },
  });

  // Return session-like object for test injection
  return {
    id: `session_${Date.now()}`,
    userId,
    user: {
      id: user.id,
    },
    role: user.role,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  };
}

/**
 * Create test auth headers with session token
@@ * Returns cookie with base64-encoded test session
 */
export async function createAuthHeaders(userId: string) {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { email: true },
  });

  const password = passwordByUserId.get(userId) ?? DEFAULT_TEST_PASSWORD;
  const response = await auth.api.signInEmail({
    body: {
      email: user.email,
      password,
    },
    headers: {},
    asResponse: true,
  });

  if (!response.ok) {
    throw new Error(`Failed to authenticate test user: ${user.email}`);
  }

  const setCookies = response.headers.getSetCookie?.() ?? [];
  const rawCookies =
    setCookies.length > 0
      ? setCookies
      : (response.headers.get("set-cookie") ?? "")
          .split(";")
          .filter(Boolean);

  if (rawCookies.length === 0) {
    throw new Error("No auth cookie returned by Better Auth during test sign-in");
  }

  // Supertest expects plain cookie pairs, not full Set-Cookie attributes.
  const cookie = rawCookies.map((entry) => entry.split(";")[0]).join("; ");
  return {
    cookie,
  };
}

/**
 * Create a test user with specified role
 */
export async function createTestUser(
  data: Partial<{
    email: string;
    name: string;
    password: string;
    role: Role;
  }> = {},
) {
  const timestamp = Date.now();
  const email = data.email || `user_${timestamp}@test.com`;
  const name = data.name || `Test User ${timestamp}`;
  const password = data.password || DEFAULT_TEST_PASSWORD;
  const role = data.role || Role.VIEWER;

  const { user } = await auth.api.signUpEmail({
    body: {
      email,
      name,
      password,
    },
    headers: {},
  });

  // Better Auth sign-up creates VIEWER by default; update role when needed.
  if (role !== Role.VIEWER) {
    await prisma.user.update({
      where: { id: user.id },
      data: { role },
    });
  }

  passwordByUserId.set(user.id, password);

  return prisma.user.findUniqueOrThrow({ where: { id: user.id } });
}

/**
 * Setup authenticated request with role-based user
 */
export async function setupAuthenticatedRequest(role: Role = Role.VIEWER) {
  const user = await createTestUser({
    email: `user_${Date.now()}@test.com`,
    name: `Test User ${Date.now()}`,
    password: "TestPassword123!",
    role,
  });

  const headers = await createAuthHeaders(user.id);

  return {
    user,
    headers,
  };
}
