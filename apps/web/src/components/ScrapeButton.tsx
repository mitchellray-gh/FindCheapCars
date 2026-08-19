'use client';

import { useState } from 'react';
import { triggerScrape } from '@/lib/api';

const SOURCES = [
  { value: 'all', label: 'All sources' },
  { value: 'cargurus', label: 'CarGurus' },
  { value: 'cars.com', label: 'Cars.com' },
  { value: 'autotrader', label: 'AutoTrader' },
  { value: 'carmax', label: 'CarMax' },
];

interface ScrapeButtonProps {
  onComplete?: () => void;
}

export default function ScrapeButton({ onComplete }: ScrapeButtonProps) {
  const [open, setOpen] = useState(false);
  const [source, setSource] = useState('all');
  const [zipCode, setZipCode] = useState('60601');
  const [maxPages, setMaxPages] = useState(3);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    if (!/^\d{5}$/.test(zipCode)) {
      setError('Enter a valid 5-digit ZIP code');
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await triggerScrape({ source, zipCode, maxPages, maxPrice: 15000 });
      setResult(`Found ${data.found ?? 0} · ${data.new ?? 0} new · ${data.updated ?? 0} updated`);
      onComplete?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Scrape failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="btn-primary flex items-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
        </svg>
        Scrape listings
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-72 card p-4 z-20 shadow-xl space-y-3">
            <div>
              <label className="text-xs text-slate-400 uppercase tracking-wider">Source</label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full mt-1 bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-sm text-slate-200"
              >
                {SOURCES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-400 uppercase tracking-wider">ZIP code</label>
              <input
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 5))}
                placeholder="60601"
                inputMode="numeric"
                className="w-full mt-1 bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-sm text-slate-200"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 uppercase tracking-wider">Pages per source</label>
              <input
                type="number"
                min={1}
                max={10}
                value={maxPages}
                onChange={(e) => setMaxPages(Math.max(1, Math.min(10, Number(e.target.value) || 1)))}
                className="w-full mt-1 bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-sm text-slate-200"
              />
            </div>

            <button
              onClick={run}
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Scraping…
                </>
              ) : (
                'Run scrape'
              )}
            </button>

            {result && <p className="text-xs text-emerald-400">{result}</p>}
            {error && <p className="text-xs text-red-400">{error}</p>}
            {loading && (
              <p className="text-[11px] text-slate-500">
                This can take up to a minute for multiple sources.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
