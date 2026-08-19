'use client';

import ScoreBadge from './ScoreBadge';

interface ScoreBreakdown {
  base?: number;
  mileage?: number;
  title?: number;
  ownership?: number;
  accidents?: number;
  market?: number;
  priceReliability?: number;
  maintenance?: number;
  daysOnMarket?: number;
}

interface ListingData {
  id: number;
  year: number;
  make: string;
  model: string;
  trim?: string;
  price: number;
  mileage?: number;
  vin?: string;
  titleStatus?: string;
  transmission?: string;
  drivetrain?: string;
  engine?: string;
  mpgCity?: number;
  mpgHighway?: number;
  bodyStyle?: string;
  exteriorColor?: string;
  interiorColor?: string;
  compositeScore: number;
  tier: string;
  reliabilityScore: number;
  reliabilityBreakdown?: ScoreBreakdown;
  valueScore: number;
  valueBreakdown?: ScoreBreakdown;
  imageUrl?: string;
  sourceUrl?: string;
  source?: string;
  dealerName?: string;
  city?: string;
  state?: string;
  carfaxOwners?: number;
  carfaxAccidents?: number;
  carfaxServiceRecords?: boolean;
  daysOnMarket?: number;
  listingDate?: string;
}

interface ListingDetailProps {
  listing: ListingData;
}

function ScoreBar({ label, value, max = 100 }: { label: string; value?: number; max?: number }) {
  const pct = value != null ? Math.min((value / max) * 100, 100) : 0;
  const color =
    pct >= 80 ? 'bg-emerald-500' :
    pct >= 60 ? 'bg-blue-500' :
    pct >= 40 ? 'bg-amber-500' :
    'bg-slate-500';

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-slate-400 w-28 text-right flex-shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-slate-300 font-mono w-8 text-right">{value ?? '—'}</span>
    </div>
  );
}

function StatItem({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="flex flex-col">
      <span className="text-xs text-slate-500 uppercase tracking-wider">{label}</span>
      <span className="text-sm text-slate-200 font-medium mt-0.5">{value ?? '—'}</span>
    </div>
  );
}

function wikiSearchUrl(query: string): string {
  // Special:Search redirects straight to the article on an exact title match,
  // otherwise lands on Wikipedia's search results — reliable for any term.
  return `https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(query)}`;
}

