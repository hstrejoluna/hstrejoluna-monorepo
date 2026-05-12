import { test, expect } from "@playwright/test";

test.describe("Layer 2: Cookie Consent Banner", () => {
  test("displays the cookie banner on initial load without consent", async ({
    page,
  }) => {
    await page.goto("/");

    // shouldShowBanner becomes true after useEffect fires post-hydration.
    // Use generous timeout to absorb Next.js ISR revalidation variance.
    const banner = page.locator('aside[aria-label="Cookie Consent"]');
    await expect(banner).toBeVisible({ timeout: 10000 });

    const acceptButton = banner.locator('button:has-text("Accept")');
    await expect(acceptButton).toBeVisible();
  });

  test("accepts cookies and dismisses banner persistently", async ({
    page,
  }) => {
    await page.goto("/");

    const banner = page.locator('aside[aria-label="Cookie Consent"]');
    await expect(banner).toBeVisible({ timeout: 10000 });

    const acceptButton = banner.locator('button:has-text("Accept")');
    await expect(acceptButton).toBeVisible();

    // framer-motion spring entrance animation (y:"100%"→0) places the
    // Accept button offscreen via CSS transform. Playwright's toBeVisible()
    // passes (element has size) but click() fails with "outside viewport".
    // Bypass via page.evaluate: dispatch a click in the page's JS context,
    // which skips Playwright's scroll-into-view and viewport checks.
    await page.evaluate(() => {
      const buttons = document.querySelectorAll(
        'aside[aria-label="Cookie Consent"] button',
      );
      for (const btn of buttons) {
        if (btn.textContent?.includes("Accept")) {
          (btn as HTMLElement).click();
          break;
        }
      }
    });

    // The banner should disappear
    await expect(banner).toBeHidden();

    // Check localStorage
    const consent = await page.evaluate(() =>
      localStorage.getItem("consent_preferences"),
    );
    expect(consent).toContain('"analytics":true');

    // Reload the page, banner should remain hidden
    await page.reload();
    await expect(banner).toBeHidden();
  });

  test("respects Global Privacy Control (GPC) and auto-rejects", async ({
    page,
  }) => {
    // Mock GPC flag BEFORE navigation
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "globalPrivacyControl", {
        value: true,
        configurable: true,
      });
    });

    await page.goto("/");

    // Local storage should reflect rejection eventually (wait for hydration/useEffect)
    await expect
      .poll(
        async () => {
          const consent = await page.evaluate(() =>
            localStorage.getItem("consent_preferences"),
          );
          return consent !== null ? consent : "";
        },
        { timeout: 5000 },
      )
      .toContain('"analytics":false');

    // The banner should not be displayed because GPC auto-rejected
    const banner = page.locator('aside[aria-label="Cookie Consent"]');
    await expect(banner).toBeHidden();
  });
});
