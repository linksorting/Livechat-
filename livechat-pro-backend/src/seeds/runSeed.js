import { connectDatabase } from "../config/db.js";
import { seedDemo } from "../services/seed.service.js";

async function run() {
  await connectDatabase();
  await seedDemo();
  process.exit(0);
}

run().catch((error) => {
  console.error("Seed failed", error);
  process.exit(1);
});
