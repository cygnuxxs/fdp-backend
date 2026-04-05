import { prisma } from "@/core/prisma";
import type { Prisma } from "../../../generated/prisma/client";
import type {
  RecordInput,
  RecordsFilterInput,
  UpdateRecordInput,
} from "@/domains/records/records.schema";

const toFinancialRecordData = (record: RecordInput) => ({
  category: record.category,
  type: record.type,
  amount: record.amount,
  notes: record.notes ?? null,
  ...(record.date !== undefined ? { date: record.date } : {}),
});

const toFinancialRecordUpdateData = (data: UpdateRecordInput) => {
  const updateData: {
    category?: string;
    date?: Date;
    type?: RecordInput["type"];
    amount?: number;
    notes?: string | null;
  } = {};

  if (data.category !== undefined) updateData.category = data.category;
  if (data.date !== undefined) updateData.date = data.date;
  if (data.type !== undefined) updateData.type = data.type;
  if (data.amount !== undefined) updateData.amount = data.amount;
  if (data.notes !== undefined) updateData.notes = data.notes;

  return updateData;
};

export const recordsService = {
  createRecord(data: RecordInput) {
    return prisma.financialRecord.create({
      data: toFinancialRecordData(data),
    });
  },

  createMany(data: RecordInput[]) {
    return prisma.financialRecord.createMany({
      data: data.map(toFinancialRecordData),
    });
  },

  findActiveById(id: number) {
    return prisma.financialRecord.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });
  },

  updateRecord(id: number, data: UpdateRecordInput) {
    return prisma.financialRecord.update({
      where: { id },
      data: toFinancialRecordUpdateData(data),
    });
  },

  softDeleteRecord(id: number, userId: string) {
    if (!userId.trim()) {
      return Promise.resolve({ count: 0 });
    }

    return prisma.financialRecord.updateMany({
      where: {
        id,
        deletedAt: null,
      },
      data: {
        deletedAt: new Date(),
        deletedBy: userId,
      },
    });
  },

  listRecords(where: Prisma.FinancialRecordWhereInput, skip: number, take: number) {
    return prisma.$transaction([
      prisma.financialRecord.count({ where }),
      prisma.financialRecord.findMany({
        where,
        skip,
        take,
        select: {
          id: true,
          amount: true,
          type: true,
          category: true,
          date: true,
          notes: true,
        },
        orderBy: {
          date: "desc",
        },
      }),
    ]);
  },

  getDayRange(date: Date) {
    const start = new Date(date);
    const end = new Date(date);

    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    return { gte: start, lte: end };
  },

  normalizeFilters(filters: RecordsFilterInput) {
    const { category, date, type } = filters;

    return {
      category: category ?? null,
      date: date ? date.toISOString() : null,
      type: type ?? null,
    };
  },
};