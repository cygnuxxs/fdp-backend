import { FinancialRecordType } from "../../generated/prisma/enums";

export const testRecords = {
  income: {
    amount: 5000.0,
    type: FinancialRecordType.INCOME,
    category: "Salary",
    notes: "Monthly salary",
    date: new Date(),
  },
  expense: {
    amount: 1500.0,
    type: FinancialRecordType.EXPENSE,
    category: "Rent",
    notes: "Monthly rent",
    date: new Date(),
  },
  bonus: {
    amount: 2000.0,
    type: FinancialRecordType.INCOME,
    category: "Bonus",
    notes: "Annual bonus",
    date: new Date(),
  },
  utilities: {
    amount: 200.0,
    type: FinancialRecordType.EXPENSE,
    category: "Utilities",
    notes: "Electricity and water",
    date: new Date(),
  },
};

export const batchRecords = [
  testRecords.income,
  testRecords.expense,
  testRecords.bonus,
];

export const invalidRecord = {
  amount: -100, // Invalid negative amount
  type: FinancialRecordType.INCOME,
  category: "Invalid",
};
