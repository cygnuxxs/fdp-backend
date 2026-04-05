import { prisma } from "@/core/prisma";

type CategoryBalance = {
  category: string;
  netBalance: number;
};

type TrendRow = {
  period: string;
  income: number;
  expense: number;
  netBalance: number;
};

export const getDashboardSummaryData = async () => {
  const incomeAndExpense = await prisma.financialRecord.groupBy({
    by: ["type"],
    where: {
      deletedAt: null,
    },
    _sum: { amount: true },
  });

  const totals = { INCOME: 0, EXPENSE: 0 };
  for (const data of incomeAndExpense) {
    totals[data.type] = data._sum.amount?.toNumber() ?? 0;
  }

  return {
    totalIncome: totals.INCOME,
    totalExpense: totals.EXPENSE,
    netBalance: totals.INCOME - totals.EXPENSE,
  };
};

export const getDashboardTrendsData = async () => {
  const [weeklyTrends, monthlyTrends] = await Promise.all([
    prisma.$queryRaw<TrendRow[]>`
  WITH weekly AS (
    SELECT
      date_trunc('week', date) as week_start,
      COALESCE(SUM(amount) FILTER (WHERE type = 'INCOME'), 0)::double precision as income,
      COALESCE(SUM(amount) FILTER (WHERE type = 'EXPENSE'), 0)::double precision as expense
    FROM "FinancialRecord"
    WHERE "deletedAt" IS NULL
    GROUP BY week_start
    ORDER BY week_start DESC
    LIMIT 8
  )
  SELECT
    to_char(week_start, 'IYYY-"W"IW') as period,
    income,
    expense,
    (income - expense)::double precision as "netBalance"
  FROM weekly
  ORDER BY week_start ASC;
`,
    prisma.$queryRaw<TrendRow[]>`
  WITH monthly AS (
    SELECT
      date_trunc('month', date) as month_start,
      COALESCE(SUM(amount) FILTER (WHERE type = 'INCOME'), 0)::double precision as income,
      COALESCE(SUM(amount) FILTER (WHERE type = 'EXPENSE'), 0)::double precision as expense
    FROM "FinancialRecord"
    WHERE "deletedAt" IS NULL
    GROUP BY month_start
    ORDER BY month_start DESC
    LIMIT 12
  )
  SELECT
    to_char(month_start, 'YYYY-MM') as period,
    income,
    expense,
    (income - expense)::double precision as "netBalance"
  FROM monthly
  ORDER BY month_start ASC;
`,
  ]);

  return {
    weeklyTrends,
    monthlyTrends,
  };
};

export const getDashboardRecentActivityData = async () => {
  const recentActivity = await prisma.financialRecord.findMany({
    where: {
      deletedAt: null,
    },
    select: {
      id: true,
      amount: true,
      type: true,
      category: true,
      date: true,
      notes: true,
    },
    orderBy: { date: "desc" },
    take: 10,
  });

  return {
    recentActivity,
  };
};

export const getDashboardCategoryWiseTotalsData = async () => {
  const categoryWiseBalances = await prisma.$queryRaw<CategoryBalance[]>`
  SELECT
    category,
    (
      COALESCE(SUM(amount) FILTER (WHERE type = 'INCOME'), 0) -
      COALESCE(SUM(amount) FILTER (WHERE type = 'EXPENSE'), 0)
    )::double precision as "netBalance"
  FROM "FinancialRecord"
  WHERE "deletedAt" IS NULL
  GROUP BY category
  ORDER BY "netBalance" DESC;
`;

  return {
    categoryWiseTotals: categoryWiseBalances.map((row) => ({
      category: row.category,
      netBalance: Number(row.netBalance),
    })),
  };
};

export const getDashboardData = async () => {
  const [summary, trends, recentActivity] = await Promise.all([
    getDashboardSummaryData(),
    getDashboardTrendsData(),
    getDashboardRecentActivityData(),
  ]);

  return {
    ...summary,
    ...trends,
    ...recentActivity,
  };
};
