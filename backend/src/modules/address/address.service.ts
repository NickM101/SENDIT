// src/modules/address/address.service.ts
import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { PrismaService } from '@app/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { Address, KenyanCounty } from '@prisma/client';
import { firstValueFrom } from 'rxjs';

export interface GeocodeResult {
  latitude: number;
  longitude: number;
  formattedAddress: string;
  street?: string;
  area?: string;
  city?: string;
  county?: KenyanCounty;
  state?: string;
  zipCode?: string;
  country: string;
}

export interface NominatimResponse {
  lat: string;
  lon: string;
  display_name: string;
  address?: {
    road?: string;
    house_number?: string;
    suburb?: string;
    neighbourhood?: string;
    quarter?: string;
    city?: string;
    town?: string;
    village?: string;
    county?: string;
    state?: string;
    country?: string;
    postcode?: string;
  };
}

export interface CreateAddressDto {
  name?: string;
  email?: string;
  phone?: string;
  street: string;
  area: string;
  city: string;
  county: KenyanCounty;
  state: string;
  zipCode: string;
  country?: string;
  latitude?: number;
  longitude?: number;
}

export interface ValidateAddressDto {
  street: string;
  area: string;
  city: string;
  county: KenyanCounty;
  country?: string;
}

@Injectable()
export class AddressService {
  private readonly logger = new Logger(AddressService.name);
  private readonly nominatimBaseUrl = 'https://nominatim.openstreetmap.org';
  private readonly kenyaBounds = {
    south: -4.89,
    north: 5.89,
    west: 33.89,
    east: 41.89,
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Geocode an address using OpenStreetMap Nominatim
   */
  async geocodeAddress(address: string): Promise<GeocodeResult[]> {
    try {
      this.logger.log(`Geocoding address: ${address}`);

      const params = {
        format: 'json',
        q: `${address}, Kenya`,
        countrycodes: 'ke',
        limit: '5',
        addressdetails: '1',
        bounded: '1',
        viewbox: `${this.kenyaBounds.west},${this.kenyaBounds.south},${this.kenyaBounds.east},${this.kenyaBounds.north}`,
      };

      const url = `${this.nominatimBaseUrl}/search`;
      const response = await firstValueFrom(
        this.httpService.get<NominatimResponse[]>(url, {
          params,
          headers: {
            'User-Agent': 'SendIT-Courier-Service/1.0',
          },
        }),
      );

      const results = response.data.map((item) =>
        this.parseNominatimResult(item),
      );

      this.logger.log(`Found ${results.length} geocoding results`);
      return results;
    } catch (error) {
      this.logger.error(`Geocoding failed for address: ${address}`, error);
      throw new BadRequestException('Failed to geocode address');
    }
  }

  /**
   * Reverse geocode coordinates to get address
   */
  async reverseGeocode(
    latitude: number,
    longitude: number,
  ): Promise<GeocodeResult> {
    try {
      this.logger.log(`Reverse geocoding: ${latitude}, ${longitude}`);

      // Check if coordinates are within Kenya bounds
      if (!this.isWithinKenyaBounds(latitude, longitude)) {
        throw new BadRequestException('Coordinates are outside Kenya');
      }

      const params = {
        format: 'json',
        lat: latitude.toString(),
        lon: longitude.toString(),
        addressdetails: '1',
      };

      const url = `${this.nominatimBaseUrl}/reverse`;
      const response = await firstValueFrom(
        this.httpService.get<NominatimResponse>(url, {
          params,
          headers: {
            'User-Agent': 'SendIT-Courier-Service/1.0',
          },
        }),
      );

      const result = this.parseNominatimResult(response.data);
      this.logger.log(`Reverse geocoding successful`);
      return result;
    } catch (error) {
      this.logger.error(
        `Reverse geocoding failed for coordinates: ${latitude}, ${longitude}`,
        error,
      );
      throw new BadRequestException('Failed to reverse geocode coordinates');
    }
  }

  /**
   * Validate and geocode address, save to database if valid
   */
  async validateAndCreateAddress(
    addressDto: CreateAddressDto,
    userId?: string,
  ): Promise<Address> {
    try {
      let latitude = addressDto.latitude;
      let longitude = addressDto.longitude;
      let isValidated = false;

      // If coordinates not provided, geocode the address
      if (!latitude || !longitude) {
        const fullAddress = `${addressDto.street}, ${addressDto.area}, ${addressDto.city}, ${addressDto.county}`;
        const geocodeResults = await this.geocodeAddress(fullAddress);

        if (geocodeResults.length === 0) {
          throw new BadRequestException(
            'Address could not be found or validated',
          );
        }

        // Use the first (best) result
        const bestResult = geocodeResults[0];
        latitude = bestResult.latitude;
        longitude = bestResult.longitude;
        isValidated = true;
      }

      // Create address in database
      const address = await this.prisma.address.create({
        data: {
          name: addressDto.name || `${addressDto.street}, ${addressDto.city}`,
          email: addressDto.email,
          phone: addressDto.phone,
          street: addressDto.street,
          area: addressDto.area,
          city: addressDto.city,
          county: addressDto.county,
          state: addressDto.state,
          zipCode: addressDto.zipCode,
          country: addressDto.country || 'Kenya',
          latitude,
          longitude,
          isValidated,
          validatedAt: isValidated ? new Date() : null,
          createdBy: userId,
        },
      });

      this.logger.log(`Address created with ID: ${address.id}`);
      return address;
    } catch (error) {
      this.logger.error('Failed to validate and create address', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to create address');
    }
  }

  /**
   * Get addresses by user (for address book functionality)
   */
  async getAddressesByUser(userId: string): Promise<Address[]> {
    return this.prisma.address.findMany({
      where: {
        createdBy: userId,
        deletedAt: null,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });
  }

  /**
   * Search addresses by query
   */
  async searchAddresses(query: string, limit = 10): Promise<Address[]> {
    return this.prisma.address.findMany({
      where: {
        deletedAt: null,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { street: { contains: query, mode: 'insensitive' } },
          { area: { contains: query, mode: 'insensitive' } },
          { city: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: limit,
      orderBy: {
        updatedAt: 'desc',
      },
    });
  }

  /**
   * Calculate distance between two addresses
   */
  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Get nearest pickup points to an address
   */
  async getNearestPickupPoints(latitude: number, longitude: number, limit = 5) {
    const pickupPoints = await this.prisma.pickupPoint.findMany({
      where: {
        isActive: true,
      },
    });

    // Calculate distances and sort
    const pointsWithDistance = pickupPoints
      .map((point) => ({
        ...point,
        distance: this.calculateDistance(
          latitude,
          longitude,
          point.latitude,
          point.longitude,
        ),
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, limit);

    return pointsWithDistance;
  }

  /**
   * Get Kenyan counties enum values
   */
  getKenyanCounties(): { value: KenyanCounty; label: string }[] {
    return Object.values(KenyanCounty).map((county) => ({
      value: county,
      label: county.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
    }));
  }

  // Private helper methods
  private parseNominatimResult(result: NominatimResponse): GeocodeResult {
    const address = result.address || {};

    return {
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
      formattedAddress: result.display_name,
      street:
        address.road || address.house_number
          ? `${address.house_number || ''} ${address.road || ''}`.trim()
          : undefined,
      area: address.suburb || address.neighbourhood || address.quarter,
      city: address.city || address.town || address.village,
      county: this.mapToKenyanCounty(address.county || address.state),
      state: address.county || address.state,
      zipCode: address.postcode,
      country: 'Kenya',
    };
  }

  private mapToKenyanCounty(countyName?: string): KenyanCounty | undefined {
    if (!countyName) return undefined;

    const normalizedName = countyName
      .toUpperCase()
      .replace(/\s+/g, '_')
      .replace(/-/g, '_');

    // Direct mapping for common variations
    const countyMap: { [key: string]: KenyanCounty } = {
      NAIROBI_CITY: KenyanCounty.NAIROBI,
      NAIROBI_COUNTY: KenyanCounty.NAIROBI,
      MOMBASA_COUNTY: KenyanCounty.MOMBASA,
      KIAMBU_COUNTY: KenyanCounty.KIAMBU,
      // Add more mappings as needed
    };

    return (
      countyMap[normalizedName] ||
      Object.values(KenyanCounty).find(
        (county) =>
          county === normalizedName ||
          county.replace(/_/g, ' ') === countyName.toUpperCase(),
      )
    );
  }

  private isWithinKenyaBounds(latitude: number, longitude: number): boolean {
    return (
      latitude >= this.kenyaBounds.south &&
      latitude <= this.kenyaBounds.north &&
      longitude >= this.kenyaBounds.west &&
      longitude <= this.kenyaBounds.east
    );
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}
