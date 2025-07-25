import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@app/prisma/prisma.service';
import { CreatePickupPointDto } from './dto/create-pickup-point.dto';
import { UpdatePickupPointDto } from './dto/update-pickup-point.dto';
import { PickupPoint, Prisma } from '@prisma/client';
import { PickupPointQueryDto } from './dto/pickup-point-query-dto';

@Injectable()
export class PickupPointService {
  private readonly logger = new Logger(PickupPointService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(createDto: CreatePickupPointDto): Promise<PickupPoint> {
    try {
      return await this.prisma.pickupPoint.create({
        data: {
          ...createDto,
        },
      });
    } catch (error) {
      this.logger.error('Failed to create pickup point', error);
      throw new BadRequestException('Failed to create pickup point');
    }
  }

  async findAll(query: PickupPointQueryDto) {
    const where: Prisma.PickupPointWhereInput = {
      isActive: query.isActive ?? true,
      ...(query.county && { county: query.county }),
      ...(query.city && {
        city: {
          contains: query.city,
          mode: 'insensitive',
        },
      }),
      ...(query.type && { type: query.type }),
    };

    const {
      page = 1,
      limit = 10,
      sortBy = 'county',
      sortOrder = 'asc',
    } = query;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.pickupPoint.findMany({
        where,
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.pickupPoint.count({ where }),
    ]);

    return {
      data: {
        items,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    };
  }

  async findOne(id: string): Promise<PickupPoint> {
    const pickupPoint = await this.prisma.pickupPoint.findUnique({
      where: { id },
    });

    if (!pickupPoint)
      throw new NotFoundException(`Pickup Point with ID ${id} not found`);
    return pickupPoint;
  }

  async update(
    id: string,
    updateDto: UpdatePickupPointDto,
  ): Promise<PickupPoint> {
    try {
      const updated = await this.prisma.pickupPoint.update({
        where: { id },
        data: { ...updateDto },
      });
      return updated;
    } catch (error) {
      this.logger.error(`Failed to update pickup point with ID ${id}`, error);
      throw new BadRequestException('Failed to update pickup point');
    }
  }

  async remove(id: string): Promise<void> {
    try {
      await this.prisma.pickupPoint.delete({ where: { id } });
    } catch (error) {
      this.logger.error(`Failed to delete pickup point with ID ${id}`, error);
      throw new BadRequestException('Failed to delete pickup point');
    }
  }
}
