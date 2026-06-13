import { test, expect } from "@playwright/test";

test.describe("Homepage", () => {
  test("should load the homepage with hero section", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toContainText("Discover, deploy, and");
    await expect(page.locator("text=Explore Agents")).toBeVisible();
    await expect(page.locator("text=Publish Agent")).toBeVisible();
  });

  test("should display agent categories", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("text=Chat Agents")).toBeVisible();
    await expect(page.locator("text=Code Agents")).toBeVisible();
    await expect(page.locator("text=Data Agents")).toBeVisible();
    await expect(page.locator("text=Workflow Agents")).toBeVisible();
  });

  test("should navigate to agents page", async ({ page }) => {
    await page.goto("/");
    await page.click("text=Explore Agents");
    await expect(page).toHaveURL(/\/agents/);
    await expect(page.locator("h1")).toContainText("Explore Agents");
  });
});

test.describe("Agents Page", () => {
  test("should display agents list", async ({ page }) => {
    await page.goto("/agents");
    await expect(page.locator("h1")).toContainText("Explore Agents");
    await expect(page.locator("text=Publish Agent")).toBeVisible();
  });

  test("should filter by category", async ({ page }) => {
    await page.goto("/agents?category=CHAT");
    await expect(page.locator("text=Chat Agents")).toBeVisible();
  });

  test("should have working search bar", async ({ page }) => {
    await page.goto("/agents");
    const searchInput = page.locator('input[type="text"]').first();
    await expect(searchInput).toBeVisible();
  });
});

test.describe("Authentication Pages", () => {
  test("should display login page", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("h1")).toContainText("Welcome back");
  });

  test("should display register page", async ({ page }) => {
    await page.goto("/register");
    await expect(page.locator("h1")).toContainText("Create account");
  });

  test("should display forgot password page", async ({ page }) => {
    await page.goto("/forgot-password");
    await expect(page.locator("h1")).toContainText("Reset password");
  });
});

test.describe("Pricing Page", () => {
  test("should display pricing tiers", async ({ page }) => {
    await page.goto("/pricing");
    await expect(page.locator("h1")).toContainText("Pricing");
    await expect(page.locator("text=Free")).toBeVisible();
    await expect(page.locator("text=Pro")).toBeVisible();
    await expect(page.locator("text=Creator")).toBeVisible();
    await expect(page.locator("text=Business")).toBeVisible();
  });
});

test.describe("Navigation", () => {
  test("should navigate through main pages", async ({ page }) => {
    await page.goto("/");

    await page.click("text=Pricing");
    await expect(page).toHaveURL(/\/pricing/);

    await page.click("text=API");
    await expect(page).toHaveURL(/\/api-docs/);
  });
});

test.describe("Responsive Design", () => {
  test("should have mobile menu button", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");
    const mobileMenuButton = page.locator('button[aria-label*="menu" i], button[aria-label*="Menu" i], [data-testid="mobile-menu"]').first();
    await expect(mobileMenuButton).toBeVisible();
  });
});