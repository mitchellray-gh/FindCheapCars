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
  engine?: string;
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

function SkeletonRow() {
  return (
    <div className="card flex items-center gap-3 p-2.5 animate-pulse">
      <div className="h-12 w-16 rounded bg-slate-800 flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 bg-slate-800 rounded w-1/3" />
        <div className="h-3 bg-slate-800 rounded w-1/2" />
      </div>
      <div className="h-5 w-16 bg-slate-800 rounded" />
    </div>
  );
}

function ListingRowItem({ row }: { row: ListingRow }) {
  const router = useRouter();
  const title = `${row.modelYear} ${row.make} ${row.model}`;
  const specs = [
    row.mileage != null ? `${row.mileage.toLocaleString()} mi` : null,
    row.bodyStyle,
    row.drivetrain,
    row.transmission,
    row.engine,
  ].filter(Boolean);

  return (
    <button
      onClick={() => router.push(`/listing/${row.id}`)}
      className="card group w-full text-left flex items-center gap-3 p-2.5 transition-colors hover:border-blue-500/60 hover:bg-slate-800/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
    >
      {/* Small body-style graphic */}
      <VehicleGraphic
        bodyStyle={row.bodyStyle}
        color={row.exteriorColor}
        showLabel={false}
        className="h-12 w-16 rounded flex-shrink-0"
      />

      {/* Title + specs */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-sm text-white truncate group-hover:text-blue-400 transition-colors">
            {title}
          </h3>
          {row.trim && <span className="text-xs text-slate-500 truncate hidden sm:inline">{row.trim}</span>}
        </div>
        <p className="text-xs text-slate-400 truncate mt-0.5">
          {specs.join(' · ') || '—'}
        </p>
        <p className="text-[11px] text-slate-500 truncate mt-0.5">
          {row.dealerCity && row.dealerState
            ? `${row.dealerCity}, ${row.dealerState}`
            : row.dealerCity || row.dealerState || 'Location N/A'}
        </p>
      </div>

      {/* Price + score */}
      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        <span className="text-lg font-bold text-emerald-400 font-mono">
          ${row.price.toLocaleString()}
        </span>
        {row.score && (
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400 hidden md:inline" title="Reliability / Value">
              R {row.score.reliabilityScore} · V {row.score.valueScore}
            </span>
            <ScoreBadge score={row.score.compositeScore} tier={tierLabel[row.score.tier] || row.score.tier} size="sm" />
          </div>
        )}
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

      {/* List */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 12 }).map((_, i) => <SkeletonRow key={i} />)}
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
        <div className="space-y-2">
          {listings.map((row) => <ListingRowItem key={row.id} row={row} />)}
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
