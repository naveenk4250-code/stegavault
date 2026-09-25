import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    // Use DIRECT_URL (port 5432, no pgbouncer) for the runtime pg adapter.
    // The ?pgbouncer=true flag in DATABASE_URL is Prisma-CLI-only and is NOT
    // understood by the pg driver — it causes INSERT/UPDATE to fail with 500
    // while SELECT queries still work (which is exactly the symptom seen).
    // DIRECT_URL bypasses PgBouncer and gives a reliable direct connection.
    const raw = process.env.DIRECT_URL || process.env.DATABASE_URL || '';
    const connectionString = raw
      .replace('?pgbouncer=true', '')
      .replace('&pgbouncer=true', '');
    const adapter = new PrismaPg({ connectionString });
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
