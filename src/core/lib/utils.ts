import { auth } from "@/core/auth-config";
import { fromNodeHeaders } from "better-auth/node";
import type { IncomingHttpHeaders } from "node:http";
import { type Request, type Response } from "express";
import { sendBadRequest } from "@/core/lib/errors";

export const getId = (req: Request, res: Response): number | null => {
  const id = Number(req.params["id"]);

  if (Number.isNaN(id)) {
    sendBadRequest(res, "Invalid record ID");
    return null;
  }

  return id;
};

export const getUserId = (req: Request, res: Response): string | null => {
  const id = req.params["id"];

  if (typeof id !== "string" || id.trim().length === 0) {
    sendBadRequest(res, "Invalid user ID");
    return null;
  }

  return id;
};


export async function getSession (headers : IncomingHttpHeaders) {
        const session = await auth.api.getSession({headers : fromNodeHeaders(headers)})
    return session
}