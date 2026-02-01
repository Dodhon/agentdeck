const crypto = require("crypto");
const WebSocket = require("ws");

const PROTOCOL_VERSION = 3;
const DEFAULT_TIMEOUT_MS = 8000;

function createId() {
  if (crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return crypto.randomBytes(16).toString("hex");
}

function getEnvBool(value) {
  if (!value) return false;
  return value === "1" || value.toLowerCase() === "true";
}

function isGatewayEnabled() {
  return getEnvBool(process.env.OPENCLAW_GATEWAY_ENABLED);
}

function getGatewayUrl() {
  return process.env.OPENCLAW_GATEWAY_URL;
}

function getGatewayAuth() {
  const token = process.env.OPENCLAW_GATEWAY_TOKEN;
  if (token) {
    return { token };
  }
  const password = process.env.OPENCLAW_GATEWAY_PASSWORD;
  if (password) {
    return { password };
  }
  return null;
}

function getGatewayScopes() {
  const raw = process.env.OPENCLAW_GATEWAY_SCOPES || "operator.read,operator.write";
  return raw
    .split(",")
    .map((scope) => scope.trim())
    .filter(Boolean);
}

function buildConnectParams() {
  const auth = getGatewayAuth();
  const params = {
    minProtocol: PROTOCOL_VERSION,
    maxProtocol: PROTOCOL_VERSION,
    client: {
      id: "agentdeck",
      version: "0.1.0",
      platform: process.platform,
      mode: "operator",
    },
    role: "operator",
    scopes: getGatewayScopes(),
    caps: [],
    commands: [],
    permissions: {},
    locale: "en-US",
    userAgent: "agentdeck/0.1.0",
  };
  if (auth) {
    params.auth = auth;
  }
  return params;
}

function parseJsonMessage(raw) {
  try {
    return JSON.parse(raw);
  } catch (error) {
    return null;
  }
}

function waitForResponse(ws, requestId, timeoutMs) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error("Gateway request timed out"));
    }, timeoutMs);

    function cleanup() {
      clearTimeout(timeout);
      ws.off("message", onMessage);
      ws.off("close", onClose);
      ws.off("error", onError);
    }

    function onError(err) {
      cleanup();
      reject(err);
    }

    function onClose() {
      cleanup();
      reject(new Error("Gateway socket closed"));
    }

    function onMessage(data) {
      const message = parseJsonMessage(data.toString());
      if (!message || message.type !== "res" || message.id !== requestId) {
        return;
      }
      cleanup();
      if (!message.ok) {
        reject(
          new Error(
            message.error?.message || message.error || "Gateway request failed"
          )
        );
        return;
      }
      resolve(message.payload);
    }

    ws.on("message", onMessage);
    ws.on("close", onClose);
    ws.on("error", onError);
  });
}

async function connectGateway(timeoutMs) {
  const url = getGatewayUrl();
  if (!url) {
    throw new Error("Missing OPENCLAW_GATEWAY_URL");
  }
  const params = buildConnectParams();

  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url);
    let connectSent = false;

    const timeout = setTimeout(() => {
      ws.close();
      reject(new Error("Gateway connect timed out"));
    }, timeoutMs);

    function cleanup() {
      clearTimeout(timeout);
      ws.off("message", onMessage);
      ws.off("open", onOpen);
      ws.off("error", onError);
      ws.off("close", onClose);
    }

    function sendConnect() {
      if (connectSent) return;
      connectSent = true;
      const connectId = createId();
      ws.send(
        JSON.stringify({ type: "req", id: connectId, method: "connect", params })
      );
      waitForResponse(ws, connectId, timeoutMs)
        .then(() => {
          cleanup();
          resolve(ws);
        })
        .catch((error) => {
          cleanup();
          ws.close();
          reject(error);
        });
    }

    function onOpen() {
      setTimeout(() => {
        if (!connectSent) {
          sendConnect();
        }
      }, 30);
    }

    function onError(error) {
      cleanup();
      reject(error);
    }

    function onClose() {
      cleanup();
      reject(new Error("Gateway socket closed before connect"));
    }

    function onMessage(data) {
      const message = parseJsonMessage(data.toString());
      if (!message) {
        return;
      }
      if (message.type === "event" && message.event === "connect.challenge") {
        sendConnect();
      }
    }

    ws.on("open", onOpen);
    ws.on("message", onMessage);
    ws.on("error", onError);
    ws.on("close", onClose);
  });
}

async function callGateway(method, params) {
  const ws = await connectGateway(DEFAULT_TIMEOUT_MS);
  const requestId = createId();
  ws.send(JSON.stringify({ type: "req", id: requestId, method, params }));
  try {
    return await waitForResponse(ws, requestId, DEFAULT_TIMEOUT_MS);
  } finally {
    ws.close();
  }
}

function extractSessions(payload) {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.sessions)) return payload.sessions;
  return [];
}

function getValueByPath(obj, path) {
  if (!path) return undefined;
  const segments = path.split(".");
  let current = obj;
  for (const segment of segments) {
    if (!current || typeof current !== "object") {
      return undefined;
    }
    current = current[segment];
  }
  return current;
}

function normalizeGatewaySessions(rawSessions) {
  const idField = process.env.OPENCLAW_SESSION_ID_FIELD;
  if (!idField) {
    return {
      sessions: [],
      error: "Missing OPENCLAW_SESSION_ID_FIELD for Gateway sessions",
    };
  }

  const titleField = process.env.OPENCLAW_SESSION_TITLE_FIELD;
  const agentField = process.env.OPENCLAW_SESSION_AGENT_FIELD;
  const lastMessageField = process.env.OPENCLAW_SESSION_LAST_MESSAGE_FIELD;
  const lastActiveField = process.env.OPENCLAW_SESSION_LAST_ACTIVE_FIELD;

  const sessions = [];
  rawSessions.forEach((session) => {
    const idValue = getValueByPath(session, idField);
    if (!idValue) {
      return;
    }
    const lastMessageValue = getValueByPath(session, lastMessageField);
    sessions.push({
      id: String(idValue),
      title: titleField ? getValueByPath(session, titleField) : undefined,
      agent: agentField ? getValueByPath(session, agentField) : undefined,
      last_message:
        typeof lastMessageValue === "string"
          ? lastMessageValue
          : lastMessageValue
          ? JSON.stringify(lastMessageValue)
          : undefined,
      last_active: lastActiveField
        ? getValueByPath(session, lastActiveField)
        : undefined,
      source: "gateway",
    });
  });

  return { sessions, error: null };
}

async function listGatewaySessions() {
  const payload = await callGateway("sessions.list", {});
  return extractSessions(payload);
}

function getChatSendParamConfig() {
  return {
    sessionField: process.env.OPENCLAW_CHAT_SEND_SESSION_FIELD || "sessionKey",
    messageField: process.env.OPENCLAW_CHAT_SEND_MESSAGE_FIELD || "message",
  };
}

async function sendGatewayMessage(sessionId, message, idempotencyKey) {
  const { sessionField, messageField } = getChatSendParamConfig();
  const params = {
    [sessionField]: sessionId,
    [messageField]: message,
    idempotencyKey,
  };
  return callGateway("chat.send", params);
}

module.exports = {
  isGatewayEnabled,
  getGatewayUrl,
  listGatewaySessions,
  normalizeGatewaySessions,
  sendGatewayMessage,
  getEnvBool,
};
