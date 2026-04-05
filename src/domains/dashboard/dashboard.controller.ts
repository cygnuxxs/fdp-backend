import {
    getDashboardCategoryWiseTotalsData,
    getDashboardData,
    getDashboardRecentActivityData,
    getDashboardSummaryData,
    getDashboardTrendsData,
} from "@/domains/dashboard/dashboard.service";
import { type Request, type Response } from "express";

export const dashboardController = async (_req: Request, res: Response) => {
    const data = await getDashboardData();
    return res.status(200).json({ ...data });
};

export const dashboardSummaryController = async (
    _req: Request,
    res: Response,
) => {
    const summary = await getDashboardSummaryData();
    return res.status(200).json(summary);
};

export const dashboardTrendsController = async (_req: Request, res: Response) => {
    const trends = await getDashboardTrendsData();
    return res.status(200).json(trends);
};

export const dashboardRecentActivityController = async (
    _req: Request,
    res: Response,
) => {
    const recentActivity = await getDashboardRecentActivityData();
    return res.status(200).json(recentActivity);
};

export const dashboardCategoryWiseTotalsController = async (
    _req: Request,
    res: Response,
) => {
    const categoryWiseTotals = await getDashboardCategoryWiseTotalsData();
    return res.status(200).json(categoryWiseTotals);
};