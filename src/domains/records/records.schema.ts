import { z } from "zod";
import { FinancialRecordType as PrismaFinancialRecordType } from "../../../generated/prisma/enums";

const FinancialRecordType = z.enum(PrismaFinancialRecordType);

export const RecordSchema = z
  .object({
    category: z.string({ error: "Category is required" }),
    date: z.coerce.date({ error: "Invalid Date format" }).optional(),
    type: FinancialRecordType,
    notes: z
      .string()
      .max(500, { error: "Notes cannot exceed 500 characters" })
      .trim()
      .optional(),
    amount: z
      .number({ error: "Amount must be number" })
      .positive("Amount must be greater than 0"),
  })
  .strict();

export const RecordsSchema = z
  .array(RecordSchema)
  .max(1000, { error: "Batch Creation Limit for Records is 1000" });

export const UpdateRecordSchema = RecordSchema.partial()
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    error: "At least one field must be provided",
  });

export type RecordInput = z.infer<typeof RecordSchema>;

export const RecordsFilterSchema = z.object({
  date: z.coerce.date({ error: "Invalid Date format" }),
  category: z.string({ error: "Category is required" }),
  type: FinancialRecordType,
}).partial().strict();

export type UpdateRecordInput = z.infer<typeof UpdateRecordSchema>;
export type RecordsFilterInput = z.infer<typeof RecordsFilterSchema>;
