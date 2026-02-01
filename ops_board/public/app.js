const lists = {
  today: document.getElementById("today-list"),
  next: document.getElementById("next-list"),
  done: document.getElementById("done-list"),
};

const agentsList = document.getElementById("agents-list");
const selectedAgent = document.getElementById("selected-agent");
const agentMessage = document.getElementById("agent-message");
const agentSendButton = document.getElementById("agent-send-button");
const agentSearch = document.getElementById("agent-search");
const agentFilter = document.getElementById("agent-filter");
const sourceFilter = document.getElementById("source-filter");
let selectedSessionId = null;
let allSessions = [];
let lastAgentError = null;

function bucketForStatus(status) {
  if (status === "next") return "next";
  if (status === "done") return "done";
  return "today";
}

function createCard(item) {
  const card = document.createElement("div");
  card.className = "card";
  if (item.status === "next") {
    card.classList.add("card--status-next");
  }
  if (item.status === "done") {
    card.classList.add("card--status-done");
  }

  const title = document.createElement("div");
  title.className = "card-title";
  title.textContent = item.title;
  card.appendChild(title);

  const meta = document.createElement("div");
  meta.className = "card-meta";
  const updatedAt = item.updated_at
    ? new Date(item.updated_at).toLocaleString()
    : "unknown";
  meta.textContent = `${item.source} · ${item.kind || "unknown"} · ${updatedAt}`;
  card.appendChild(meta);

  const path = document.createElement("div");
  path.className = "card-path";
  path.textContent = item.source_path || "unknown source";
  card.appendChild(path);

  if (item.raw) {
    const detail = document.createElement("div");
    detail.className = "card-detail";
    detail.textContent = item.raw.slice(0, 180);
    card.appendChild(detail);
  }

  const actions = document.createElement("div");
  actions.className = "card-actions";

  const nextBtn = document.createElement("button");
  nextBtn.className = "btn btn--primary";
  nextBtn.textContent = "Mark Next";
  nextBtn.onclick = () => updateStatus(item.id, "next");
  actions.appendChild(nextBtn);

  const doneBtn = document.createElement("button");
  doneBtn.className = "btn btn--ghost";
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

function renderAgents(sessions, error) {
  agentsList.textContent = "";
  lastAgentError = error || null;
  if (error) {
    const warning = document.createElement("div");
    warning.className = "empty";
    warning.textContent = `Gateway error: ${error}`;
    agentsList.appendChild(warning);
  }
  if (!sessions || sessions.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.textContent =
      "No sessions available. Configure Gateway or enable fallback sessions.";
    agentsList.appendChild(empty);
    return;
  }

  sessions.forEach((session) => {
    const card = document.createElement("div");
    card.className = "card card--agent";

    const title = document.createElement("div");
    title.className = "card-title";
    title.textContent = session.title || session.id;
    card.appendChild(title);

    const meta = document.createElement("div");
    meta.className = "card-meta";
    const lastMessage = session.last_message || "No messages yet";
    const labels = [];
    if (session.agent) labels.push(session.agent);
    if (session.source) labels.push(session.source);
    const labelText = labels.length > 0 ? `${labels.join(" · ")} · ` : "";
    meta.textContent = `${labelText}${lastMessage}`;
    card.appendChild(meta);

    const actions = document.createElement("div");
    actions.className = "card-actions";
    const selectBtn = document.createElement("button");
    selectBtn.className = "btn";
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

function normalizeSearchValue(value) {
  if (!value) return "";
  return String(value).toLowerCase();
}

function updateFilterOptions(sessions) {
  const agentValues = new Set();
  const sourceValues = new Set();

  sessions.forEach((session) => {
    if (session.agent) {
      agentValues.add(String(session.agent));
    }
    if (session.source) {
      sourceValues.add(String(session.source));
    }
  });

  const currentAgent = agentFilter.value;
  const currentSource = sourceFilter.value;

  agentFilter.textContent = "";
  const agentDefault = document.createElement("option");
  agentDefault.value = "";
  agentDefault.textContent = "All agents";
  agentFilter.appendChild(agentDefault);
  Array.from(agentValues)
    .sort()
    .forEach((agent) => {
      const option = document.createElement("option");
      option.value = agent;
      option.textContent = agent;
      agentFilter.appendChild(option);
    });
  agentFilter.value = currentAgent;

  sourceFilter.textContent = "";
  const sourceDefault = document.createElement("option");
  sourceDefault.value = "";
  sourceDefault.textContent = "All sources";
  sourceFilter.appendChild(sourceDefault);
  Array.from(sourceValues)
    .sort()
    .forEach((source) => {
      const option = document.createElement("option");
      option.value = source;
      option.textContent = source;
      sourceFilter.appendChild(option);
    });
  sourceFilter.value = currentSource;
}

function applyAgentFilters() {
  const query = normalizeSearchValue(agentSearch.value);
  const agentValue = agentFilter.value;
  const sourceValue = sourceFilter.value;

  const filtered = allSessions.filter((session) => {
    if (agentValue && String(session.agent || "") !== agentValue) {
      return false;
    }
    if (sourceValue && String(session.source || "") !== sourceValue) {
      return false;
    }
    if (!query) return true;
    const haystack = [
      session.title,
      session.id,
      session.last_message,
      session.agent,
      session.source,
    ]
      .map(normalizeSearchValue)
      .join(" ");
    return haystack.includes(query);
  });

  renderAgents(filtered, lastAgentError);
}

async function loadAgents() {
  const response = await fetch("/api/agents");
  const data = await response.json();
  allSessions = Array.isArray(data.sessions) ? data.sessions : [];
  updateFilterOptions(allSessions);
  renderAgents(allSessions, data.error);
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

agentSearch.addEventListener("input", applyAgentFilters);
agentFilter.addEventListener("change", applyAgentFilters);
sourceFilter.addEventListener("change", applyAgentFilters);

loadItems();
loadAgents();
