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

app.get("/api/agents", (req, res) => {
  res.json({ sessions: loadSessions() });
});

function createActionId() {
  if (crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return crypto.randomBytes(16).toString("hex");
}

app.post("/api/agents/:id/send", (req, res) => {
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

  const action = {
    id: createActionId(),
    type: "agent.send",
    payload: JSON.stringify({ session_id: id, message }),
    created_at: new Date().toISOString(),
  };
  upsertAction(db, action);
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`Ops board UI: http://localhost:${PORT}`);
});
