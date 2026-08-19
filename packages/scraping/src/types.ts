import type { ScrapedListing } from '@auto-find/shared';

export type { ScrapedListing };

export interface ScraperOptions {
  zipCode: string;
  maxPrice?: number;
  maxPages?: number;
  radius?: number;
  minYear?: number;
  maxMileage?: number;
}

export interface NhtsaDecodedVin {
  make: string;
  model: string;
  modelYear: number;
  trim: string;
  bodyClass: string;
  displacementL: string;
  engineCylinders: string;
  engineModel: string;
  fuelTypePrimary: string;
  transmissionStyle: string;
  transmissionSpeeds: string;
  driveType: string;
  manufacturerId: string;
  plantCity: string;
  plantState: string;
  errorCode: string;
  errorText: string;
}

export interface NhtsaRecall {
  NHTSACampaignNumber: string;
  Summary: string;
  Consequence: string;
  Remedy: string;
  ModelYear: string;
  Make: string;
  Model: string;
}
