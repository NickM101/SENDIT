// src/modules/parcel/services/parcel-recipient.service.ts
import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '@app/prisma/prisma.service';

@Injectable()
export class ParcelRecipientService {
  private readonly logger = new Logger(ParcelRecipientService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get saved recipients for user
   */
  async getSavedRecipients(userId: string) {
    try {
      return await this.prisma.savedRecipient.findMany({
        where: { userId },
        include: {
          address: true,
        },
        orderBy: { lastUsed: 'desc' },
      });
    } catch (error) {
      this.logger.error(
        `Failed to get saved recipients for user ${userId}`,
        error,
      );
      throw new BadRequestException('Failed to retrieve saved recipients');
    }
  }
  /**
   * Save recipient details
   */

}
