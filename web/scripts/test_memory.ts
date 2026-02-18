import fs from "node:fs";
import path from "node:path";
import { queryMemory, addMemoryDoc } from "../src/lib/missionControlService";

interface QueryCase {
  id: string;
  query: string;
  min_results: number;
}

interface CoverageRow {
  id: string;
  query: string;
  expectedMinResults: number;
  observedResults: number;
  hasCitationCoverage: boolean;
}

function argValue(flag: string): string | undefined {
  const index = process.argv.indexOf(flag);
  if (index === -1) return undefined;
  return process.argv[index + 1];
}

async function ensureSeedData() {
  await addMemoryDoc(
    {
      sourcePath: "memory_notes/MEMORY.md",
      sourceType: "markdown",
      title: "Mission Control guidance",
      body:
        "Mission Control requires source citations for memory trust. Scheduler checks and task transitions should be auditable.",
    },
    {
      actorType: "user",
      actorId: "memory_test",
      authSource: "internal_system",
    },
  );
}

async function main() {
  const querySetArg =
    argValue("--query-set") || "tests/acceptance/memory-query-set.json";
  const reportArg =
    argValue("--report") || "reports/memory/citation-coverage.json";

  const querySetPath = path.resolve(process.cwd(), querySetArg);
  const reportPath = path.resolve(process.cwd(), reportArg);
  const summaryPath = path.resolve(
    process.cwd(),
    path.join(path.dirname(reportArg), "citation-coverage.md"),
  );

  const queryCases = JSON.parse(
    fs.readFileSync(querySetPath, "utf8"),
  ) as QueryCase[];

  await ensureSeedData();

  const rows: CoverageRow[] = [];
  for (const queryCase of queryCases) {
    const search = await queryMemory(queryCase.query);
    const observed = search.data.length;
    const covered = search.data.some(
      (result) => Boolean(result.sourcePath) && Boolean(result.snippet),
    );

    rows.push({
      id: queryCase.id,
      query: queryCase.query,
      expectedMinResults: queryCase.min_results,
      observedResults: observed,
      hasCitationCoverage: covered,
    });
  }

  const coveredCount = rows.filter((row) => row.hasCitationCoverage).length;
  const coverage = rows.length === 0 ? 0 : coveredCount / rows.length;

  const report = {
    generatedAt: new Date().toISOString(),
    querySetPath: querySetArg,
    coverage,
    totalQueries: rows.length,
    coveredQueries: coveredCount,
    rows,
  };

  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  const summary = [
    "# Memory Citation Coverage",
    "",
    `- Generated: ${report.generatedAt}`,
    `- Query set: ${querySetArg}`,
    `- Coverage: ${(coverage * 100).toFixed(2)}%`,
    `- Covered queries: ${coveredCount}/${rows.length}`,
    "",
    "| ID | Query | Min Results | Observed | Citation Covered |",
    "| --- | --- | --- | --- | --- |",
    ...rows.map(
      (row) =>
        `| ${row.id} | ${row.query} | ${row.expectedMinResults} | ${row.observedResults} | ${row.hasCitationCoverage ? "yes" : "no"} |`,
    ),
    "",
  ].join("\n");

  fs.mkdirSync(path.dirname(summaryPath), { recursive: true });
  fs.writeFileSync(summaryPath, summary, "utf8");

  if (coverage < 0.95) {
    console.error(
      `Citation coverage below threshold: ${(coverage * 100).toFixed(2)}% < 95%`,
    );
    process.exit(1);
  }

  console.log(`Citation coverage OK: ${(coverage * 100).toFixed(2)}%`);
  console.log(`JSON report: ${reportPath}`);
  console.log(`Summary report: ${summaryPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
