'use client';

import { useRouter } from 'next/navigation';
import ScoreBadge from './ScoreBadge';
import VehicleGraphic from './VehicleGraphic';

interface ListingScore {
  compositeScore: number;
  reliabilityScore: number;
  valueScore: number;
  tier: string;
}

interface ListingRow {
  id: number;
  modelYear: number;
  make: string;
  model: string;
  trim?: string;
  price: number;
  mileage?: number;
  dealerCity?: string;
  dealerState?: string;
  exteriorColor?: string;
  bodyStyle?: string;
  drivetrain?: string;
  transmission?: string;
  score?: ListingScore | null;
}

interface ListingGridProps {
  listings: ListingRow[];
  total: number;
  page: number;
  limit: number;
  loading: boolean;
  onPageChange: (page: number) => void;
  onSort: (field: string) => void;
  sortBy: string;
  sortOrder: string;
}

const tierLabel: Record<string, string> = {
  top_pick: 'Top Pick',
  great_value: 'Great Value',
  worth_considering: 'Worth Considering',
  proceed_with_caution: 'Proceed with Caution',
};

const SORT_OPTIONS = [
  { field: 'compositeScore', label: 'Best Score' },
  { field: 'price', label: 'Price' },
  { field: 'mileage', label: 'Mileage' },
  { field: 'model_year', label: 'Year' },
  { field: 'reliability_score', label: 'Reliability' },
];

function CarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.25}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H18.75m-7.5-2.25h7.5M8.25 6.75h7.5" />
    </svg>
  );
}

function SkeletonCard() {
  return (
    <div className="card overflow-hidden animate-pulse">
      <div className="h-44 bg-slate-800" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-slate-800 rounded w-3/4" />
        <div className="h-6 bg-slate-800 rounded w-1/3" />
        <div className="h-3 bg-slate-800 rounded w-2/3" />
      </div>
    </div>
  );
}

function ListingCard({ row }: { row: ListingRow }) {
  const router = useRouter();
  const title = `${row.modelYear} ${row.make} ${row.model}`;

  return (
    <button
      onClick={() => router.push(`/listing/${row.id}`)}
      className="card group text-left overflow-hidden flex flex-col transition-all duration-200 hover:border-blue-500/60 hover:shadow-blue-500/10 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
    >
      {/* Body-style graphic (tinted by color) */}
      <div className="relative h-44 overflow-hidden">
        <VehicleGraphic
          bodyStyle={row.bodyStyle}
          color={row.exteriorColor}
          className="h-full w-full"
        />
        {row.score && (
          <div className="absolute top-2 right-2">
            <ScoreBadge score={row.score.compositeScore} tier={tierLabel[row.score.tier] || row.score.tier} size="sm" />
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-white leading-tight group-hover:text-blue-400 transition-colors">
            {title}
          </h3>
        </div>
        {row.trim && <p className="text-xs text-slate-500 mt-0.5 truncate">{row.trim}</p>}

        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-emerald-400 font-mono">
            ${row.price.toLocaleString()}
          </span>
        </div>

        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-400">
          <span>{row.mileage != null ? `${row.mileage.toLocaleString()} mi` : '— mi'}</span>
          {row.bodyStyle && <span>· {row.bodyStyle}</span>}
          {row.drivetrain && <span>· {row.drivetrain}</span>}
        </div>

        <div className="mt-auto pt-3 flex items-center justify-between text-xs">
          <span className="text-slate-500 truncate">
            {row.dealerCity && row.dealerState
              ? `${row.dealerCity}, ${row.dealerState}`
              : row.dealerCity || row.dealerState || 'Location N/A'}
          </span>
          {row.score && (
            <span className="text-slate-400 flex items-center gap-2 flex-shrink-0">
              <span title="Reliability">R {row.score.reliabilityScore}</span>
              <span title="Value">V {row.score.valueScore}</span>
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

export default function ListingGrid({
  listings,
  total,
  page,
  limit,
  loading,
  onPageChange,
  onSort,
  sortBy,
  sortOrder,
}: ListingGridProps) {
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm text-slate-400">
          {loading ? 'Loading…' : `${total.toLocaleString()} ${total === 1 ? 'vehicle' : 'vehicles'}`}
        </p>
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-500 uppercase tracking-wider">Sort</label>
          <select
            value={sortBy}
            onChange={(e) => onSort(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-200"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.field} value={o.field}>{o.label}</option>
            ))}
          </select>
          <button
            onClick={() => onSort(sortBy)}
            title={`Toggle order (currently ${sortOrder === 'asc' ? 'ascending' : 'descending'})`}
            className="btn-secondary px-2.5 py-1.5"
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </button>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 9 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : listings.length === 0 ? (
        <div className="card p-16 text-center">
          <CarIcon className="w-14 h-14 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-300 font-medium">No vehicles found</p>
          <p className="text-slate-500 text-sm mt-1">
            Try adjusting your filters or run a scrape to pull fresh listings.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {listings.map((row) => <ListingCard key={row.id} row={row} />)}
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-slate-500">
            Page {page} of {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="btn-secondary disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="btn-secondary disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
