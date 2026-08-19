export type DrivetrainType = 'FWD' | 'RWD' | 'AWD' | '4WD' | 'unknown';

export interface DrivetrainRating {
  type: DrivetrainType;
  label: string;
  /** 0–100 overall suitability for a budget/daily-driver context. */
  score: number;
  pros: string[];
  cons: string[];
  /** Sub-ratings on a 1–5 scale for quick comparison. */
  metrics: {
    winterTraction: number;
    fuelEconomy: number;
    maintenanceSimplicity: number;
    reliability: number;
    performance: number;
  };
  summary: string;
}

/** Normalize a free-text drivetrain string (from listings or NHTSA) to a type. */
export function classifyDrivetrain(raw?: string | null): DrivetrainType {
  const s = (raw || '').toLowerCase();
  if (!s) return 'unknown';
  // Order matters: check 4WD/AWD before plain "wd" fallbacks.
  if (/\b4wd\b|4x4|four[-\s]?wheel|4-wheel/.test(s)) return '4WD';
  if (/\bawd\b|all[-\s]?wheel/.test(s)) return 'AWD';
  if (/\brwd\b|rear[-\s]?wheel/.test(s)) return 'RWD';
  if (/\bfwd\b|front[-\s]?wheel/.test(s)) return 'FWD';
  return 'unknown';
}

const RATINGS: Record<DrivetrainType, DrivetrainRating> = {
  FWD: {
    type: 'FWD',
    label: 'Front-Wheel Drive',
    score: 82,
    pros: ['Best fuel economy', 'Cheapest to maintain', 'Good traction in rain/light snow', 'More interior space'],
    cons: ['Torque steer on powerful engines', 'Less balanced handling', 'Front tires wear faster'],
    metrics: { winterTraction: 3, fuelEconomy: 5, maintenanceSimplicity: 5, reliability: 5, performance: 3 },
    summary:
      'The value pick for a daily driver: simplest, cheapest to own, and efficient. Fine for most climates; struggles only in deep snow or off-road.',
  },
  RWD: {
    type: 'RWD',
    label: 'Rear-Wheel Drive',
    score: 68,
    pros: ['Balanced handling', 'Better for towing/performance', 'Even tire wear', 'Simple, durable layout'],
    cons: ['Worst traction in snow/ice without care', 'Slightly lower fuel economy'],
    metrics: { winterTraction: 2, fuelEconomy: 4, maintenanceSimplicity: 4, reliability: 4, performance: 5 },
    summary:
      'Great for driving feel, towing, and durability, but poor in winter without good tires. Common on trucks and sportier/luxury sedans.',
  },
  AWD: {
    type: 'AWD',
    label: 'All-Wheel Drive',
    score: 74,
    pros: ['Excellent all-weather traction', 'Confident in rain and snow', 'No driver input needed'],
    cons: ['Higher fuel consumption', 'More components to fail (diffs, couplings)', 'Costlier repairs', 'More tire matching required'],
    metrics: { winterTraction: 5, fuelEconomy: 3, maintenanceSimplicity: 2, reliability: 3, performance: 4 },
    summary:
      'Best everyday traction for snow/rain climates, at the cost of efficiency and more expensive upkeep. Watch for neglected AWD service on used units.',
  },
  '4WD': {
    type: '4WD',
    label: 'Four-Wheel Drive (4x4)',
    score: 70,
    pros: ['Best off-road/deep-snow capability', 'Selectable — can run 2WD to save fuel', 'Rugged, truck-grade parts'],
    cons: ['Heaviest and thirstiest', 'Complex transfer case', 'Overkill for pavement-only use'],
    metrics: { winterTraction: 5, fuelEconomy: 2, maintenanceSimplicity: 2, reliability: 3, performance: 4 },
    summary:
      'Made for trucks/SUVs that actually go off-road or see heavy snow. Capable but heavy and costly to run; unnecessary for pure city driving.',
  },
  unknown: {
    type: 'unknown',
    label: 'Unknown',
    score: 0,
    pros: [],
    cons: ['Drivetrain not reported for this listing'],
    metrics: { winterTraction: 0, fuelEconomy: 0, maintenanceSimplicity: 0, reliability: 0, performance: 0 },
    summary: 'Drivetrain could not be determined from the listing or VIN.',
  },
};

/** Rate a drivetrain, lightly adjusting for body style context (e.g. AWD is more valuable on an SUV). */
export function rateDrivetrain(raw?: string | null, bodyStyle?: string | null): DrivetrainRating {
  const type = classifyDrivetrain(raw);
  const base = RATINGS[type];
  if (type === 'unknown') return base;

  const body = (bodyStyle || '').toLowerCase();
  const isTruckSuv = /suv|crossover|truck|pickup|sport utility/.test(body);
  const isCar = /sedan|coupe|hatchback|wagon|convertible/.test(body);

  let score = base.score;
  // Context nudges: AWD/4WD add more value on trucks/SUVs; 4WD is overkill on a car.
  if ((type === 'AWD' || type === '4WD') && isTruckSuv) score += 4;
  if (type === '4WD' && isCar) score -= 6;
  if (type === 'RWD' && isCar) score += 3; // RWD car = sportier intent

  return { ...base, score: Math.max(0, Math.min(100, score)) };
}
