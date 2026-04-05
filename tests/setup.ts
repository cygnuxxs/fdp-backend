import { beforeAll, afterAll, beforeEach, jest } from "@jest/globals";
import dotenv from "dotenv";
import { type PrismaClient } from "../generated/prisma/client";

let prisma: PrismaClient | null = null;

dotenv.config({
  path: process.env["DOTENV_CONFIG_PATH"] ?? ".env.test",
  override: false,
  quiet: true,
});

jest.spyOn(console, "error").mockImplementation(() => {});

const assertSafeTestDatabase = () => {
  const dbUrl = process.env["DATABASE_URL"] ?? "";

  if (!dbUrl || !/test/i.test(dbUrl)) {
    throw new Error(
      "Unsafe DATABASE_URL for tests. Set DATABASE_URL to a dedicated test database (example: FinanceTest) via .env.test",
    );
  }
};

// Global test setup
beforeAll(async () => {
  assertSafeTestDatabase();

  // Lazy load prisma to avoid ESM issues
  const { prisma: prismaModule } = await import("../src/core/prisma");
  prisma = prismaModule;

  // Verify database connection
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log("✓ Test database connected");
  } catch (error) {
    throw new Error(
      `Failed to connect to test database: ${error instanceof Error ? error.message : String(error)}`,
      { cause: error },
    );
  }
});

// Global cleanup
afterAll(async () => {
  if (prisma) {
    await prisma.$disconnect();
  }
});

// Clear database between tests
beforeEach(async () => {
  if (!prisma) {
    const { prisma: prismaModule } = await import("../src/core/prisma");
    prisma = prismaModule;
  }

  // Clean up test data in appropriate order (respecting foreign keys)
  await Promise.all([
    prisma.session.deleteMany(),
    prisma.account.deleteMany(),
    prisma.financialRecord.deleteMany(),
    prisma.verification.deleteMany(),
  ]);
  // Note: Keep users for controlled test setup
});
