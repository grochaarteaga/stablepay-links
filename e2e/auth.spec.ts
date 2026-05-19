import { test, expect } from "@playwright/test";

// Requires the dev server to be running: npm run dev
// Run with: npm run test:e2e

test.describe("Login page", () => {
  test("shows sign-in form", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
    await expect(page.getByPlaceholder("you@company.com")).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
  });

  test("shows error for wrong credentials", async ({ page }) => {
    await page.goto("/login");
    await page.getByPlaceholder("you@company.com").fill("wrong@example.com");
    await page.getByPlaceholder("••••••••").fill("wrongpassword123");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByText("Invalid email or password")).toBeVisible({ timeout: 8000 });
  });

  test("forgot password link navigates to /forgot-password", async ({ page }) => {
    await page.goto("/login");
    await page.getByText("Forgot password?").click();
    await expect(page).toHaveURL("/forgot-password");
  });

  test("sign-up link navigates to /signup", async ({ page }) => {
    await page.goto("/login");
    await page.getByText("Create one free").click();
    await expect(page).toHaveURL("/signup");
  });

  test("submit button disabled while loading", async ({ page }) => {
    await page.goto("/login");
    await page.getByPlaceholder("you@company.com").fill("test@example.com");
    await page.getByPlaceholder("••••••••").fill("password123");
    const button = page.getByRole("button", { name: "Sign in" });
    await button.click();
    // Button should be disabled immediately after click (spinner shows)
    await expect(button).toBeDisabled();
  });
});

test.describe("Forgot password page", () => {
  test("shows form and accepts email input", async ({ page }) => {
    await page.goto("/forgot-password");
    const emailField = page.getByRole("textbox");
    await expect(emailField).toBeVisible();
    await emailField.fill("test@example.com");
    await expect(emailField).toHaveValue("test@example.com");
  });
});

test.describe("Reset password page — no token", () => {
  test("shows expired state after 3-second wait when no token is in URL", async ({ page }) => {
    await page.goto("/reset-password");
    // Wait for 3s timeout + buffer
    await expect(page.getByText("Link expired or already used")).toBeVisible({ timeout: 5000 });
  });

  test("expired state has a link back to /forgot-password", async ({ page }) => {
    await page.goto("/reset-password");
    await expect(page.getByText("Link expired or already used")).toBeVisible({ timeout: 5000 });
    await page.getByText("Request a new link").click();
    await expect(page).toHaveURL("/forgot-password");
  });
});

test.describe("Protected routes — unauthenticated access", () => {
  test("/dashboard redirects to /login", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });

  test("/dashboard redirect includes ?reason=auth", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/reason=auth/);
  });
});
