'use client';

interface ScoreBadgeProps {
  score: number;
  tier: string;
  size?: 'sm' | 'md' | 'lg';
}

const tierConfig: Record<string, { bg: string; text: string; label: string }> = {
  'Top Pick': { bg: 'bg-emerald-500/15', text: 'text-emerald-400', label: 'Top Pick' },
  'top_pick': { bg: 'bg-emerald-500/15', text: 'text-emerald-400', label: 'Top Pick' },
  'Great Value': { bg: 'bg-blue-500/15', text: 'text-blue-400', label: 'Great Value' },
  'great_value': { bg: 'bg-blue-500/15', text: 'text-blue-400', label: 'Great Value' },
  'Worth Considering': { bg: 'bg-amber-500/15', text: 'text-amber-400', label: 'Worth Considering' },
  'worth_considering': { bg: 'bg-amber-500/15', text: 'text-amber-400', label: 'Worth Considering' },
  'Proceed with Caution': { bg: 'bg-slate-500/15', text: 'text-slate-400', label: 'Proceed with Caution' },
  'proceed_with_caution': { bg: 'bg-slate-500/15', text: 'text-slate-400', label: 'Proceed with Caution' },
};

function getTier(score: number, tier?: string) {
  if (tier && tierConfig[tier]) return tierConfig[tier];
  if (score >= 80) return tierConfig['Top Pick'];
  if (score >= 65) return tierConfig['Great Value'];
  if (score >= 50) return tierConfig['Worth Considering'];
  return tierConfig['Proceed with Caution'];
}

export default function ScoreBadge({ score, tier, size = 'md' }: ScoreBadgeProps) {
  const config = getTier(score, tier);

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base',
  };

  const scoreSize = {
    sm: 'text-sm font-bold',
    md: 'text-lg font-bold',
    lg: 'text-2xl font-bold',
  };

  return (
    <div className={`inline-flex items-center gap-1.5 rounded-full ${config.bg} ${sizeClasses[size]}`}>
      <span className={scoreSize[size]} style={{ color: config.text.replace('text-', '') }}>
        {score}
      </span>
      <span className={`font-medium ${config.text} ${size === 'sm' ? 'hidden sm:inline' : ''}`}>
        {config.label}
      </span>
    </div>
  );
}
