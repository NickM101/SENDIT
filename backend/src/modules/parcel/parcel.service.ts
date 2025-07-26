// src/modules/parcel/parcel.service.ts
import {
  Injectable,
  Logger,
} from '@nestjs/common';
import {
  Parcel,
  ParcelStatus,
} from '@prisma/client';
import { ParcelDraftDto, SenderDetailsDto, RecipientDetailsDto, ParcelDetailsDto, DeliveryOptionsDto, CreateParcelDto } from './dto/parcel.dto';
import { ParcelAssignmentService } from './services/parcel-assignment.service';
import { ParcelCreationService } from './services/parcel-creation.service';
import { ParcelQueryService } from './services/parcel-query.service';
import { ParcelRecipientService } from './services/parcel-recipient.service';
import { ParcelTrackingService } from './services/parcel-tracking.service';
import { PickupPointService } from '../pickup-point/pickup-point.service';
import { PickupPointQueryDto } from '../pickup-point/dto/pickup-point-query-dto';
@Injectable()
export class ParcelService {
  private readonly logger = new Logger(ParcelService.name);

  constructor(
    private readonly parcelCreationService: ParcelCreationService,
    private readonly parcelAssignmentService: ParcelAssignmentService,
    private readonly parcelTrackingService: ParcelTrackingService,
    private readonly parcelQueryService: ParcelQueryService,
    private readonly parcelRecipientService: ParcelRecipientService,
    private readonly parcelDeliveryPointService: PickupPointService,
  ) {}

  // --- Draft Handling (Orchestrator Functions) ---
  async saveParcelDraft(
    userId: string,
    draftData: ParcelDraftDto,
  ): Promise<void> {
    return this.parcelCreationService.saveParcelDraft(userId, draftData);
  }

  async getParcelDraft(userId: string) {
    return this.parcelCreationService.getParcelDraft(userId);
  }

  async deleteParcelDraft(userId: string): Promise<void> {
    return this.parcelCreationService.deleteParcelDraft(userId);
  }

  // --- Pricing (Orchestrator Function) ---
  async calculatePricing(
    senderData: SenderDetailsDto,
    recipientData: RecipientDetailsDto,
    parcelData: ParcelDetailsDto,
    deliveryData: DeliveryOptionsDto,
  ) {
    return this.parcelCreationService.calculatePricing(
      senderData,
      recipientData,
      parcelData,
      deliveryData,
    );
  }

  // --- Main Creation (Delegator) ---
  async createParcel(
    userId: string,
    createParcelDto: CreateParcelDto,
  ): Promise<Parcel> {
    // Delegate the complex creation logic to the specialized service
    return this.parcelCreationService.createParcel(userId, createParcelDto);
  }

  // --- Parcel Retrieval (Delegator) ---
  async getParcelByTrackingNumber(trackingNumber: string): Promise<Parcel> {
    return this.parcelTrackingService.getParcelByTrackingNumber(trackingNumber);
  }

  // --- Parcel Listing (Delegator) ---
  async getParcelsByUser(
    userId: string,
    page = 1,
    limit = 10,
    status?: ParcelStatus,
    trackingNumber?: string,
    startDate?: string,
    endDate?: string,
  ) {
    return this.parcelQueryService.getParcelsByUser(
      userId,
      page,
      limit,
      status,
      trackingNumber,
      startDate,
      endDate,
    );
  }

  async getParcelsForAssignment(query: {
    page?: number;
    limit?: number;
    status?: string;
    startDate?: string;
    endDate?: string;
  }) {
    return this.parcelQueryService.getParcelsForAssignment(query);
  }

  // --- Status Update (Delegator) ---
  async updateParcelStatus(
    parcelId: string,
    status: ParcelStatus,
    description?: string,
    location?: string,
    updatedBy?: string,
  ): Promise<void> {
    // Delegate to the tracking service for status updates
    return this.parcelTrackingService.updateParcelStatus(
      parcelId,
      status,
      description,
      location,
      updatedBy,
    );
  }

  // --- Assignment (Delegator) ---
  async assignCourier(
    parcelId: string,
    courierId: string,
    adminId: string,
    instructions?: string,
  ): Promise<Parcel> {
    // Delegate the complex assignment logic to the specialized service
    return this.parcelAssignmentService.assignCourier(
      parcelId,
      courierId,
      adminId,
      instructions,
    );
  }

  // --- Recipient Management (Delegator) ---
  async getSavedRecipients(userId: string) {
    return this.parcelRecipientService.getSavedRecipients(userId);
  }

  // --- Delivery Points (Delegator) ---
  async getDeliveryPoints(filters: PickupPointQueryDto) {
    return this.parcelDeliveryPointService.findAll(filters);
  }

  // --- Courier Workload (Delegator) ---
  async getCourierWorkload(courierId?: string) {
    return this.parcelTrackingService.getCourierWorkload(courierId);
  }
}
