import { NextRequest, NextResponse } from 'next/server';
import { initDatabase } from '@/lib/db/client';
import { getListings, type ListingFilters } from '@/lib/db/listing-service';

let dbReady = false;

export async function GET(request: NextRequest) {
  if (!dbReady) { await initDatabase(); dbReady = true; }
  const { searchParams } = new URL(request.url);
  const filters: ListingFilters = {
    make: searchParams.get('make') || undefined,
    model: searchParams.get('model') || undefined,
    yearMin: searchParams.get('yearMin') ? parseInt(searchParams.get('yearMin')!) : undefined,
    yearMax: searchParams.get('yearMax') ? parseInt(searchParams.get('yearMax')!) : undefined,
    priceMin: searchParams.get('priceMin') ? parseInt(searchParams.get('priceMin')!) : undefined,
    priceMax: searchParams.get('priceMax') ? parseInt(searchParams.get('priceMax')!) : undefined,
    mileageMax: searchParams.get('mileageMax') ? parseInt(searchParams.get('mileageMax')!) : undefined,
    minScore: searchParams.get('minScore') ? parseInt(searchParams.get('minScore')!) : undefined,
    tier: searchParams.get('tier') || undefined,
    bodyStyle: searchParams.get('bodyStyle') || undefined,
    titleStatus: searchParams.get('titleStatus') || undefined,
    drivetrain: searchParams.get('drivetrain') || undefined,
    sortBy: searchParams.get('sortBy') || undefined,
    sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || undefined,
    page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
    limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 25,
  };
  const result = await getListings(filters);
  return NextResponse.json(result);
}
