import { Role } from "../../generated/prisma/enums";

export const testUsers = {
  admin: {
    email: "admin@test.com",
    name: "Admin User",
    password: "AdminPassword123!",
    role: Role.ADMIN,
  },
  analyst: {
    email: "analyst@test.com",
    name: "Analyst User",
    password: "AnalystPassword123!",
    role: Role.ANALYST,
  },
  viewer: {
    email: "viewer@test.com",
    name: "Viewer User",
    password: "ViewerPassword123!",
    role: Role.VIEWER,
  },
};

export const invalidUser = {
  email: "invalid@test.com",
  name: "Too Short",
  password: "short", // Invalid - too short
};

export const signUpPayload = {
  email: "newuser@test.com",
  name: "New Test User",
  password: "NewPassword123!",
};
