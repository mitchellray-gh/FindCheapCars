import { initDatabase, getDb } from './client';
import { carListings } from './schema';
import { isNotNull } from 'drizzle-orm';
import { rateDrivetrain, classifyDrivetrain, type DrivetrainType } from '../scoring/drivetrain';

/**
 * Interrogates every listing's drivetrain, classifies it (FWD/RWD/AWD/4WD),
 * rates it, and prints a distribution + rating summary.
 * Run with: npm run drivetrains
 */
async function main() {
  await initDatabase();
  const db = getDb();

  const rows = await db
    .select({ drivetrain: carListings.drivetrain, bodyStyle: carListings.bodyStyle })
    .from(carListings)
    .where(isNotNull(carListings.drivetrain));

  const counts: Record<DrivetrainType, number> = { FWD: 0, RWD: 0, AWD: 0, '4WD': 0, unknown: 0 };
  let totalScore = 0;
  let rated = 0;

  for (const r of rows) {
    const type = classifyDrivetrain(r.drivetrain);
    counts[type]++;
    if (type !== 'unknown') {
      totalScore += rateDrivetrain(r.drivetrain, r.bodyStyle).score;
      rated++;
    }
  }

  const total = rows.length;
  console.log(`\nInterrogated ${total} listings with a reported drivetrain.\n`);
  console.log('Distribution:');
  (['FWD', 'RWD', 'AWD', '4WD', 'unknown'] as DrivetrainType[]).forEach((t) => {
    const n = counts[t];
    const pct = total ? ((n / total) * 100).toFixed(1) : '0.0';
    console.log(`  ${t.padEnd(8)} ${String(n).padStart(4)}  (${pct}%)`);
  });
  console.log(`\nAverage drivetrain score (excl. unknown): ${rated ? (totalScore / rated).toFixed(1) : 'n/a'}\n`);

  console.log('Rating reference:');
  (['FWD', 'AWD', '4WD', 'RWD'] as DrivetrainType[]).forEach((t) => {
    const r = rateDrivetrain(t);
    const m = r.metrics;
    console.log(
      `  ${r.label.padEnd(24)} score ${String(r.score).padStart(3)}  ` +
        `winter ${m.winterTraction}/5  mpg ${m.fuelEconomy}/5  upkeep ${m.maintenanceSimplicity}/5`,
    );
  });
  console.log('');
  process.exit(0);
}

main().catch((err) => {
  console.error('Drivetrain interrogation failed:', err);
  process.exit(1);
});
