import { connectDB } from './models/db.js';
import { seedDatabase } from './models/seedHelper.js';

async function runSeed() {
  console.log(' [36m[Seed] Connecting to database... [0m');
  await connectDB();
  await seedDatabase();
  console.log(' [32m[Seed] Completed! [0m');
  process.exit(0);
}

runSeed().catch(err => {
  console.error(' [31m[Seed] Error seeding database: [0m', err);
  process.exit(1);
});
