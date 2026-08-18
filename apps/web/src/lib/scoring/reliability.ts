export interface ReliabilityInput {
  make: string;
  model: string;
  modelYear: number;
  mileage: number | null;
  titleStatus: string | null;
  numOwners: number | null;
  accidentCount: number | null;
  baseReliabilityScore: number;
}

export interface ReliabilityResult {
  score: number;
  breakdown: {
    baseReliability: number;
    mileageScore: number;
    titleScore: number;
    ownershipScore: number;
    accidentScore: number;
  };
}

export function computeReliabilityScore(input: ReliabilityInput): ReliabilityResult {
  const currentYear = new Date().getFullYear();

  const baseReliability = input.baseReliabilityScore * 35;

  let mileageScore: number;
  if (input.mileage === null) {
    mileageScore = 12;
  } else {
    const age = currentYear - input.modelYear;
    const expectedMileage = Math.max(age * 12000, 1);
    const ratio = input.mileage / expectedMileage;
    if (ratio <= 0.7) mileageScore = 25;
    else if (ratio <= 0.9) mileageScore = 20;
    else if (ratio <= 1.1) mileageScore = 15;
    else if (ratio <= 1.3) mileageScore = 10;
    else if (ratio <= 1.5) mileageScore = 6;
    else mileageScore = 0;
  }

  const titleMap: Record<string, number> = {
    clean: 15, rebuilt: 4, salvage: 0, flood: 0, lemon: 0,
  };
  const titleScore = input.titleStatus ? (titleMap[input.titleStatus.toLowerCase()] ?? 8) : 8;

  let ownershipScore: number;
  if (input.numOwners === null) ownershipScore = 7;
  else if (input.numOwners === 1) ownershipScore = 15;
  else if (input.numOwners === 2) ownershipScore = 11;
  else if (input.numOwners === 3) ownershipScore = 6;
  else ownershipScore = 2;

  let accidentScore: number;
  if (input.accidentCount === null) accidentScore = 5;
  else if (input.accidentCount === 0) accidentScore = 10;
  else if (input.accidentCount === 1) accidentScore = 5;
  else accidentScore = 0;

  const score = Math.min(100, Math.round(baseReliability + mileageScore + titleScore + ownershipScore + accidentScore));

  return {
    score,
    breakdown: { baseReliability, mileageScore, titleScore, ownershipScore, accidentScore },
  };
}
