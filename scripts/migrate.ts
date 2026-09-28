import { getStore } from "../src/lib/store";

const store = getStore();
store.migrate();
console.log("Database migrated.");
