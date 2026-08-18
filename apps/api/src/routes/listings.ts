import { FastifyInstance } from 'fastify';
import { getListings, getListingById, getDistinctMakes, getModelsByMake, ListingFilters } from '../services/listing-service';

export default async function listingsRoutes(app: FastifyInstance) {
  app.get('/api/listings', async (request, reply) => {
    const q = request.query as Record<string, string>;
    const filters: ListingFilters = {
      make: q.make,
      model: q.model,
      yearMin: q.yearMin ? parseInt(q.yearMin) : undefined,
      yearMax: q.yearMax ? parseInt(q.yearMax) : undefined,
      priceMin: q.priceMin ? parseInt(q.priceMin) : undefined,
      priceMax: q.priceMax ? parseInt(q.priceMax) : undefined,
      mileageMax: q.mileageMax ? parseInt(q.mileageMax) : undefined,
      minScore: q.minScore ? parseInt(q.minScore) : undefined,
      tier: q.tier,
      bodyStyle: q.bodyStyle,
      titleStatus: q.titleStatus,
      drivetrain: q.drivetrain,
      sortBy: q.sortBy,
      sortOrder: q.sortOrder as 'asc' | 'desc',
      page: q.page ? parseInt(q.page) : 1,
      limit: q.limit ? parseInt(q.limit) : 25,
    };

    const result = await getListings(filters);
    return result;
  });

  app.get('/api/listings/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const listing = await getListingById(parseInt(id));
    if (!listing) return reply.code(404).send({ error: 'Listing not found' });
    return listing;
  });

  app.get('/api/makes', async () => {
    return getDistinctMakes();
  });

  app.get('/api/models', async (request) => {
    const { make } = request.query as { make: string };
    if (!make) return [];
    return getModelsByMake(make);
  });
}
