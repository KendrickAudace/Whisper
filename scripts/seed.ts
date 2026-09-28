import { getStore } from "../src/lib/store";
import { seedDemo } from "../src/lib/seed";

const store = getStore();

async function main() {
  await seedDemo(store);
  console.log("Demo data seeded.");
}

void main();
