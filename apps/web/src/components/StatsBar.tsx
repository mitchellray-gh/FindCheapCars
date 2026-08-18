'use client';

import { useEffect, useState } from 'react';
import { fetchStats } from '@/lib/api';

interface Stats {
  totalListings: number;
  avgCompositeScore: number;
  tierDistribution: { top_pick: number; great_value: number; worth_considering: number; proceed_with_caution: number };
  priceRange: { min: number; max: number };
}

export default function StatsBar() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats()
      .then((data) => setStats(data))
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, []);

  const statItems = stats
    ? [
        {
          label: 'Total Listings',
          value: stats.totalListings.toLocaleString(),
          icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
            </svg>
          ),
          color: 'text-blue-400',
        },
        {
          label: 'Avg Score',
          value: stats.avgCompositeScore.toFixed(1),
          icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
            </svg>
          ),
          color: 'text-amber-400',
        },
        {
          label: 'Top Picks',
          value: stats.tierDistribution.top_pick.toLocaleString(),
          icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          color: 'text-emerald-400',
        },
        {
          label: 'Price Range',
          value: `$${stats.priceRange.min.toLocaleString()} – $${stats.priceRange.max.toLocaleString()}`,
          icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          color: 'text-purple-400',
        },
      ]
    : [];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      {loading
        ? Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="stat-card animate-pulse">
              <div className="h-3 bg-slate-700 rounded w-20 mb-3" />
              <div className="h-7 bg-slate-700 rounded w-16" />
            </div>
          ))
        : statItems.map((item) => (
            <div key={item.label} className="stat-card group hover:border-slate-600 transition-colors">
              <div className="flex items-center gap-2 mb-1">
                <span className={`${item.color} opacity-70 group-hover:opacity-100 transition-opacity`}>
                  {item.icon}
                </span>
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                  {item.label}
                </span>
              </div>
              <span className="text-2xl font-bold text-white">{item.value}</span>
            </div>
          ))}
    </div>
  );
}
