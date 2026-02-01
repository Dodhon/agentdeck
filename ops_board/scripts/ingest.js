const { SCHEMA_PATH, parseArgs, runIngest } = require("../lib/ingest");

function main() {
  const args = parseArgs(process.argv.slice(2));
  const { items, warnings } = runIngest(args);

  if (args["dry-run"]) {
    const counts = items.reduce(
      (acc, item) => {
        acc[item.source] = (acc[item.source] || 0) + 1;
        acc.total += 1;
        return acc;
      },
      { total: 0 }
    );

    console.log("Schema:", SCHEMA_PATH);
    console.log("Dry-run counts:", counts);
    if (warnings.length) {
      console.log("Warnings:");
      warnings.forEach((warning) => console.log(`- ${warning}`));
    }
    return;
  }

  console.log(
    "Dry-run only for now. Re-run with --dry-run to see parsed counts."
  );
}

main();
