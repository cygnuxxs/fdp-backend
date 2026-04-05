import {
  isPrismaNotFoundError,
  sendBadRequest,
  sendInternalError,
  sendNotFound,
  sendUnauthorized,
  sendValidationError,
} from "@/core/lib/errors";
import {
  RecordSchema,
  RecordsFilterSchema,
  RecordsSchema,
  UpdateRecordSchema,
} from "@/domains/records/records.schema";
import { Prisma } from "../../../generated/prisma/client";
import { type Request, type Response } from "express";
import { getId, getSession } from "@/core/lib/utils";
import { recordsService } from "@/domains/records/records.service";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 100;

export const addRecord = async (req: Request, res: Response) => {
  try {
    const result = await RecordSchema.safeParseAsync(req.body);

    if (!result.success) {
      return sendValidationError(res, result.error);
    }

    const record = await recordsService.createRecord(result.data);

    return res.status(201).json({
      message: "Record created successfully",
      data: record,
    });
  } catch (err) {
    return sendInternalError(res, "AddRecord", err);
  }
};

export const addRecords = async (req: Request, res: Response) => {
  try {
    const result = await RecordsSchema.safeParseAsync(req.body);

    if (!result.success) {
      return sendValidationError(res, result.error);
    }

    const records = await recordsService.createMany(result.data);

    return res.status(201).json({
      message: "Records created successfully",
      count: records.count,
    });
  } catch (err) {
    return sendInternalError(res, "AddRecords", err);
  }
};

export const updateRecord = async (req: Request, res: Response) => {
  try {
    const id = getId(req, res);
    if (id === null) return;

    const existingRecord = await recordsService.findActiveById(id);

    if (!existingRecord) {
      return sendNotFound(res, "Record not found");
    }

    const result = await UpdateRecordSchema.safeParseAsync(req.body);

    if (!result.success) {
      return sendValidationError(res, result.error);
    }

    const updatedRecord = await recordsService.updateRecord(id, result.data);

    return res
      .status(200)
      .json({ message: "Record update was successful", record: updatedRecord });
  } catch (err) {
    if (isPrismaNotFoundError(err)) {
      return sendNotFound(res, "Record not found");
    }

    return sendInternalError(res, "UpdateRecord", err);
  }
};

export const deleteRecord = async (req: Request, res: Response) => {
  try {
    const id = getId(req, res);
    if (id === null) return;

    const session = await getSession(req.headers);
    if (!session?.userId) {
      return sendUnauthorized(res);
    }
    const { count } = await recordsService.softDeleteRecord(id, session.userId);

    if (count === 0) {
      return sendNotFound(res, "Record not found");
    }

    return res.status(200).json({
      message: "Record deletion was successful",
    });
  } catch (err) {
    if (isPrismaNotFoundError(err)) {
      return sendNotFound(res, "Record not found");
    }

    return sendInternalError(res, "DeleteRecord", err);
  }
};

export const fetchRecords = async (req: Request, res: Response) => {
  try {
    const category = req.query["category"]?.toString();
    const date = req.query["date"]?.toString();
    const type = req.query["type"]?.toString();
    const rawPage = req.query["page"];
    const rawLimit = req.query["limit"];

    const page = Number(rawPage ?? DEFAULT_PAGE);
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

    const parsed = await RecordsFilterSchema.safeParseAsync({
      category,
      date,
      type,
    });

    if (!parsed.success) {
      return sendValidationError(res, parsed.error, "Invalid query params");
    }

    const { category: cat, date: dt, type: tp } = parsed.data;

    const where: Prisma.FinancialRecordWhereInput = {
      deletedAt: null,
      ...(cat ? { category: cat } : {}),
      ...(tp ? { type: tp } : {}),
      ...(dt ? { date: recordsService.getDayRange(dt) } : {}),
    };

    const [total, records] = await recordsService.listRecords(
      where,
      skip,
      normalizedLimit,
    );

    const totalPages = Math.ceil(total / normalizedLimit);

    return res.status(200).json({
      message: records.length
        ? "Records fetched successfully"
        : "No records found",
      count: records.length,
      pagination: {
        page,
        limit: normalizedLimit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
      filters: recordsService.normalizeFilters(parsed.data),
      data: records,
    });
  } catch (error) {
    return sendInternalError(res, "FetchRecords", error);
  }
};
