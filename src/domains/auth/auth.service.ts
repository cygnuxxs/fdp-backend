import type { IncomingHttpHeaders } from "node:http";
import { auth } from "@/core/auth-config";
import { UserSchema } from "@/domains/users/users.schema";
import type { z } from "zod";

type SignUpPayload = z.infer<typeof UserSchema>;
type SignInPayload = Omit<SignUpPayload, "name">;

export const authService = {
  signUpEmail(payload: SignUpPayload, headers: IncomingHttpHeaders) {
    return auth.api.signUpEmail({
      body: payload,
      headers,
    });
  },

  signInEmail(payload: SignInPayload, headers: IncomingHttpHeaders) {
    return auth.api.signInEmail({
      body: payload,
      headers,
      asResponse: true,
    });
  },

  signOut(headers: IncomingHttpHeaders) {
    return auth.api.signOut({ headers });
  },
};