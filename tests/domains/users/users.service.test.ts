import { usersService } from "../../../src/domains/users/users.service";
import { createTestUser } from "../../helpers/auth.helper";
import { cleanDatabase } from "../../helpers/db.helper";

describe("Users Service", () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  it("lists users with pagination", async () => {
    await createTestUser({ email: `users_service_${Date.now()}@test.com` });

    const [total, users] = await usersService.listUsers({}, 0, 10);

    expect(total).toBeGreaterThan(0);
    expect(users.length).toBeGreaterThan(0);
  });
});
