import { z } from "zod";
import { Role, UserStatus } from "../../../generated/prisma/enums";
export const UserSchema = z.object({
  name: z
    .string("Name is required.")
    .min(3, { error: "Name must be minimum of 3 characters long." }),
  email: z.email("Valid email is required."),
  password: z
    .string()
    .min(8, { error: "Password must be minimum of 8 characters long." }),
});

export const UpdateUserSchema = UserSchema.omit({ password: true }).safeExtend({
  role: z.enum(Role),
  status: z.enum(UserStatus),
});

export const UpdateUserPatchSchema = UpdateUserSchema.partial().strict().refine(
  (data) => Object.keys(data).length > 0,
  {
    error: "At least one field must be provided",
  },
);

export type UpdateUserPatchInput = z.infer<typeof UpdateUserPatchSchema>;
