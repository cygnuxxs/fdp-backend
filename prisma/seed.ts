import { FinancialRecordType, Role } from "../generated/prisma/enums";
import { auth } from "../src/core/auth-config";
import { prisma } from "../src/core/prisma";

type SeedUser = {
  name: string;
  email: string;
  password: string;
  role: Role;
};

const usersToSeed: SeedUser[] = [
  {
    name: "ashok",
    email: "ashok@gmail.com",
    password: "AshokAtragadda",
    role: Role.ADMIN,
  },
  {
    name: "bharani",
    email: "bharani@gmail.com",
    password: "BharaniRayudu",
    role: Role.ANALYST,
  },
  {
    name: "viewer",
    email: "viewer@gmail.com",
    password: "Viewer4220",
    role: Role.VIEWER,
  },
];

type SeedFinancialRecord = {
  amount: string;
  type: FinancialRecordType;
  category: string;
  date: Date;
  notes: string;
};

const financialRecordsToSeed: SeedFinancialRecord[] = [
  {
    amount: "120000.00",
    type: FinancialRecordType.INCOME,
    category: "Salary",
    date: new Date("2026-01-05T09:00:00.000Z"),
    notes: "Monthly salary credit",
  },
  {
    amount: "15000.00",
    type: FinancialRecordType.INCOME,
    category: "Freelance",
    date: new Date("2026-01-12T10:30:00.000Z"),
    notes: "Consulting payout",
  },
  {
    amount: "3500.00",
    type: FinancialRecordType.EXPENSE,
    category: "Groceries",
    date: new Date("2026-01-10T16:45:00.000Z"),
    notes: "Weekly supermarket run",
  },
  {
    amount: "2200.00",
    type: FinancialRecordType.EXPENSE,
    category: "Utilities",
    date: new Date("2026-01-18T08:20:00.000Z"),
    notes: "Electricity and internet bills",
  },
  {
    amount: "8000.00",
    type: FinancialRecordType.EXPENSE,
    category: "Rent",
    date: new Date("2026-01-03T06:00:00.000Z"),
    notes: "Monthly house rent",
  },
  {
    amount: "125000.00",
    type: FinancialRecordType.INCOME,
    category: "Salary",
    date: new Date("2026-02-05T09:00:00.000Z"),
    notes: "Monthly salary credit",
  },
  {
    amount: "5500.00",
    type: FinancialRecordType.EXPENSE,
    category: "Travel",
    date: new Date("2026-02-09T14:10:00.000Z"),
    notes: "Business trip expenses",
  },
  {
    amount: "4200.00",
    type: FinancialRecordType.EXPENSE,
    category: "Insurance",
    date: new Date("2026-02-15T10:00:00.000Z"),
    notes: "Health insurance premium",
  },
  {
    amount: "18000.00",
    type: FinancialRecordType.INCOME,
    category: "Bonus",
    date: new Date("2026-02-26T11:30:00.000Z"),
    notes: "Quarterly performance bonus",
  },
  {
    amount: "3100.00",
    type: FinancialRecordType.EXPENSE,
    category: "Subscriptions",
    date: new Date("2026-02-28T07:30:00.000Z"),
    notes: "Tooling and software subscriptions",
  },
  {
    amount: "123500.00",
    type: FinancialRecordType.INCOME,
    category: "Salary",
    date: new Date("2026-03-05T09:00:00.000Z"),
    notes: "Monthly salary credit",
  },
  {
    amount: "6700.00",
    type: FinancialRecordType.EXPENSE,
    category: "Medical",
    date: new Date("2026-03-09T12:15:00.000Z"),
    notes: "Medical checkup and medicines",
  },
  {
    amount: "2600.00",
    type: FinancialRecordType.EXPENSE,
    category: "Dining",
    date: new Date("2026-03-13T19:40:00.000Z"),
    notes: "Client dinner",
  },
  {
    amount: "14000.00",
    type: FinancialRecordType.INCOME,
    category: "Investment",
    date: new Date("2026-03-21T13:25:00.000Z"),
    notes: "Mutual fund redemption",
  },
  {
    amount: "4800.00",
    type: FinancialRecordType.EXPENSE,
    category: "Transport",
    date: new Date("2026-03-29T09:10:00.000Z"),
    notes: "Fuel and maintenance",
  },
];

async function recreateUserWithCredentials(user: SeedUser): Promise<void> {
  const existingUser = await prisma.user.findUnique({
    where: { email: user.email },
    select: { id: true },
  });

  if (existingUser) {
    // Recreate the user to guarantee the known password from this seed.
    await prisma.session.deleteMany({ where: { userId: existingUser.id } });
    await prisma.account.deleteMany({ where: { userId: existingUser.id } });
    await prisma.user.delete({ where: { id: existingUser.id } });
  }

  const { user: createdUser } = await auth.api.signUpEmail({
    body: {
      email: user.email,
      name: user.name,
      password: user.password,
    },
    headers: {},
  });

  if (user.role !== Role.VIEWER) {
    await prisma.user.update({
      where: { id: createdUser.id },
      data: { role: user.role },
    });
  }
}

export async function seed(): Promise<void> {
  for (const user of usersToSeed) {
    await recreateUserWithCredentials(user);
    console.log(`Seeded ${user.role} user: ${user.email}`);
  }

  // Replace seeded financial records so reruns remain deterministic.
  await prisma.financialRecord.deleteMany({});
  await prisma.financialRecord.createMany({
    data: financialRecordsToSeed,
  });
  console.log(`Seeded ${financialRecordsToSeed.length} financial records`);
}

seed()
  .catch((error) => {
    console.error("Database seeding failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
