const { parseArgs, runIngest, SCHEMA_PATH } = require("../lib/ingest");

function main() {
  const args = parseArgs(process.argv.slice(2));
  const { items, warnings } = runIngest(args);
  const counts = items.reduce(
    (acc, item) => {
      acc[item.source] = (acc[item.source] || 0) + 1;
      acc.total += 1;
      return acc;
    },
    { total: 0 }
  );

  console.log("Schema:", SCHEMA_PATH);
  console.log("Validation counts:", counts);
  if (warnings.length) {
    console.log("Warnings:");
    warnings.forEach((warning) => console.log(`- ${warning}`));
  }

  if (counts.total === 0) {
    console.error("Validation failed: no items found.");
    process.exit(1);
  }
}

main();
