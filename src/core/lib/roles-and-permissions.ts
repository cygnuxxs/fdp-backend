import { Role } from "../../../generated/prisma/enums";


export const PERMISSIONS = {
  READ_RECORDS: "records:read",
  CREATE_RECORDS: "records:create",
  UPDATE_RECORDS: "records:update",
  DELETE_RECORDS: "records:delete",
  READ_SUMMARIES: "summaries:read",
  FULL_MANAGEMENT: "management:full",
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [Role.VIEWER]: [
    PERMISSIONS.READ_RECORDS,
  ],
  [Role.ANALYST]: [
    PERMISSIONS.READ_RECORDS,
    PERMISSIONS.READ_SUMMARIES,
  ],
  [Role.ADMIN]: [
    PERMISSIONS.READ_RECORDS,
    PERMISSIONS.CREATE_RECORDS,
    PERMISSIONS.UPDATE_RECORDS,
    PERMISSIONS.DELETE_RECORDS,
    PERMISSIONS.READ_SUMMARIES,
    PERMISSIONS.FULL_MANAGEMENT,
  ],
};

export const getPermissionsForRole = (role: Role): Permission[] =>
  ROLE_PERMISSIONS[role] ?? [];