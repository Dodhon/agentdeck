const lists = {
  today: document.getElementById("today-list"),
  next: document.getElementById("next-list"),
  done: document.getElementById("done-list"),
};

function bucketForStatus(status) {
  if (status === "next") return "next";
  if (status === "done") return "done";
  return "today";
}

function createCard(item) {
  const card = document.createElement("div");
  card.className = "card";

  const title = document.createElement("div");
  title.className = "card-title";
  title.textContent = item.title;
  card.appendChild(title);

  const meta = document.createElement("div");
  meta.className = "card-meta";
  meta.textContent = `${item.source} · ${item.kind || "unknown"}`;
  card.appendChild(meta);

  const actions = document.createElement("div");
  actions.className = "card-actions";

  const nextBtn = document.createElement("button");
  nextBtn.textContent = "Mark Next";
  nextBtn.onclick = () => updateStatus(item.id, "next");
  actions.appendChild(nextBtn);

  const doneBtn = document.createElement("button");
  doneBtn.textContent = "Mark Done";
  doneBtn.onclick = () => updateStatus(item.id, "done");
  actions.appendChild(doneBtn);

  card.appendChild(actions);
  return card;
}

function clearLists() {
  Object.values(lists).forEach((list) => {
    list.textContent = "";
  });
}

async function loadItems() {
  const response = await fetch("/api/items");
  const data = await response.json();
  clearLists();

  if (!data.items || data.items.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.textContent = "No items yet. Run the ingest snapshot script first.";
    lists.today.appendChild(empty);
    return;
  }

  data.items.forEach((item) => {
    const bucket = bucketForStatus(item.status);
    lists[bucket].appendChild(createCard(item));
  });
}

async function updateStatus(id, status) {
  await fetch(`/api/items/${id}/status`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  await loadItems();
}

loadItems();
