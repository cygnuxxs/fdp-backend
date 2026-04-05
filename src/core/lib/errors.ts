import { type Response } from "express";
import { z, type ZodError } from "zod";

export const ERROR_MESSAGES = {
	BAD_REQUEST: "Bad request",
	VALIDATION_FAILED: "Validation failed",
	UNAUTHORIZED: "Unauthorized",
	FORBIDDEN: "Forbidden",
	NOT_FOUND: "Resource not found",
	CONFLICT: "Resource conflict",
	INTERNAL_SERVER_ERROR: "Internal server error",
} as const;

type ErrorDetails = Record<string, unknown>;

export const sendError = (
	res: Response,
	statusCode: number,
	message: string,
	details?: ErrorDetails,
) =>
	res.status(statusCode).json({
		message,
		...(details ? { details } : {}),
	});

export const sendBadRequest = (
	res: Response,
	message: string = ERROR_MESSAGES.BAD_REQUEST,
	details?: ErrorDetails,
) => sendError(res, 400, message, details);

export const sendUnauthorized = (
	res: Response,
	message: string = ERROR_MESSAGES.UNAUTHORIZED,
	details?: ErrorDetails,
) => sendError(res, 401, message, details);

export const sendForbidden = (
	res: Response,
	message: string = ERROR_MESSAGES.FORBIDDEN,
	details?: ErrorDetails,
) => sendError(res, 403, message, details);

export const sendNotFound = (
	res: Response,
	message: string = ERROR_MESSAGES.NOT_FOUND,
	details?: ErrorDetails,
) => sendError(res, 404, message, details);

export const sendConflict = (
	res: Response,
	message: string = ERROR_MESSAGES.CONFLICT,
	details?: ErrorDetails,
) => sendError(res, 409, message, details);

export const sendValidationError = (
	res: Response,
	error: ZodError,
	message: string = ERROR_MESSAGES.VALIDATION_FAILED,
) => sendError(res, 422, message, { issues: z.treeifyError(error) });

export const sendInternalError = (
	res: Response,
	scope: string,
	err: unknown,
	message: string = ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
) => {
	console.error(`${scope} Error:`, err);
	return sendError(res, 500, message);
};

export const isPrismaNotFoundError = (err: unknown): err is { code: string } =>
	typeof err === "object" &&
	err !== null &&
	"code" in err &&
	(err as { code?: unknown }).code === "P2025";
