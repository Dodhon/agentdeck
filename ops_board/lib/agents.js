const fs = require("fs");
const path = require("path");
const os = require("os");
const {
  isGatewayEnabled,
  listGatewaySessions,
  normalizeGatewaySessions,
  getEnvBool,
} = require("./gateway");

const DEFAULT_SESSIONS_PATH = path.resolve(
  __dirname,
  "..",
  "agent",
  "sessions.json"
);
let detectedAgentName = null;

function resolveSessionsPath(envPath) {
  if (!envPath) {
    const detected = detectOpenClawSessionsPath();
    if (detected) {
      detectedAgentName = detected.agentName;
      return resolveSessionsPath(detected.path);
    }
    return DEFAULT_SESSIONS_PATH;
  }
  try {
    const stat = fs.statSync(envPath);
    if (stat.isDirectory()) {
      return path.join(envPath, "sessions.json");
    }
  } catch (error) {
    if (error && error.code === "ENOENT") {
      return envPath;
    }
    throw error;
  }
  return envPath;
}

function inferAgentNameFromPath(filePath) {
  if (!filePath) return null;
  const match = filePath.match(/\/\.openclaw\/agents\/([^/]+)/);
  return match ? match[1] : null;
}

function detectOpenClawSessionsPath() {
  const home = os.homedir();
  if (!home) return null;
  const agentsRoot = path.join(home, ".openclaw", "agents");
  if (!fs.existsSync(agentsRoot)) return null;

  let entries;
  try {
    entries = fs
      .readdirSync(agentsRoot, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name);
  } catch (error) {
    return null;
  }

  const preferred = ["main", "main2"];
  const ordered = [
    ...preferred.filter((name) => entries.includes(name)),
    ...entries.filter((name) => !preferred.includes(name)).sort(),
  ];

  for (const name of ordered) {
    const agentDir = path.join(agentsRoot, name);
    const sessionsDir = path.join(agentDir, "sessions");
    const sessionsFile = path.join(agentDir, "sessions.json");
    if (fs.existsSync(sessionsDir)) {
      return { path: sessionsDir, agentName: name };
    }
    if (fs.existsSync(sessionsFile)) {
      return { path: sessionsFile, agentName: name };
    }
  }

  return null;
}

function parseFirstJsonObject(raw) {
  let depth = 0;
  let inString = false;
  let escaped = false;
  let start = -1;

  for (let i = 0; i < raw.length; i += 1) {
    const char = raw[i];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }

    if (char === "{") {
      if (start === -1) {
        start = i;
      }
      depth += 1;
    } else if (char === "}") {
      depth -= 1;
      if (depth === 0 && start !== -1) {
        const slice = raw.slice(start, i + 1);
        return JSON.parse(slice);
      }
    }
  }

  return null;
}

function loadFileSessions() {
  const sessionsPath = resolveSessionsPath(process.env.AGENT_SESSIONS_PATH);
  const agentName =
    detectedAgentName || inferAgentNameFromPath(sessionsPath) || null;
  const normalizeSession = (session) => {
    if (!session || typeof session !== "object") {
      return session;
    }
    const normalized = { ...session };
    if (!normalized.id && normalized.sessionId) {
      normalized.id = normalized.sessionId;
    }
    if (agentName && !normalized.agent) {
      normalized.agent = agentName;
    }
    return normalized;
  };
  try {
    const raw = fs.readFileSync(sessionsPath, "utf8");
    let json;
    try {
      json = JSON.parse(raw);
    } catch (error) {
      json = parseFirstJsonObject(raw);
    }
    if (json && Array.isArray(json.sessions)) {
      return json.sessions.map(normalizeSession);
    }
    if (json && typeof json === "object") {
      const values = Object.values(json);
      return values.map(normalizeSession);
    }
  } catch (error) {
    if (error && error.code === "ENOENT") {
      return [];
    }
    throw error;
  }
  return [];
}

async function loadSessions() {
  if (!isGatewayEnabled()) {
    return { sessions: loadFileSessions(), error: null };
  }

  try {
    const rawSessions = await listGatewaySessions();
    const normalized = normalizeGatewaySessions(rawSessions);
    if (normalized.error) {
      if (getEnvBool(process.env.OPENCLAW_GATEWAY_FALLBACK)) {
        return { sessions: loadFileSessions(), error: normalized.error };
      }
      return { sessions: [], error: normalized.error };
    }
    return { sessions: normalized.sessions, error: null };
  } catch (error) {
    const message = error ? error.message || String(error) : "Gateway error";
    if (getEnvBool(process.env.OPENCLAW_GATEWAY_FALLBACK)) {
      return { sessions: loadFileSessions(), error: message };
    }
    return { sessions: [], error: message };
  }
}

module.exports = {
  loadSessions,
  DEFAULT_SESSIONS_PATH,
};
