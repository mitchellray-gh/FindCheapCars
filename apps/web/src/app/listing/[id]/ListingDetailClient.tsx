'use client';

import { useEffect, useState } from 'react';
import { fetchListing } from '@/lib/api';
import ListingDetail from '@/components/ListingDetail';

export default function ListingDetailClient({ id }: { id: number }) {
  const [listing, setListing] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchListing(id)
      .then((data) => setListing(data))
      .catch(() => setError('Failed to load listing. It may not exist.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="card p-6 animate-pulse">
          <div className="h-8 bg-slate-700 rounded w-1/3 mb-4" />
          <div className="h-4 bg-slate-700 rounded w-1/4" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="card h-80 bg-slate-800 animate-pulse" />
            <div className="card p-6">
              <div className="h-6 bg-slate-700 rounded w-1/4 mb-4" />
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-4 bg-slate-700 rounded w-full" />
                ))}
              </div>
            </div>
          </div>
          <div className="space-y-6">
            <div className="card p-5 animate-pulse">
              <div className="h-5 bg-slate-700 rounded w-1/3 mb-4" />
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-4 bg-slate-700 rounded w-full mb-3" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="card p-12 text-center">
        <svg className="w-16 h-16 text-slate-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
        </svg>
        <h2 className="text-lg font-semibold text-white mb-2">Listing Not Found</h2>
        <p className="text-slate-400 text-sm">{error || 'This listing could not be loaded.'}</p>
      </div>
    );
  }

  return <ListingDetail listing={listing} />;
}
