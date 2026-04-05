import { type Request, type Response } from "express";
import {
  sendConflict,
  sendInternalError,
  sendUnauthorized,
  sendValidationError,
} from "@/core/lib/errors";
import { UserSchema } from "@/domains/users/users.schema";
import z from "zod";
import { getSession } from "@/core/lib/utils";
import { authService } from "@/domains/auth/auth.service";
import { prisma } from "@/core/prisma";

const hasErrorCode = (
  value: unknown,
  code: string,
): value is { code: string } => {
  return (
    typeof value === "object" &&
    value !== null &&
    "code" in value &&
    (value as { code: unknown }).code === code
  );
};

export const signUpEmail = async (req: Request, res: Response) => {
  try {
    const result = await UserSchema.safeParseAsync(req.body);
    if (!result.success) {
      return sendValidationError(res, result.error);
    }
    const { token, user } = await authService.signUpEmail(result.data, req.headers);
    if (!token) {
      return sendInternalError(res, "SignUpEmail", "Failed to create user");
    }
    return res.status(201).json({
      message: "User successfully created.",
      user,
    });
  } catch (error: unknown) {

    if (
      hasErrorCode(error, "USER_ALREADY_EXISTS") ||
      (error instanceof Error && error.message.includes("exists"))
    ) {
      return sendConflict(res, "A user with this email already exists");
    }

    return sendInternalError(
      res,
      "SignUpEmail",
      error,
      "An unexpected error occurred during sign-up",
    );
  }
};

export const signInEmail = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const parsed = await UserSchema.omit({ name: true }).safeParseAsync(
      req.body
    );

    if (!parsed.success) {
      return sendValidationError(res, parsed.error);
    }

    const response = await authService.signInEmail(parsed.data, req.headers);

    if (!response.ok) {
      return sendUnauthorized(res, "Invalid email or password");
    }
    const cookies =
      response.headers.getSetCookie?.() ??
      response.headers.get("set-cookie");

    if (cookies) {
      res.setHeader("Set-Cookie", cookies);
    }

    const data: unknown = await response.json();

    const parsedData = z
      .object({
        user: z.object({
          id: z.string(),
          email: z.string(),
          name: z.string().optional(),
        }),
      })
      .safeParse(data);

    if (!parsedData.success) {
      return sendInternalError(res, "SignInEmail", "Invalid auth response");
    }

    const { user } = parsedData.data;

    return res.status(200).json({
      message: "User logged in successfully",
      user,
    });
  } catch (error: unknown) {
    if (
      error instanceof Error &&
      (error.message.includes("invalid") ||
        hasErrorCode(error, "INVALID_CREDENTIALS"))
    ) {
      return sendUnauthorized(res, "Invalid email or password");
    }

    return sendInternalError(res, "SignInEmail", error, "Unexpected error during sign-in");
  }
};

export const signOut = async (req: Request, res: Response): Promise<void> => {
  try {
    const session = await getSession(req.headers);
    if (!session) {
      sendUnauthorized(res, "User is not logged in");
      return;
    }

    const { success } = await authService.signOut(req.headers);
    if (!success) {
      sendInternalError(res, "SignOut", "Failed to sign out");
      return;
    }

    res.status(200).json({ message: "User logged out successfully" });
  } catch (error) {
    sendInternalError(res, "SignOut", error);
  }
};

export const getCurrentUserDetails = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const session = await getSession(req.headers);

    if (!session?.userId) {
      return res.status(200).json({ currentUser: null });
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        image: true,
        emailVerified: true,
      },
    });

    return res.status(200).json({ currentUser });
  } catch (error) {
    return sendInternalError(
      res,
      "GetCurrentUserDetails",
      error,
      "Unexpected error while fetching current user",
    );
  }
};