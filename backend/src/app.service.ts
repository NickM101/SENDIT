import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Injectable()
export class AppService {
  constructor(private prisma: PrismaService) {}

  async getDatabaseStatus() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        status: 'Connected',
        message: 'Database connection successful!',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'Error',
        message: 'Database connection failed!',
        error: (error as Error).message,
        timestamp: new Date().toISOString(),
      };
    }
  }
}
