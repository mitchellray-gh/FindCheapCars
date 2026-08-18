'use client';

import Link from 'next/link';
import ScoreBadge from './ScoreBadge';

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
  imageUrl?: string;
  listingUrl?: string;
  bodyStyle?: string;
  drivetrain?: string;
  transmission?: string;
  score?: {
    compositeScore: number;
    tier: string;
    reliabilityScore: number;
    valueScore: number;
  } | null;
}

interface ListingTableProps {
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

function SortIcon({ field, sortBy, sortOrder }: { field: string; sortBy: string; sortOrder: string }) {
  if (field !== sortBy) {
    return (
      <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 15L12 18.75 15.75 15M8.25 9L12 5.25 15.75 9" />
      </svg>
    );
  }
  return sortOrder === 'asc' ? (
    <svg className="w-3.5 h-3.5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
    </svg>
  ) : (
    <svg className="w-3.5 h-3.5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
  );
}

function SkeletonRow() {
  return (
    <tr className="border-b border-slate-800/50">
      {Array.from({ length: 8 }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 bg-slate-800 rounded animate-pulse" style={{ width: `${60 + (((i * 7 + 3) * 13) % 40)}%` }} />
        </td>
      ))}
    </tr>
  );
}

const tierLabel: Record<string, string> = {
  top_pick: 'Top Pick',
  great_value: 'Great Value',
  worth_considering: 'Worth Considering',
  proceed_with_caution: 'Proceed with Caution',
};

export default function ListingTable({
  listings,
  total,
  page,
  limit,
  loading,
  onPageChange,
  onSort,
  sortBy,
  sortOrder,
}: ListingTableProps) {
  const totalPages = Math.ceil(total / limit);

  const columns = [
    { label: 'Vehicle', field: 'modelYear' },
    { label: 'Price', field: 'price' },
    { label: 'Mileage', field: 'mileage' },
    { label: 'Score', field: 'compositeScore' },
    { label: 'Reliability', field: 'reliabilityScore' },
    { label: 'Value', field: 'valueScore' },
    { label: 'Location', field: 'dealerCity' },
    { label: '', field: '' },
  ];

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700/50 bg-slate-800/50">
              {columns.map((col) => (
                <th
                  key={col.field || 'action'}
                  className={`px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider ${col.field ? 'cursor-pointer hover:text-slate-200 select-none' : ''}`}
                  onClick={() => col.field && onSort(col.field)}
                >
                  <div className="flex items-center gap-1.5">
                    {col.label}
                    {col.field && <SortIcon field={col.field} sortBy={sortBy} sortOrder={sortOrder} />}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {loading ? (
              Array.from({ length: 10 }).map((_, i) => <SkeletonRow key={i} />)
            ) : listings.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <svg className="w-12 h-12 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                    </svg>
                    <span className="text-slate-400 font-medium">No listings found</span>
                    <span className="text-slate-500 text-xs">Try adjusting your filters</span>
                  </div>
                </td>
              </tr>
            ) : (
              listings.map((row) => (
                <Link
                  key={row.id}
                  href={`/listing/${row.id}`}
                  className="contents"
                >
                  <tr className="hover:bg-slate-800/40 transition-colors cursor-pointer">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {row.imageUrl ? (
                          <img
                            src={row.imageUrl}
                            alt={`${row.modelYear} ${row.make} ${row.model}`}
                            className="w-14 h-10 object-cover rounded bg-slate-800 flex-shrink-0"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-14 h-10 rounded bg-slate-800 flex items-center justify-center flex-shrink-0">
                            <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H18.75m-7.5-2.25h7.5M8.25 6.75h7.5" />
                            </svg>
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-white">
                            {row.modelYear} {row.make} {row.model}
                          </div>
                          {row.trim && (
                            <div className="text-xs text-slate-500 mt-0.5">{row.trim}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono font-semibold text-emerald-400">
                      ${row.price.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-slate-300 font-mono">
                      {row.mileage != null ? `${row.mileage.toLocaleString()} mi` : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {row.score ? (
                        <ScoreBadge score={row.score.compositeScore} tier={tierLabel[row.score.tier] || row.score.tier} size="sm" />
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-300">{row.score?.reliabilityScore ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-300">{row.score?.valueScore ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs">
                      {row.dealerCity && row.dealerState
                        ? `${row.dealerCity}, ${row.dealerState}`
                        : row.dealerCity || row.dealerState || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-blue-400 text-xs font-medium">View</span>
                    </td>
                  </tr>
                </Link>
              ))
            )}
          </tbody>
        </table>
      </div>

      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-700/50 bg-slate-800/30">
          <span className="text-xs text-slate-500">
            Showing {((page - 1) * limit) + 1}–{Math.min(page * limit, total)} of {total.toLocaleString()}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="px-3 py-1.5 text-xs font-medium text-slate-400 bg-slate-800 rounded-lg hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 7) pageNum = i + 1;
              else if (page <= 4) pageNum = i + 1;
              else if (page >= totalPages - 3) pageNum = totalPages - 6 + i;
              else pageNum = page - 3 + i;
              return (
                <button
                  key={pageNum}
                  onClick={() => onPageChange(pageNum)}
                  className={`w-8 h-8 text-xs font-medium rounded-lg transition-colors ${
                    pageNum === page ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="px-3 py-1.5 text-xs font-medium text-slate-400 bg-slate-800 rounded-lg hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
