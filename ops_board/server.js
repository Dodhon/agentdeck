const path = require("path");
const crypto = require("crypto");
const express = require("express");
const {
  defaultDbPath,
  openDb,
  fetchItems,
  updateItemStatus,
  upsertAction,
} = require("./lib/storage");
const { loadSessions } = require("./lib/agents");
const { isGatewayEnabled, sendGatewayMessage } = require("./lib/gateway");

const app = express();
const PORT = process.env.PORT || 3333;
const DB_PATH = process.env.DB_PATH || defaultDbPath();
const db = openDb(DB_PATH);

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/items", (req, res) => {
  res.json({ items: fetchItems(db) });
});

app.post("/api/items/:id/status", (req, res) => {
  const { id } = req.params;
  const { status } = req.body || {};
  if (!status) {
    res.status(400).json({ error: "Missing status" });
    return;
  }

  const updated = updateItemStatus(db, id, status);
  if (!updated) {
    res.status(404).json({ error: "Item not found" });
    return;
  }

  res.json({ ok: true });
});

app.get("/api/agents", async (req, res) => {
  const { sessions, error } = await loadSessions();
  res.json({ sessions, error });
});

function createActionId() {
  if (crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return crypto.randomBytes(16).toString("hex");
}

app.post("/api/agents/:id/send", async (req, res) => {
  const { id } = req.params;
  const { message, confirmed } = req.body || {};
  if (!confirmed) {
    res.status(400).json({ error: "Confirmation required" });
    return;
  }
  if (!message) {
    res.status(400).json({ error: "Missing message" });
    return;
  }

  const actionId = createActionId();
  let runId = null;
  let error = null;
  if (isGatewayEnabled()) {
    try {
      const response = await sendGatewayMessage(id, message, actionId);
      if (response && response.runId) {
        runId = response.runId;
      }
    } catch (err) {
      error = err ? err.message || String(err) : "Gateway send failed";
    }
  }

  const action = {
    id: actionId,
    type: "agent.send",
    payload: JSON.stringify({ session_id: id, message, run_id: runId, error }),
    run_id: runId,
    error,
    created_at: new Date().toISOString(),
  };
  upsertAction(db, action);
  if (error) {
    res.status(502).json({ error, runId });
    return;
  }
  res.json({ ok: true, runId });
});

app.listen(PORT, () => {
  console.log(`Ops board UI: http://localhost:${PORT}`);
});
