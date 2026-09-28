import { getStore } from "../src/lib/store";
import { seedDemo } from "../src/lib/seed";

const store = getStore();

async function main() {
  store.resetAllData();
  await seedDemo(store);
  console.log("Database reset and reseeded.");
}

void main();
