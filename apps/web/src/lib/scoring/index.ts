import { computeReliabilityScore, ReliabilityInput, ReliabilityResult } from './reliability';
import { computeValueScore, ValueInput, ValueResult } from './value';

export { computeReliabilityScore, type ReliabilityInput, type ReliabilityResult } from './reliability';
export { computeValueScore, type ValueInput, type ValueResult } from './value';

export function computeCompositeScore(reliability: number, value: number): { composite: number; tier: string } {
  const composite = Math.round((0.6 * reliability + 0.4 * value) * 10) / 10;
  let tier: string;
  if (composite >= 80) tier = 'top_pick';
  else if (composite >= 65) tier = 'great_value';
  else if (composite >= 50) tier = 'worth_considering';
  else tier = 'proceed_with_caution';
  return { composite, tier };
}
