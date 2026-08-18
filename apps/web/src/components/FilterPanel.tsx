'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { fetchMakes, fetchModels } from '@/lib/api';

const BODY_STYLES = ['Sedan', 'SUV', 'Truck', 'Coupe', 'Hatchback', 'Van'];
const TITLE_STATUSES = ['Clean', 'Rebuilt', 'Salvage'];
const DRIVETRAINS = ['FWD', 'RWD', 'AWD', '4WD'];
const TIERS = ['Top Pick', 'Great Value', 'Worth Considering', 'Proceed with Caution'];

interface FilterPanelProps {
  onFilterChange: () => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export default function FilterPanel({ onFilterChange, mobileOpen, onMobileClose }: FilterPanelProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [makes, setMakes] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [loadingMakes, setLoadingMakes] = useState(true);
  const [loadingModels, setLoadingModels] = useState(false);

  const [make, setMake] = useState(searchParams.get('make') || '');
  const [model, setModel] = useState(searchParams.get('model') || '');
  const [yearMin, setYearMin] = useState(searchParams.get('yearMin') || '');
  const [yearMax, setYearMax] = useState(searchParams.get('yearMax') || '');
  const [priceMin, setPriceMin] = useState(searchParams.get('priceMin') || '');
  const [priceMax, setPriceMax] = useState(searchParams.get('priceMax') || '15000');
  const [maxMileage, setMaxMileage] = useState(searchParams.get('maxMileage') || '');
  const [minScore, setMinScore] = useState(searchParams.get('minScore') || '0');
  const [tier, setTier] = useState(searchParams.get('tier') || '');
  const [bodyStyle, setBodyStyle] = useState(searchParams.get('bodyStyle') || '');
  const [titleStatus, setTitleStatus] = useState(searchParams.get('titleStatus') || '');
  const [drivetrain, setDrivetrain] = useState(searchParams.get('drivetrain') || '');

  useEffect(() => {
    fetchMakes()
      .then((data) => setMakes(data.map((m: any) => m.make ?? m)))
      .catch(() => setMakes([]))
      .finally(() => setLoadingMakes(false));
  }, []);

  useEffect(() => {
    if (make) {
      setLoadingModels(true);
      setModel('');
      fetchModels(make)
        .then((data) => setModels(data.map((m: any) => m.model ?? m)))
        .catch(() => setModels([]))
        .finally(() => setLoadingModels(false));
    } else {
      setModels([]);
    }
  }, [make]);

  const buildParams = useCallback(() => {
    const params: Record<string, string> = {};
    if (make) params.make = make;
    if (model) params.model = model;
    if (yearMin) params.yearMin = yearMin;
    if (yearMax) params.yearMax = yearMax;
    if (priceMin) params.priceMin = priceMin;
    if (priceMax) params.priceMax = priceMax;
    if (maxMileage) params.maxMileage = maxMileage;
    if (minScore && minScore !== '0') params.minScore = minScore;
    if (tier) params.tier = tier;
    if (bodyStyle) params.bodyStyle = bodyStyle;
    if (titleStatus) params.titleStatus = titleStatus;
    if (drivetrain) params.drivetrain = drivetrain;
    return params;
  }, [make, model, yearMin, yearMax, priceMin, priceMax, maxMileage, minScore, tier, bodyStyle, titleStatus, drivetrain]);

  const applyFilters = () => {
    const params = buildParams();
    const qs = new URLSearchParams(params).toString();
    router.push(`/?${qs}`, { scroll: false });
    onFilterChange();
    onMobileClose?.();
  };

  const clearAll = () => {
    setMake('');
    setModel('');
    setYearMin('');
    setYearMax('');
    setPriceMin('');
    setPriceMax('15000');
    setMaxMileage('');
    setMinScore('0');
    setTier('');
    setBodyStyle('');
    setTitleStatus('');
    setDrivetrain('');
    router.push('/', { scroll: false });
    onFilterChange();
    onMobileClose?.();
  };

  const panelContent = (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Filters</h2>
        <button onClick={clearAll} className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
          Clear All
        </button>
      </div>

      {/* Make */}
      <div>
        <label className="label">Make</label>
        <select
          value={make}
          onChange={(e) => setMake(e.target.value)}
          className="input-field"
        >
          <option value="">All Makes</option>
          {makes.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>

      {/* Model */}
      <div>
        <label className="label">Model</label>
        <select
          value={model}
          onChange={(e) => setModel(e.target.value)}
          disabled={!make || loadingModels}
          className="input-field disabled:opacity-50"
        >
          <option value="">{!make ? 'Select make first' : loadingModels ? 'Loading...' : 'All Models'}</option>
          {models.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>

      {/* Year Range */}
      <div>
        <label className="label">Year Range</label>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            placeholder="Min"
            value={yearMin}
            onChange={(e) => setYearMin(e.target.value)}
            className="input-field"
            min={1990}
            max={2026}
          />
          <input
            type="number"
            placeholder="Max"
            value={yearMax}
            onChange={(e) => setYearMax(e.target.value)}
            className="input-field"
            min={1990}
            max={2026}
          />
        </div>
      </div>

      {/* Price Range */}
      <div>
        <label className="label">Price Range</label>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            placeholder="Min"
            value={priceMin}
            onChange={(e) => setPriceMin(e.target.value)}
            className="input-field"
            min={0}
          />
          <input
            type="number"
            placeholder="Max"
            value={priceMax}
            onChange={(e) => setPriceMax(e.target.value)}
            className="input-field"
            min={0}
          />
        </div>
      </div>

      {/* Max Mileage */}
      <div>
        <label className="label">Max Mileage</label>
        <input
          type="number"
          placeholder="e.g., 100000"
          value={maxMileage}
          onChange={(e) => setMaxMileage(e.target.value)}
          className="input-field"
          min={0}
          step={5000}
        />
      </div>

      {/* Min Score */}
      <div>
        <label className="label">
          Minimum Score: <span className="text-blue-400 font-mono">{minScore}</span>
        </label>
        <input
          type="range"
          min={0}
          max={100}
          value={minScore}
          onChange={(e) => setMinScore(e.target.value)}
          className="w-full mt-1"
        />
        <div className="flex justify-between text-xs text-slate-500 mt-1">
          <span>0</span>
          <span>50</span>
          <span>100</span>
        </div>
      </div>

      {/* Tier */}
      <div>
        <label className="label">Tier</label>
        <select
          value={tier}
          onChange={(e) => setTier(e.target.value)}
          className="input-field"
        >
          <option value="">All Tiers</option>
          {TIERS.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      {/* Body Style */}
      <div>
        <label className="label">Body Style</label>
        <select
          value={bodyStyle}
          onChange={(e) => setBodyStyle(e.target.value)}
          className="input-field"
        >
          <option value="">All Body Styles</option>
          {BODY_STYLES.map((b) => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>
      </div>

      {/* Title Status */}
      <div>
        <label className="label">Title Status</label>
        <select
          value={titleStatus}
          onChange={(e) => setTitleStatus(e.target.value)}
          className="input-field"
        >
          <option value="">All</option>
          {TITLE_STATUSES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      {/* Drivetrain */}
      <div>
        <label className="label">Drivetrain</label>
        <select
          value={drivetrain}
          onChange={(e) => setDrivetrain(e.target.value)}
          className="input-field"
        >
          <option value="">All</option>
          {DRIVETRAINS.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      </div>

      {/* Apply Button */}
      <button onClick={applyFilters} className="btn-primary w-full">
        Apply Filters
      </button>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-64 flex-shrink-0">
        <div className="card p-5 sticky top-24">
          {panelContent}
        </div>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen !== undefined && (
        <div className={`lg:hidden fixed inset-0 z-50 ${mobileOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
          <div
            className={`absolute inset-0 bg-black/60 transition-opacity ${mobileOpen ? 'opacity-100' : 'opacity-0'}`}
            onClick={onMobileClose}
          />
          <div
            className={`absolute left-0 top-0 bottom-0 w-80 max-w-[85vw] bg-slate-900 border-r border-slate-700 overflow-y-auto transition-transform ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
          >
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">Filters</h2>
                <button onClick={onMobileClose} className="text-slate-400 hover:text-white">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              {panelContent}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
