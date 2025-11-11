import { PrismaClient } from '@prisma/client';
import type { DatabaseClient } from './index';

export class PrismaDatabaseClient implements DatabaseClient {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async connect(): Promise<void> {
    await this.prisma.$connect();
  }

  async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
  }

  async transaction<T>(handler: () => Promise<T>): Promise<T> {
    return await this.prisma.$transaction(async () => {
      return await handler();
    });
  }

  getClient(): PrismaClient {
    return this.prisma;
  }
}

