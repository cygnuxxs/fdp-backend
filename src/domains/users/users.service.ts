import { prisma } from "@/core/prisma";
import type { Prisma } from "../../../generated/prisma/client";
import type { UpdateUserPatchInput } from "@/domains/users/users.schema";

const toUserUpdateData = (data: UpdateUserPatchInput) => {
  const updateData: Prisma.UserUpdateInput = {};

  if (data.name !== undefined) updateData.name = data.name;
  if (data.email !== undefined) updateData.email = data.email;
  if (data.role !== undefined) updateData.role = data.role;
  if (data.status !== undefined) updateData.status = data.status;

  return updateData;
};

export const usersService = {
  listUsers(where: Prisma.UserWhereInput, skip: number, take: number) {
    return prisma.$transaction([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          status: true,
          emailVerified: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
    ]);
  },

  updateUser(id: string, data: UpdateUserPatchInput) {
    return prisma.user.update({
      where: { id },
      data: toUserUpdateData(data),
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        emailVerified: true,
        image: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  },

  deleteUser(id: string) {
    return prisma.user.delete({ where: { id } });
  },
};