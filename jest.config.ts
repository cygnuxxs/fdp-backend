/** @type {import("jest").Config} */
const config = {
  verbose : true,
  testEnvironment: "node",
  preset: "ts-jest/presets/default-esm",
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node", "mjs"],
  extensionsToTreatAsEsm: [".ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  setupFilesAfterEnv: ["<rootDir>/tests/setup.ts"],
  testMatch: ["**/tests/**/*.test.ts"],
  clearMocks: true,
  maxWorkers: 1,
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        useESM: true,
        tsconfig: {
          module: "esnext",
          target: "es2023",
          moduleResolution: "bundler",
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
        },
      },
    ],
  },
  transformIgnorePatterns: [
    "node_modules/(?!(@prisma|@prisma/adapter-pg)/)",
  ],
  testTimeout: 10000,
}

module.exports = config