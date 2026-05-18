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

    // LiquidNav uses a pure-CSS keyframe entrance animation (translateY 100→0).
    // Even after the animation completes, click() can race the layout pass on
    // a fixed-position element; dispatching the click in the page's JS context
    // sidesteps Playwright's actionability viewport check.
    await page.evaluate(() => {
      const nav = document.querySelector('[data-testid="liquid-nav"]');
      const buttons = nav?.querySelectorAll("button") ?? [];
      for (const btn of buttons) {
        if (btn.textContent?.toLowerCase().includes("certificates")) {
          btn.click();
          break;
        }
      }
    });

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
    // Dispatch click in JS context — LiquidNav spring entrance animation
    // places the button offscreen via CSS transform. force:true bypasses
    // actionability checks but NOT viewport/scroll-into-view on fixed elements
    await openMenuButton.evaluate((el) => (el as HTMLButtonElement).click());

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

  test("CommandNav settles inside viewport after entrance animation", async ({
    page,
  }) => {
    await page.goto("/");

    const liquidNav = page.getByTestId("liquid-nav");
    await expect(liquidNav).toBeVisible();

    await expect
      .poll(
        async () => {
          const box = await liquidNav.boundingBox();
          const viewport = page.viewportSize();
          if (!box || !viewport) return false;
          return box.y + box.height > 0 && box.y < viewport.height;
        },
        { timeout: 5_000, intervals: [100, 250, 500] },
      )
      .toBe(true);
  });

  test("CommandNav also settles inside viewport on /es", async ({ page }) => {
    await page.goto("/es");

    const liquidNav = page.getByTestId("liquid-nav");
    await expect(liquidNav).toBeVisible();

    await expect
      .poll(
        async () => {
          const box = await liquidNav.boundingBox();
          const viewport = page.viewportSize();
          if (!box || !viewport) return false;
          return box.y + box.height > 0 && box.y < viewport.height;
        },
        { timeout: 5_000, intervals: [100, 250, 500] },
      )
      .toBe(true);
  });
});
