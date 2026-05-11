import { expect, test } from "@playwright/test";

test.describe("portfolio navigation behavior", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem(
        "consent_preferences",
        JSON.stringify({
          analytics: true,
          timestamp: new Date().toISOString(),
        }),
      );
    });
  });
  test("scrolling updates active section marker without clicking navigation", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name.includes("Mobile"), "Desktop-only flow");

    await page.goto("/");

    // Wait for async ObsidianStream to load (sections rendered dynamically)
    await page.waitForSelector("#projects", {
      state: "attached",
      timeout: 30000,
    });

    await page.evaluate(() => {
      const el = document.getElementById("projects");
      if (el) {
        el.scrollIntoView({ block: "center", behavior: "auto" });
      }
    });

    await expect
      .poll(
        () =>
          page
            .getByRole("button", { name: /^projects$/i })
            .first()
            .getAttribute("aria-current"),
        { timeout: 15_000, intervals: [250, 500, 1000] },
      )
      .toBe("location");
  });

  test("desktop layout hides mobile menu toggle", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name.includes("Mobile"), "Desktop-only flow");

    await page.goto("/");
    await expect(page.getByRole("button", { name: /^menu$/i })).toHaveCount(0);
  });

  test("desktop navigation activates certificates", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name.includes("Mobile"), "Desktop-only flow");

    await page.goto("/");

    const liquidNav = page.getByTestId("liquid-nav");
    const certificatesNavLink = page
      .getByRole("button", { name: /^certificates$/i })
      .first();
    await expect(certificatesNavLink).toBeVisible();

    await certificatesNavLink.click();

    // URL hash is set synchronously via replaceState — reliable first gate.
    await expect(page).toHaveURL(/#certificates$/);

    // aria-current depends on IntersectionObserver + React re-render after
    // smooth-scroll completes. Poll with generous timeout to absorb variance.
    // Re-query locator inside poll — React re-render may replace the DOM node.
    await expect
      .poll(
        () =>
          page
            .getByRole("button", { name: /^certificates$/i })
            .first()
            .getAttribute("aria-current"),
        { timeout: 10_000 },
      )
      .toBe("location");

    // Ensure the navigation stays visible (auto-hide is disabled)
    await expect(liquidNav).not.toHaveClass(/pointer-events-none/);
  });

  test("mobile menu opens and navigates to target section", async ({
    page,
  }, testInfo) => {
    test.skip(!testInfo.project.name.includes("Mobile"), "Mobile-only flow");

    await page.goto("/");

    const openMenuButton = page.getByRole("button", {
      name: /^menu$/i,
    });
    await expect(openMenuButton).toBeVisible();
    await openMenuButton.click();

    const mobileNavigation = page.getByRole("navigation", {
      name: /mobile sections/i,
    });
    await expect(mobileNavigation).toBeVisible();
    await mobileNavigation
      .getByRole("button", { name: /certificates/i })
      .click();

    await expect(mobileNavigation).toHaveCount(0);
    await expect(page).toHaveURL(/#certificates$/);
  });
});
