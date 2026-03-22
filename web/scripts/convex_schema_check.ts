import fs from "node:fs";
import path from "node:path";

const schemaPath = path.join(process.cwd(), "convex", "schema.ts");
const schema = fs.readFileSync(schemaPath, "utf8");

const requiredTokens = [
  "tasks:",
  "taskEvents:",
  "jobs:",
  "jobRuns:",
  "memoryDocs:",
  "memoryChunks:",
  "activityLog:",
  "idempotencyKey",
  "ingestKey",
  "by_idempotencyKey",
  "by_ingestKey",
  "by_status_updatedAt",
  "by_enabled_nextRunAt",
];

const missing = requiredTokens.filter((token) => !schema.includes(token));

if (missing.length > 0) {
  console.error("Schema check failed. Missing tokens:");
  missing.forEach((token) => console.error(`- ${token}`));
  process.exit(1);
}

console.log("Convex schema check passed.");
console.log(`Checked: ${schemaPath}`);
