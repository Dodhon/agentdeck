import { test, expect } from "@playwright/test";

test("navigates key mission control screens", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "AgentDeck Mission Control v1" }),
  ).toBeVisible();

  const sidebarNav = page.getByRole("navigation");

  await sidebarNav.getByRole("link", { name: "Tasks", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Tasks", exact: true }),
  ).toBeVisible();

  await page.getByLabel("Title").fill("Execute phase-1 implementation");
  await page.getByRole("button", { name: "Create task" }).click();
  await expect(page.getByText("Execute phase-1 implementation")).toBeVisible();

  await sidebarNav
    .getByRole("link", { name: "Scheduler", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Scheduler", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Run now" }).first()).toBeVisible();

  await sidebarNav.getByRole("link", { name: "Memory", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Memory", exact: true }),
  ).toBeVisible();

  await sidebarNav
    .getByRole("link", { name: "Activity", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Activity", exact: true }),
  ).toBeVisible();
});
