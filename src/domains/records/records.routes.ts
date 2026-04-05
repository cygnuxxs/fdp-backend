import {
  addRecord,
  addRecords,
  deleteRecord,
  fetchRecords,
  updateRecord,
} from "@/domains/records/records.controller";
import { authorize } from "@/core/middleware/authorize.middleware";
import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";

const recordsRouter: Router = Router();
const adminRecordsRouter: Router = Router();

// Analyst Routes
recordsRouter.use(authorize(Role.ANALYST));
recordsRouter.get("/", fetchRecords);

// Admin Routes
adminRecordsRouter.use(authorize(Role.ADMIN));
adminRecordsRouter.post("/", addRecord);
adminRecordsRouter.post("/batch", addRecords);
adminRecordsRouter.patch("/:id", updateRecord);
adminRecordsRouter.delete("/:id", deleteRecord);

recordsRouter.use(adminRecordsRouter);

export default recordsRouter