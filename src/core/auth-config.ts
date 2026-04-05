import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@/core/prisma";
import { customSession } from "better-auth/plugins";
import { Role } from "../../generated/prisma/enums";
import { ROLE_PERMISSIONS } from "@/core/lib/roles-and-permissions";
import { betterAuthUrl, port } from "@/core/env";
import { UserSchema } from "@/domains/users/users.schema";

const authBaseURL = betterAuthUrl ?? `http://localhost:${port}`;

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  baseURL: authBaseURL,
  emailAndPassword: { enabled: true },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "VIEWER",
      },
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          const result = await UserSchema.omit({ password: true }).safeParseAsync(user);

          if (!result.success) {
            throw new Error("Validation failed while creating user");
          }

          return {
            data: user,
          };
        },
      },
    },
  },
  plugins: [
    customSession(async ({ user, session }) => {
      const dbUser = await prisma.user.findFirst({
        select: { role: true },
        where: { id: user.id },
      });

      const role = (dbUser?.role as Role) ?? Role.VIEWER;
      const permissions = ROLE_PERMISSIONS[role];

      return {
        ...session,
        role,
        permissions,
      };
    }),
  ],
});
