'use client';

/**
 * Renders a generic vehicle silhouette based on body style, tinted by the
 * listing's exterior color. Replaces photo thumbnails entirely.
 */

type BodyCategory = 'suv' | 'sedan' | 'coupe' | 'hatchback' | 'truck' | 'van' | 'wagon' | 'convertible';

function categorize(bodyStyle?: string | null): BodyCategory {
  const b = (bodyStyle || '').toLowerCase();
  if (b.includes('suv') || b.includes('crossover') || b.includes('sport utility')) return 'suv';
  if (b.includes('truck') || b.includes('pickup')) return 'truck';
  if (b.includes('van')) return 'van';
  if (b.includes('wagon')) return 'wagon';
  if (b.includes('convertible') || b.includes('roadster')) return 'convertible';
  if (b.includes('hatchback') || b.includes('liftback')) return 'hatchback';
  if (b.includes('coupe')) return 'coupe';
  return 'sedan';
}

const BODY_LABEL: Record<BodyCategory, string> = {
  suv: 'SUV',
  sedan: 'Sedan',
  coupe: 'Coupe',
  hatchback: 'Hatchback',
  truck: 'Truck',
  van: 'Van',
  wagon: 'Wagon',
  convertible: 'Convertible',
};

/** Map a free-text color name to a hex fill. Falls back to slate gray. */
function colorToHex(color?: string | null): { fill: string; isLight: boolean } {
  const c = (color || '').toLowerCase();
  const table: Array<[string, string, boolean]> = [
    ['white', '#e5e7eb', true],
    ['pearl', '#eef2f7', true],
    ['silver', '#c4cad2', true],
    ['gray', '#9aa3af', false],
    ['grey', '#9aa3af', false],
    ['black', '#2b2f36', false],
    ['blue', '#3b82f6', false],
    ['navy', '#1e3a8a', false],
    ['red', '#ef4444', false],
    ['maroon', '#7f1d1d', false],
    ['green', '#22c55e', false],
    ['orange', '#f97316', false],
    ['gold', '#d4af37', false],
    ['beige', '#d8c7a8', true],
    ['tan', '#d2b48c', true],
    ['brown', '#8b5e3c', false],
    ['yellow', '#eab308', false],
    ['purple', '#8b5cf6', false],
  ];
  for (const [key, hex, isLight] of table) {
    if (c.includes(key)) return { fill: hex, isLight };
  }
  return { fill: '#64748b', isLight: false };
}

function BodySvg({ category, fill }: { category: BodyCategory; fill: string }) {
  const stroke = 'rgba(0,0,0,0.35)';
  const wheel = '#1f2937';
  const glass = 'rgba(255,255,255,0.35)';
  const common = { stroke, strokeWidth: 1.5 };

  // viewBox 0 0 100 48, wheels sit near y=40
  const wheels = (
    <>
      <circle cx="28" cy="40" r="6" fill={wheel} />
      <circle cx="72" cy="40" r="6" fill={wheel} />
      <circle cx="28" cy="40" r="2.5" fill="#4b5563" />
      <circle cx="72" cy="40" r="2.5" fill="#4b5563" />
    </>
  );

  switch (category) {
    case 'suv':
      return (
        <svg viewBox="0 0 100 48" className="w-2/3 h-2/3">
          <path d="M12 34 L14 18 Q15 13 22 13 L74 13 Q82 13 86 20 L88 34 Z" fill={fill} {...common} />
          <path d="M24 16 L44 16 L44 24 L20 24 Z" fill={glass} />
          <path d="M48 16 L70 16 Q76 16 78 24 L48 24 Z" fill={glass} />
          {wheels}
        </svg>
      );
    case 'truck':
      return (
        <svg viewBox="0 0 100 48" className="w-2/3 h-2/3">
          <path d="M10 34 L12 22 Q13 18 20 18 L40 18 L44 26 L88 26 L88 34 Z" fill={fill} {...common} />
          <path d="M22 21 L38 21 L40 25 L20 25 Z" fill={glass} />
          {wheels}
        </svg>
      );
    case 'van':
      return (
        <svg viewBox="0 0 100 48" className="w-2/3 h-2/3">
          <path d="M12 34 L13 16 Q14 12 20 12 L80 12 Q88 12 88 22 L88 34 Z" fill={fill} {...common} />
          <path d="M22 15 L82 15 L82 23 L22 23 Z" fill={glass} />
          {wheels}
        </svg>
      );
    case 'wagon':
      return (
        <svg viewBox="0 0 100 48" className="w-2/3 h-2/3">
          <path d="M10 34 L14 20 Q16 15 24 15 L84 15 Q88 16 88 24 L88 34 Z" fill={fill} {...common} />
          <path d="M26 18 L46 18 L46 25 L22 25 Z" fill={glass} />
          <path d="M50 18 L82 18 L82 25 L50 25 Z" fill={glass} />
          {wheels}
        </svg>
      );
    case 'hatchback':
      return (
        <svg viewBox="0 0 100 48" className="w-2/3 h-2/3">
          <path d="M12 34 L18 22 Q20 16 28 16 L60 16 Q72 17 80 26 L84 34 Z" fill={fill} {...common} />
          <path d="M28 19 L46 19 L46 26 L24 26 Z" fill={glass} />
          <path d="M50 19 L62 19 Q70 20 74 26 L50 26 Z" fill={glass} />
          {wheels}
        </svg>
      );
    case 'coupe':
      return (
        <svg viewBox="0 0 100 48" className="w-2/3 h-2/3">
          <path d="M10 34 L20 26 Q30 18 46 18 L58 18 Q74 19 86 30 L88 34 Z" fill={fill} {...common} />
          <path d="M32 21 L58 20 Q68 21 74 27 L34 27 Z" fill={glass} />
          {wheels}
        </svg>
      );
    case 'convertible':
      return (
        <svg viewBox="0 0 100 48" className="w-2/3 h-2/3">
          <path d="M10 34 L18 28 Q30 24 48 24 L64 24 Q78 25 88 32 L88 34 Z" fill={fill} {...common} />
          <path d="M30 24 L60 24 L58 20 L34 20 Z" fill={glass} opacity={0.5} />
          {wheels}
        </svg>
      );
    case 'sedan':
    default:
      return (
        <svg viewBox="0 0 100 48" className="w-2/3 h-2/3">
          <path d="M10 34 L18 26 Q24 18 40 18 L58 18 Q74 19 84 27 L88 34 Z" fill={fill} {...common} />
          <path d="M28 20 L46 20 L46 27 L22 27 Z" fill={glass} />
          <path d="M50 20 L60 20 Q70 21 76 27 L50 27 Z" fill={glass} />
          {wheels}
        </svg>
      );
  }
}

export default function VehicleGraphic({
  bodyStyle,
  color,
  className = '',
  showLabel = true,
}: {
  bodyStyle?: string | null;
  color?: string | null;
  className?: string;
  showLabel?: boolean;
}) {
  const category = categorize(bodyStyle);
  const { fill } = colorToHex(color);

  return (
    <div className={`relative flex items-center justify-center bg-slate-800/60 ${className}`}>
      <BodySvg category={category} fill={fill} />
      {showLabel && (
        <span className="absolute bottom-2 left-2 text-[10px] font-medium uppercase tracking-wider text-slate-400">
          {BODY_LABEL[category]}
          {color ? ` · ${color}` : ''}
        </span>
      )}
    </div>
  );
}
