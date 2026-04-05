import { type Request, type Response, type NextFunction } from "express";
import { sendForbidden, sendUnauthorized } from "@/core/lib/errors";
import {
  getPermissionsForRole,
} from "@/core/lib/roles-and-permissions";
import { getSession } from "@/core/lib/utils";
import { Role } from "../../../generated/prisma/enums";

export const authorize = (requiredRole: Role) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    type TestRequest = Request & {
      __testSession?: Awaited<ReturnType<typeof getSession>>;
    };

    // Support test mode by checking for injected session
    let session = (req as TestRequest).__testSession;
    if (!session) {
      session = await getSession(req.headers);
    }

    if (!session) {
      sendUnauthorized(res, "User is not logged in", {userRole : null});
      return;
    }

    const roleFromSession = session.role;

    if (!roleFromSession || !Object.values(Role).includes(roleFromSession as Role)) {
      sendUnauthorized(res);
      return;
    }

    const userRole = roleFromSession as Role;

    const requiredPermissions = getPermissionsForRole(requiredRole);
    const userPermissions = getPermissionsForRole(userRole);

    const hasAccess = requiredPermissions.every((permission) =>
      userPermissions.includes(permission)
    );

    if (!hasAccess) {
      sendForbidden(res, "Forbidden, Requires admin level access", {currentRole : session.role});
      return;
    }

    next();
  };
};