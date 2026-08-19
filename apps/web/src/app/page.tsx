'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import StatsBar from '@/components/StatsBar';
import FilterPanel from '@/components/FilterPanel';
import ListingTable from '@/components/ListingTable';
import ScrapeButton from '@/components/ScrapeButton';
import { fetchListings } from '@/lib/api';

function DashboardContent() {
  const searchParams = useSearchParams();
  const [listings, setListings] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('compositeScore');
  const [sortOrder, setSortOrder] = useState('desc');
  const [loading, setLoading] = useState(true);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const limit = 20;

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number | undefined> = {
        page,
        limit,
        sortBy,
        sortOrder,
      };
      // Merge URL search params
      searchParams.forEach((val, key) => {
        if (val) params[key] = val;
      });
      const data = await fetchListings(params);
      setListings(data.data || []);
      setTotal(data.total || 0);
    } catch {
      setListings([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, sortBy, sortOrder, searchParams]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSort = (field: string) => {
    if (field === sortBy) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
    setPage(1);
  };

  const handleFilterChange = () => {
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-lg font-semibold text-white">Inventory</h1>
        <ScrapeButton onComplete={loadData} />
      </div>
      <StatsBar />

      {/* Mobile filter toggle */}
      <div className="lg:hidden">
        <button
          onClick={() => setMobileFiltersOpen(true)}
          className="flex items-center gap-2 btn-secondary"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
          </svg>
          Filters
          {searchParams.toString() && (
            <span className="bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded-full">
              {searchParams.toString().split('&').length}
            </span>
          )}
        </button>
      </div>

      {/* Main layout */}
      <div className="flex gap-6">
        <FilterPanel
          onFilterChange={handleFilterChange}
          mobileOpen={mobileFiltersOpen}
          onMobileClose={() => setMobileFiltersOpen(false)}
        />

        <div className="flex-1 min-w-0">
          <ListingTable
            listings={listings}
            total={total}
            page={page}
            limit={limit}
            loading={loading}
            onPageChange={setPage}
            onSort={handleSort}
            sortBy={sortBy}
            sortOrder={sortOrder}
          />
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="stat-card animate-pulse">
                <div className="h-3 bg-slate-700 rounded w-20 mb-3" />
                <div className="h-7 bg-slate-700 rounded w-16" />
              </div>
            ))}
          </div>
          <div className="flex gap-6">
            <div className="hidden lg:block w-64 flex-shrink-0">
              <div className="card p-5 animate-pulse">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="mb-4">
                    <div className="h-3 bg-slate-700 rounded w-16 mb-2" />
                    <div className="h-9 bg-slate-700 rounded w-full" />
                  </div>
                ))}
              </div>
            </div>
            <div className="flex-1">
              <div className="card p-4">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="h-12 bg-slate-800 rounded mb-2 animate-pulse" />
                ))}
              </div>
            </div>
          </div>
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
