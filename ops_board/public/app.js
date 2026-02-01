const lists = {
  today: document.getElementById("today-list"),
  next: document.getElementById("next-list"),
  done: document.getElementById("done-list"),
};

const agentsList = document.getElementById("agents-list");
const selectedAgent = document.getElementById("selected-agent");
const agentMessage = document.getElementById("agent-message");
const agentSendButton = document.getElementById("agent-send-button");
let selectedSessionId = null;

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

function renderAgents(sessions) {
  agentsList.textContent = "";
  if (!sessions || sessions.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.textContent =
      "No sessions configured. Set AGENT_SESSIONS_PATH to a sessions.json file.";
    agentsList.appendChild(empty);
    return;
  }

  sessions.forEach((session) => {
    const card = document.createElement("div");
    card.className = "card";

    const title = document.createElement("div");
    title.className = "card-title";
    title.textContent = session.title || session.id;
    card.appendChild(title);

    const meta = document.createElement("div");
    meta.className = "card-meta";
    meta.textContent = session.last_message || "No messages yet";
    card.appendChild(meta);

    const actions = document.createElement("div");
    actions.className = "card-actions";
    const selectBtn = document.createElement("button");
    selectBtn.textContent = "Select";
    selectBtn.onclick = () => {
      selectedSessionId = session.id;
      selectedAgent.textContent = `Selected: ${session.id}`;
    };
    actions.appendChild(selectBtn);
    card.appendChild(actions);

    if (Array.isArray(session.history) && session.history.length > 0) {
      const history = document.createElement("div");
      history.className = "card-meta";
      history.textContent = session.history
        .map((entry) => `${entry.role || "note"}: ${entry.content}`)
        .join(" | ");
      card.appendChild(history);
    }

    agentsList.appendChild(card);
  });
}

async function loadAgents() {
  const response = await fetch("/api/agents");
  const data = await response.json();
  renderAgents(data.sessions);
}

agentSendButton.onclick = async () => {
  if (!selectedSessionId) {
    alert("Select a session first.");
    return;
  }
  const message = agentMessage.value.trim();
  if (!message) {
    alert("Enter a task message.");
    return;
  }
  const confirmed = confirm("Send this task to the selected session?");
  if (!confirmed) return;

  await fetch(`/api/agents/${selectedSessionId}/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, confirmed: true }),
  });
  agentMessage.value = "";
};

loadItems();
loadAgents();