function WikiStatItem({
  label,
  value,
  query,
}: {
  label: string;
  value?: string | number | null;
  query?: string | null;
}) {
  const hasValue = value !== undefined && value !== null && value !== '';
  return (
    <div className="flex flex-col">
      <span className="text-xs text-slate-500 uppercase tracking-wider">{label}</span>
      {hasValue && query ? (
        <a
          href={wikiSearchUrl(query)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-blue-400 hover:text-blue-300 font-medium mt-0.5 inline-flex items-center gap-1 group"
          title={`Look up "${value}" on Wikipedia`}
        >
          {value}
          <svg className="w-3 h-3 opacity-60 group-hover:opacity-100 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
          </svg>
        </a>
      ) : (
        <span className="text-sm text-slate-200 font-medium mt-0.5">{value ?? '—'}</span>
      )}
    </div>
  );
}

export default function ListingDetail({ listing }: ListingDetailProps) {
  const title = `${listing.year} ${listing.make} ${listing.model}${listing.trim ? ` ${listing.trim}` : ''}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">{title}</h1>
          <p className="text-slate-400 mt-1">
            {listing.city && listing.state ? `${listing.city}, ${listing.state}` : ''}
            {listing.source ? ` · ${listing.source}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ScoreBadge score={listing.compositeScore} tier={listing.tier} size="lg" />
          <div className="text-right">
            <div className="text-3xl font-bold text-emerald-400 font-mono">
              ${listing.price.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Image & Key Stats */}
        <div className="lg:col-span-2 space-y-6">
          {/* Image */}
          <div className="card overflow-hidden">
            {listing.imageUrl ? (
              <img
                src={listing.imageUrl}
                alt={title}
                className="w-full h-64 sm:h-80 object-cover"
              />
            ) : (
              <div className="w-full h-64 sm:h-80 bg-slate-800 flex items-center justify-center">
                <div className="text-center">
                  <svg className="w-16 h-16 text-slate-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H18.75m-7.5-2.25h7.5M8.25 6.75h7.5" />
                  </svg>
                  <span className="text-slate-500 text-sm">No image available</span>
                </div>
              </div>
            )}
          </div>

          {/* Score Breakdown */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Score Breakdown</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Reliability */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-slate-300">Reliability Score</h3>
                  <span className="text-xl font-bold text-white">{listing.reliabilityScore ?? '—'}</span>
                </div>
                <div className="space-y-2">
                  <ScoreBar label="Base" value={listing.reliabilityBreakdown?.base} />
                  <ScoreBar label="Mileage" value={listing.reliabilityBreakdown?.mileage} />
                  <ScoreBar label="Title" value={listing.reliabilityBreakdown?.title} />
                  <ScoreBar label="Ownership" value={listing.reliabilityBreakdown?.ownership} />
                  <ScoreBar label="Accidents" value={listing.reliabilityBreakdown?.accidents} />
                </div>
              </div>

              {/* Value */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-slate-300">Value Score</h3>
                  <span className="text-xl font-bold text-white">{listing.valueScore ?? '—'}</span>
                </div>
                <div className="space-y-2">
                  <ScoreBar label="Market" value={listing.valueBreakdown?.market} />
                  <ScoreBar label="Price/Rel" value={listing.valueBreakdown?.priceReliability} />
                  <ScoreBar label="Maintenance" value={listing.valueBreakdown?.maintenance} />
                  <ScoreBar label="Days Listed" value={listing.valueBreakdown?.daysOnMarket} />
                </div>
              </div>
            </div>
          </div>

          {/* Key Stats Grid */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Vehicle Details</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              <StatItem label="Mileage" value={listing.mileage?.toLocaleString() ? `${listing.mileage.toLocaleString()} mi` : undefined} />
              <StatItem label="VIN" value={listing.vin} />
              <StatItem label="Title" value={listing.titleStatus} />
              <WikiStatItem
                label="Manufacturer"
                value={listing.make}
                query={listing.make ? `${listing.make} (automobile manufacturer)` : null}
              />
              <WikiStatItem
                label="Transmission"
                value={listing.transmission}
                query={listing.transmission ? `${listing.transmission} transmission` : null}
              />
              <StatItem label="Drivetrain" value={listing.drivetrain} />
              <WikiStatItem
                label="Engine"
                value={listing.engine}
                query={
                  listing.engine
                    ? `${listing.make ? `${listing.make} ` : ''}${listing.engine} engine`
                    : null
                }
              />
              <StatItem label="MPG City" value={listing.mpgCity} />
              <StatItem label="MPG Hwy" value={listing.mpgHighway} />
              <StatItem label="Body" value={listing.bodyStyle} />
              <StatItem label="Exterior" value={listing.exteriorColor} />
              <StatItem label="Interior" value={listing.interiorColor} />
              <StatItem label="Days Listed" value={listing.daysOnMarket} />
            </div>
          </div>
        </div>

        {/* Right column - Dealer & Carfax */}
        <div className="space-y-6">
          {/* Dealer Info */}
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">Dealer</h3>
            <div className="space-y-2">
              <StatItem label="Name" value={listing.dealerName} />
              <StatItem label="Location" value={listing.city && listing.state ? `${listing.city}, ${listing.state}` : undefined} />
              <StatItem label="Source" value={listing.source} />
            </div>
          </div>

          {/* Carfax */}
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">Carfax Summary</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Owners</span>
                <span className="text-sm text-slate-200 font-medium">
                  {listing.carfaxOwners ?? 'Unknown'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Accidents</span>
                <span className={`text-sm font-medium ${
                  listing.carfaxAccidents != null && listing.carfaxAccidents > 0
                    ? 'text-amber-400'
                    : 'text-emerald-400'
                }`}>
                  {listing.carfaxAccidents != null ? listing.carfaxAccidents : 'Unknown'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Service Records</span>
                <span className={`text-sm font-medium ${
                  listing.carfaxServiceRecords ? 'text-emerald-400' : 'text-slate-400'
                }`}>
                  {listing.carfaxServiceRecords ? 'Yes' : 'No'}
                </span>
              </div>
            </div>
          </div>

          {/* Action */}
          {listing.sourceUrl && (
            <a
              href={listing.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors text-sm"
            >
              View Original Listing
              <svg className="inline-block w-4 h-4 ml-1.5 -mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
              </svg>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
