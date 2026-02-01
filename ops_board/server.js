const path = require("path");
const express = require("express");
const {
  defaultDbPath,
  openDb,
  fetchItems,
  updateItemStatus,
} = require("./lib/storage");

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

app.listen(PORT, () => {
  console.log(`Ops board UI: http://localhost:${PORT}`);
});
