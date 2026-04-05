import {
  sendBadRequest,
  sendInternalError,
  sendNotFound,
  sendValidationError,
  isPrismaNotFoundError,
} from "@/core/lib/errors";
import { getUserId } from "@/core/lib/utils";
import { UpdateUserPatchSchema } from "@/domains/users/users.schema";
import { Prisma } from "../../../generated/prisma/client";
import { type Request, type Response } from "express";
import { signUpEmail } from "@/domains/auth/auth.controller";
import { usersService } from "@/domains/users/users.service";

const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 100;

export const addUser = signUpEmail;

export const fetchUsers = async (req: Request, res: Response) => {
  try {
    const rawPage = req.query["page"];
    const rawLimit = req.query["limit"];
    const searchQuery = req.query["search"]?.toString().trim();

    const page = Number(rawPage ?? 1);
    const limit = Number(rawLimit ?? DEFAULT_LIMIT);

    if (!Number.isInteger(page) || page < 1) {
      return sendBadRequest(
        res,
        "Page must be an integer greater than or equal to 1",
      );
    }

    if (!Number.isInteger(limit) || limit < 1) {
      return sendBadRequest(
        res,
        "Limit must be an integer greater than or equal to 1",
      );
    }

    const normalizedLimit = Math.min(limit, MAX_LIMIT);
    const skip = (page - 1) * normalizedLimit;

    const where: Prisma.UserWhereInput = searchQuery
      ? {
          OR: [
            {
              name: {
                contains: searchQuery,
                mode: "insensitive",
              },
            },
            {
              email: {
                contains: searchQuery,
                mode: "insensitive",
              },
            },
          ],
        }
      : {};

    const [total, users] = await usersService.listUsers(where, skip, normalizedLimit);

    const totalPages = Math.ceil(total / normalizedLimit);

    return res.status(200).json({
      message: users.length ? "Users fetched successfully" : "No users found",
      data: users,
      filters: {
        search: searchQuery ?? null,
      },
      pagination: {
        page,
        limit: normalizedLimit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });
  } catch (err) {
    return sendInternalError(res, "GetUsers", err);
  }
};

export const updateUser = async (req : Request, res : Response) => {
    try {
        const id = getUserId(req, res);
        if (id === null) return;

        const parsedData = await UpdateUserPatchSchema.safeParseAsync(req.body);

        if (!parsedData.success) {
          return sendValidationError(res, parsedData.error);
        }

        const updatedUser = await usersService.updateUser(id, parsedData.data);

        return res.status(200).json({
          message: "User updated successfully",
          user: updatedUser,
        });
    } catch (err) {
        if (isPrismaNotFoundError(err)) {
          return sendNotFound(res, "User not found");
        }

        return sendInternalError(res, "UpdateUsers", err);
    }
}

export const deleteUser = async (req : Request, res : Response) => {
    try {
        const id = getUserId(req, res);
        if (id === null) return;
        await usersService.deleteUser(id);
        return res.status(200).json({
          message: "User deleted successfully",
        });
    } catch (err) {
        if (isPrismaNotFoundError(err)) {
          return sendNotFound(res, "User not found");
        }

        return sendInternalError(res, "DeleteUser", err);
    }
}