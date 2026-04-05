import {PrismaClient} from '../../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { databaseUrl } from '@/core/env';
const pool = new PrismaPg({connectionString : databaseUrl!});
export const prisma = new PrismaClient({adapter : pool})