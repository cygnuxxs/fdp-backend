import { recordsService } from "../../../src/domains/records/records.service";
import { FinancialRecordType } from "../../../generated/prisma/enums";
import { cleanDatabase } from "../../helpers/db.helper";

describe("Records Service", () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  it("creates a record and keeps notes as null when omitted", async () => {
    const record = await recordsService.createRecord({
      amount: 500,
      category: "Testing",
      date: new Date(),
      type: FinancialRecordType.INCOME,
    });

    expect(Number(record.amount)).toBe(500);
    expect(record.notes).toBeNull();
  });
});
