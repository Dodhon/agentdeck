const fs = require("fs");
const path = require("path");
const { parseArgs, runIngest } = require("../lib/ingest");
const {
  defaultDbPath,
  openDb,
  upsertItems,
  fetchItems,
  fetchActions,
} = require("../lib/storage");

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function snapshotPath(outputDir) {
  const date = new Date().toISOString().slice(0, 10);
  return path.join(outputDir, `${date}.json`);
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const { items, warnings } = runIngest(args);
  const dbPath = args.db || defaultDbPath();
  const outputDir =
    args["output-dir"] ||
    path.resolve(__dirname, "..", "..", "reports", "ops-board");

  const db = openDb(dbPath);
  upsertItems(db, items);

  const snapshot = {
    generated_at: new Date().toISOString(),
    items: fetchItems(db),
    actions: fetchActions(db),
    warnings,
  };

  ensureDir(outputDir);
  const outputPath = snapshotPath(outputDir);
  fs.writeFileSync(outputPath, JSON.stringify(snapshot, null, 2));
  console.log(`Snapshot written: ${outputPath}`);
}

main();
