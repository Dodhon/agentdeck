const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const SCHEMA_PATH = path.resolve(__dirname, "..", "schema.md");

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg.startsWith("--")) {
      const key = arg.slice(2);
      const next = argv[i + 1];
      if (!next || next.startsWith("--")) {
        args[key] = true;
      } else {
        args[key] = next;
        i += 1;
      }
    }
  }
  return args;
}

function stableId(parts) {
  return crypto
    .createHash("sha256")
    .update(parts.join("|"))
    .digest("hex")
    .slice(0, 16);
}

function readTextIfExists(filePath, warnings) {
  try {
    return fs.readFileSync(filePath, "utf8");
  } catch (error) {
    if (error && error.code === "ENOENT") {
      warnings.push(`Missing file: ${filePath}`);
      return null;
    }
    throw error;
  }
}

function listFilesIfExists(dirPath, warnings) {
  try {
    return fs.readdirSync(dirPath);
  } catch (error) {
    if (error && error.code === "ENOENT") {
      warnings.push(`Missing directory: ${dirPath}`);
      return [];
    }
    throw error;
  }
}

function extractMarkdownItems(text) {
  const lines = text.split(/\r?\n/);
  const items = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      items.push(trimmed.slice(2).trim());
      continue;
    }
    if (/^\d+\.\s+/.test(trimmed)) {
      items.push(trimmed.replace(/^\d+\.\s+/, "").trim());
    }
  }
  return items;
}

function parseBriefly(brieflyDir, warnings) {
  const files = listFilesIfExists(brieflyDir, warnings).filter((name) =>
    name.endsWith(".md")
  );
  const items = [];
  for (const file of files) {
    const fullPath = path.join(brieflyDir, file);
    const contents = readTextIfExists(fullPath, warnings);
    if (contents === null) continue;
    const firstLine = contents
      .split(/\r?\n/)
      .map((line) => line.trim())
      .find((line) => line.length > 0);
    const title = firstLine
      ? firstLine.replace(/^#+\s*/, "")
      : path.basename(file, ".md");
    items.push({
      id: stableId(["briefly", fullPath, title]),
      source: "briefly",
      source_path: fullPath,
      title,
      status: "today",
      kind: "summary",
      raw: firstLine || "",
    });
  }
  return items;
}

function parseMissionControl(missionDir, warnings) {
  const items = [];
  const tasksPath = path.join(missionDir, "tasks.json");
  const workingPath = path.join(missionDir, "WORKING.md");
  const tasksText = readTextIfExists(tasksPath, warnings);
  if (tasksText) {
    let parsed = [];
    try {
      const json = JSON.parse(tasksText);
      if (Array.isArray(json)) {
        parsed = json;
      } else if (json && Array.isArray(json.tasks)) {
        parsed = json.tasks;
      }
    } catch (error) {
      warnings.push(`Invalid JSON: ${tasksPath}`);
    }
    parsed.forEach((task, index) => {
      if (typeof task === "string") {
        items.push({
          id: stableId(["mission_control", tasksPath, task, String(index)]),
          source: "mission_control",
          source_path: tasksPath,
          title: task,
          status: "today",
          kind: "task",
          raw: task,
        });
        return;
      }
      const title = task.title || task.name || task.summary;
      if (!title) return;
      const taskId = task.id ? String(task.id) : String(index);
      items.push({
        id: stableId(["mission_control", tasksPath, title, taskId]),
        source: "mission_control",
        source_path: tasksPath,
        title,
        status: "today",
        kind: "task",
        raw: JSON.stringify(task),
      });
    });
  }

  const workingText = readTextIfExists(workingPath, warnings);
  if (workingText) {
    const bullets = extractMarkdownItems(workingText);
    bullets.forEach((title, index) => {
      items.push({
        id: stableId(["mission_control", workingPath, title, String(index)]),
        source: "mission_control",
        source_path: workingPath,
        title,
        status: "today",
        kind: "note",
        raw: title,
      });
    });
  }

  return items;
}

function parseMemory(memoryFile, warnings) {
  const text = readTextIfExists(memoryFile, warnings);
  if (!text) return [];
  const bullets = extractMarkdownItems(text);
  return bullets.map((title, index) => ({
    id: stableId(["memory", memoryFile, title, String(index)]),
    source: "memory",
    source_path: memoryFile,
    title,
    status: "today",
    kind: "note",
    raw: title,
  }));
}

function buildPaths(args) {
  const sourceRoot = args["source-root"] || process.env.SOURCE_ROOT;
  const brieflyDir =
    args["briefly-dir"] ||
    (sourceRoot ? path.join(sourceRoot, "briefly", "briefs_out") : null);
  const missionDir =
    args["mission-control-dir"] ||
    (sourceRoot ? path.join(sourceRoot, "mission_control") : null);
  const memoryFile =
    args["memory-file"] ||
    (sourceRoot
      ? path.join(sourceRoot, "memory", "memory-clarifications.md")
      : null);

  return { sourceRoot, brieflyDir, missionDir, memoryFile };
}

function validatePaths(paths) {
  if (!paths.brieflyDir || !paths.missionDir || !paths.memoryFile) {
    const detail = [
      "--source-root",
      "--briefly-dir",
      "--mission-control-dir",
      "--memory-file",
    ].join(" ");
    throw new Error(
      `Missing source paths. Provide ${detail} or set SOURCE_ROOT.`
    );
  }
}

function runIngest(args) {
  const paths = buildPaths(args);
  validatePaths(paths);

  const warnings = [];
  const items = [
    ...parseBriefly(paths.brieflyDir, warnings),
    ...parseMissionControl(paths.missionDir, warnings),
    ...parseMemory(paths.memoryFile, warnings),
  ];

  return { items, warnings };
}

module.exports = {
  SCHEMA_PATH,
  parseArgs,
  runIngest,
  validatePaths,
};
