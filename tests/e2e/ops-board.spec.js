const { test, expect } = require("@playwright/test");

function createState() {
  return {
    items: [
      {
        id: "item-1",
        title: "Prepare migration checklist",
        source: "mission-control",
        kind: "task",
        status: "today",
        source_path: "dev_plans/agentdeck-mission-control-nextjs-convex-v1.md",
        raw: "Lock v1 scope and publish plan updates.",
        updated_at: "2026-02-18T18:00:00.000Z",
      },
      {
        id: "item-2",
        title: "Collect screenshots",
        source: "briefly",
        kind: "task",
        status: "next",
        source_path: "README.md",
        raw: "Capture a short UI walkthrough.",
        updated_at: "2026-02-18T18:10:00.000Z",
      },
    ],
    sessions: [
      {
        id: "session-henry",
        title: "Henry main",
        agent: "Henry",
        source: "gateway",
        last_message: "Ready for new tasks",
      },
      {
        id: "session-writer",
        title: "Writer pod",
        agent: "Writer",
        source: "file",
        last_message: "Drafting scripts",
      },
    ],
    sentMessages: [],
  };
}

async function mockApi(page, state) {
  await page.route("**/api/items", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ items: state.items }),
    });
  });

  await page.route("**/api/items/*/status", async (route) => {
    const requestUrl = new URL(route.request().url());
    const pathParts = requestUrl.pathname.split("/");
    const itemId = pathParts[pathParts.length - 2];
    const payload = JSON.parse(route.request().postData() || "{}");
    const item = state.items.find((entry) => entry.id === itemId);
    if (item && payload.status) {
      item.status = payload.status;
      item.updated_at = new Date().toISOString();
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true }),
      });
      return;
    }
    await route.fulfill({
      status: 404,
      contentType: "application/json",
      body: JSON.stringify({ error: "Item not found" }),
    });
  });

  await page.route("**/api/agents", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ sessions: state.sessions }),
    });
  });

  await page.route("**/api/agents/*/send", async (route) => {
    const payload = JSON.parse(route.request().postData() || "{}");
    const requestUrl = new URL(route.request().url());
    const pathParts = requestUrl.pathname.split("/");
    const sessionId = pathParts[pathParts.length - 2];
    state.sentMessages.push({
      sessionId,
      message: payload.message || "",
      confirmed: Boolean(payload.confirmed),
    });
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true, runId: "run-123" }),
    });
  });
}

test("moves tasks across board columns", async ({ page }) => {
  const state = createState();
  await mockApi(page, state);

  await page.goto("/");
  await expect(page.getByRole("heading", { name: "AgentDeck" })).toBeVisible();
  await expect(page.locator("#today-list .card-title")).toContainText([
    "Prepare migration checklist",
  ]);
  await expect(page.locator("#next-list .card-title")).toContainText([
    "Collect screenshots",
  ]);

  const todayCard = page
    .locator("#today-list .card")
    .filter({ hasText: "Prepare migration checklist" });
  await todayCard.getByRole("button", { name: "Mark Done" }).click();

  await expect(page.locator("#done-list .card-title")).toContainText([
    "Prepare migration checklist",
  ]);
});

test("filters sessions and sends a task", async ({ page }) => {
  const state = createState();
  await mockApi(page, state);

  await page.goto("/");
  await expect(page.locator(".card.card--agent")).toHaveCount(2);

  await page.fill("#agent-search", "writer");
  await expect(page.locator(".card.card--agent")).toHaveCount(1);
  await expect(page.locator(".card.card--agent .card-title")).toContainText([
    "Writer",
  ]);

  await page.fill("#agent-search", "");
  await expect(page.locator(".card.card--agent")).toHaveCount(2);

  const henryCard = page
    .locator(".card.card--agent")
    .filter({ hasText: "Henry main" });
  await henryCard.getByRole("button", { name: "Select" }).click();
  await expect(page.locator("#selected-agent")).toContainText(
    "Selected: Henry · session-henry",
  );

  await page.fill("#agent-message", "Ship the updated testing stack.");
  page.once("dialog", async (dialog) => {
    await dialog.accept();
  });
  await page.click("#agent-send-button");

  await expect(page.locator("#agent-message")).toHaveValue("");
  expect(state.sentMessages).toEqual([
    {
      sessionId: "session-henry",
      message: "Ship the updated testing stack.",
      confirmed: true,
    },
  ]);
});
