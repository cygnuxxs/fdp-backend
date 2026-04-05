import {
	dashboardCategoryWiseTotalsController,
	dashboardController,
	dashboardRecentActivityController,
	dashboardSummaryController,
	dashboardTrendsController,
} from "@/domains/dashboard/dashboard.controller";
import { authorize } from "@/core/middleware/authorize.middleware";
import { Role } from "../../../generated/prisma/enums";
import { Router } from "express";

const dashboardRouter: Router = Router();

dashboardRouter.get("/", dashboardController);
dashboardRouter.get("/summary", dashboardSummaryController);
dashboardRouter.get("/trends", dashboardTrendsController);
dashboardRouter.get("/recent-activity", dashboardRecentActivityController);
dashboardRouter.get(
	"/category-wise-totals",
	authorize(Role.ANALYST),
	dashboardCategoryWiseTotalsController,
);

export default dashboardRouter;
