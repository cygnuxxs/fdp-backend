import { prisma } from "../../src/core/prisma";
import { Role } from "../../generated/prisma/enums";

/**
 * Clean all test data
 */
export async function cleanDatabase() {
  await Promise.all([
    prisma.session.deleteMany(),
    prisma.account.deleteMany(),
    prisma.financialRecord.deleteMany(),
    prisma.verification.deleteMany(),
    prisma.user.deleteMany(),
  ]);
}

/**
 * Create test user
 */
export async function createUser(overrides = {}) {
  return prisma.user.create({
    data: {
      email: `user_${Date.now()}@test.com`,
      name: "Test User",
      role: Role.VIEWER,
      ...overrides,
    },
  });
}

/**
 * Create test financial record
 */
export async function createRecord(overrides = {}) {
  return prisma.financialRecord.create({
    data: {
      amount: 100.0,
      type: "INCOME",
      category: "Salary",
      notes: "Test record",
      ...overrides,
    },
  });
}

/**
 * Get record count (including soft-deleted)
 */
export async function getRecordCount(deleted = false) {
  return prisma.financialRecord.count({
    where: {
      deletedAt: deleted ? { not: null } : null,
    },
  });
}
