import { test, expect } from "@playwright/test";

test("navigates key mission control screens", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "OpenClaw Mission Control" }),
  ).toBeVisible();

  const sidebarNav = page.getByRole("navigation");

  await sidebarNav
    .getByRole("link", { name: "Tasks Board", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Tasks Board", exact: true }),
  ).toBeVisible();

  await page.getByLabel("Title").fill("Execute phase-1 implementation");
  await page.getByRole("button", { name: "Create task" }).click();
  await expect(page.getByText("Execute phase-1 implementation")).toBeVisible();

  await sidebarNav.getByRole("link", { name: "Content Pipeline" }).click();
  await expect(
    page.getByRole("heading", { name: "Content Pipeline", exact: true }),
  ).toBeVisible();
  await page.getByLabel("Content title").fill("Mission control article recap");
  await page.getByRole("button", { name: "Add to pipeline" }).click();
  await expect(page.getByText("Mission control article recap")).toBeVisible();

  await sidebarNav.getByRole("link", { name: "Calendar", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Calendar", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Run now" }).first()).toBeVisible();

  await sidebarNav.getByRole("link", { name: "Memory", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Memory", exact: true }),
  ).toBeVisible();

  await sidebarNav.getByRole("link", { name: "Team", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Team", exact: true })).toBeVisible();
  await page.getByLabel("Name").fill("QA Agent");
  await page.getByRole("button", { name: "Add member" }).click();
  await expect(page.getByText("QA Agent")).toBeVisible();

  await sidebarNav.getByRole("link", { name: "Office", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Office", exact: true })).toBeVisible();
  await expect(page.getByText("QA Agent")).toBeVisible();

  await sidebarNav
    .getByRole("link", { name: "Activity Log", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Activity Log", exact: true }),
  ).toBeVisible();
});
