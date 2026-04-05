import { authService } from "../../../src/domains/auth/auth.service";
import { cleanDatabase } from "../../helpers/db.helper";

describe("Auth Service", () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  it("creates a user with email/password", async () => {
    const payload = {
      email: `auth_service_${Date.now()}@test.com`,
      name: "Auth Service User",
      password: "ServicePassword123!",
    };

    const result = await authService.signUpEmail(payload, {});

    expect(result).toHaveProperty("user");
    expect(result.user.email).toBe(payload.email);
    expect(result).toHaveProperty("token");
  });
});
