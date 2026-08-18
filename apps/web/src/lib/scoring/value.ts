export interface ValueInput {
  price: number;
  reliabilityScore: number;
  marketAvgPrice: number | null;
  serviceRecordsCount: number | null;
  daysOnMarket: number | null;
}

export interface ValueResult {
  score: number;
  breakdown: {
    marketComparison: number;
    priceReliabilityRatio: number;
    maintenanceScore: number;
    daysOnMarketScore: number;
  };
}

export function computeValueScore(input: ValueInput): ValueResult {
  let marketComparison: number;
  if (input.marketAvgPrice === null || input.marketAvgPrice === 0) {
    marketComparison = 20;
  } else {
    const ratio = input.price / input.marketAvgPrice;
    if (ratio <= 0.75) marketComparison = 40;
    else if (ratio <= 0.85) marketComparison = 33;
    else if (ratio <= 0.95) marketComparison = 25;
    else if (ratio <= 1.05) marketComparison = 15;
    else if (ratio <= 1.15) marketComparison = 7;
    else marketComparison = 0;
  }

  let priceReliabilityRatio: number;
  if (input.reliabilityScore > 0 && input.price > 0) {
    const ratio = input.price / input.reliabilityScore;
    if (ratio <= 60) priceReliabilityRatio = 30;
    else if (ratio <= 80) priceReliabilityRatio = 22;
    else if (ratio <= 100) priceReliabilityRatio = 14;
    else if (ratio <= 130) priceReliabilityRatio = 7;
    else priceReliabilityRatio = 0;
  } else {
    priceReliabilityRatio = 10;
  }

  let maintenanceScore: number;
  const records = input.serviceRecordsCount ?? 0;
  if (records >= 5) maintenanceScore = 15;
  else if (records >= 2) maintenanceScore = 10;
  else if (records >= 1) maintenanceScore = 5;
  else maintenanceScore = 0;

  let daysOnMarketScore: number;
  if (input.daysOnMarket === null) daysOnMarketScore = 8;
  else if (input.daysOnMarket >= 60) daysOnMarketScore = 15;
  else if (input.daysOnMarket >= 30) daysOnMarketScore = 10;
  else if (input.daysOnMarket >= 14) daysOnMarketScore = 5;
  else daysOnMarketScore = 2;

  const score = Math.min(100, Math.round(marketComparison + priceReliabilityRatio + maintenanceScore + daysOnMarketScore));

  return {
    score,
    breakdown: { marketComparison, priceReliabilityRatio, maintenanceScore, daysOnMarketScore },
  };
}
