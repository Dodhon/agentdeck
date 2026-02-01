const fs = require("fs");
const path = require("path");

const DEFAULT_SESSIONS_PATH = path.resolve(
  __dirname,
  "..",
  "agent",
  "sessions.json"
);

function loadSessions() {
  const sessionsPath = process.env.AGENT_SESSIONS_PATH || DEFAULT_SESSIONS_PATH;
  try {
    const raw = fs.readFileSync(sessionsPath, "utf8");
    const json = JSON.parse(raw);
    if (json && Array.isArray(json.sessions)) {
      return json.sessions;
    }
  } catch (error) {
    if (error && error.code === "ENOENT") {
      return [];
    }
    throw error;
  }
  return [];
}

module.exports = {
  loadSessions,
  DEFAULT_SESSIONS_PATH,
};
