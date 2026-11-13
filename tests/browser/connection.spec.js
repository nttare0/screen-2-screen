import { test, expect } from "@playwright/test";

test("reports an unavailable backend without entering a simulated room", async ({
  page,
}) => {
  await page.route("**/api/**", (route) => route.abort());
  await page.goto("/?demo=1");
  await expect(page.getByTestId("connect")).toBeVisible();
  await expect(page.getByText("No server reachable")).toBeVisible();
  await expect(page.getByLabel("Display Name", { exact: false })).toBeVisible();
  await expect(page.getByTestId("connect")).not.toContainText(
    "Interactive preview",
  );
});

test("uses the backend login endpoint and reports rejected credentials", async ({
  page,
}) => {
  let loginBody;
  await page.route("**/api/**", async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.endsWith("/oauth/config"))
      return route.fulfill({
        json: { enabled: false, password_login_enabled: true },
      });
    if (url.pathname.endsWith("/login")) {
      loginBody = route.request().postData();
      return route.fulfill({
        status: 401,
        json: { message: "Invalid credentials" },
      });
    }
    return route.fulfill({ status: 401, json: {} });
  });
  await page.goto("/");
  await page.locator("#display-name").fill("Alice");
  await page.locator("#room-password").fill("wrong");
  await page.locator("#room-password").press("Enter");
  await expect.poll(() => loginBody).toContain("Alice");
  await expect(page.getByTestId("connect")).toBeVisible();
});
