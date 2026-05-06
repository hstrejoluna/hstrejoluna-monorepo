import { expect, test } from "@playwright/test";

const getProjectGridColumnCount = async (
  page: import("@playwright/test").Page,
) =>
  page.locator("#projects .grid-with-life").evaluate((element) => {
    const columns = getComputedStyle(element).gridTemplateColumns;
    return columns.split(" ").filter(Boolean).length;
  });

test.describe("in-place expansion grids", () => {
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
  test("projects grid uses three columns on desktop", async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name.includes("Mobile"),
      "Desktop-only responsive assertion",
    );

    await page.goto("/#projects");
    const grid = page.locator("#projects .grid-with-life");
    await expect(grid).toBeVisible();
    // Ensure layout is stable before reading computed grid columns.
    await page.waitForTimeout(500);

    const columnCount = await getProjectGridColumnCount(page);
    expect(columnCount).toBe(3);
  });

  test("projects grid uses one column on mobile", async ({
    page,
  }, testInfo) => {
    test.skip(
      !testInfo.project.name.includes("Mobile"),
      "Mobile-only responsive assertion",
    );

    await page.goto("/#projects");
    const grid = page.locator("#projects .grid-with-life");
    await expect(grid).toBeVisible();
    // Ensure responsive layout is stable before reading computed grid columns.
    await page.waitForTimeout(500);

    const columnCount = await getProjectGridColumnCount(page);
    expect(columnCount).toBe(1);
  });

  test("project selection expands in place and collapses previous selection", async ({
    page,
    browserName,
  }, testInfo) => {
    test.skip(
      testInfo.project.name.includes("Mobile") || browserName === "webkit",
      "Desktop-only interaction assertion; WebKit AnimatePresence DOM detachment tracked in follow-up",
    );

    await page.goto("/#projects");

    const projectButtons = page.locator(
      'button[aria-controls^="project-panel-"]',
    );
    const buttonCount = await projectButtons.count();
    test.skip(
      buttonCount < 2,
      "Needs at least two projects for singular expansion verification",
    );

    const first = projectButtons.nth(0);
    const second = projectButtons.nth(1);

    await first.click();
    await expect(first).toHaveAttribute("aria-expanded", "true");
    const firstPanelId = await first.getAttribute("aria-controls");
    await expect(page.locator(`#${firstPanelId}`)).toBeVisible();

    await second.click();

    // AnimatePresence exit animation detaches/re-attaches DOM nodes.
    // Wait for animation to complete AND re-query locator to avoid staleness.
    await page.waitForTimeout(500);
    await expect(projectButtons.nth(0)).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    await expect(second).toHaveAttribute("aria-expanded", "true");
  });

  test("experience selection keeps singular expansion behavior", async ({
    page,
    browserName,
  }, testInfo) => {
    test.skip(
      testInfo.project.name.includes("Mobile") || browserName === "webkit",
      "Desktop-only interaction assertion; WebKit AnimatePresence DOM detachment tracked in follow-up",
    );

    await page.goto("/#experience");

    // AnimatePresence aggressively detaches/re-attaches DOM nodes on Safari
    // during viewport entry — wait for section and buttons to stabilize.
    await expect(page.locator("#experience")).toBeVisible();
    const experienceButtons = page.locator('button[aria-controls^="details-"]');
    await expect(experienceButtons.first()).toBeAttached({ timeout: 10000 });
    const buttonCount = await experienceButtons.count();
    test.skip(
      buttonCount < 2,
      "Needs at least two experiences for singular expansion verification",
    );

    // Re-query before every action — AnimatePresence may detach nodes on page load.
    await experienceButtons.nth(0).scrollIntoViewIfNeeded();
    await experienceButtons.nth(0).click();

    // AnimatePresence exit animation detaches/re-attaches DOM nodes.
    // Wait for animation to complete before asserting.
    await page.waitForTimeout(500);
    await expect(experienceButtons.nth(0)).toHaveAttribute(
      "aria-expanded",
      "true",
      {
        timeout: 15000,
      },
    );

    // Wait for AnimatePresence exit animation before collapsing first.
    await page.waitForTimeout(500);

    await experienceButtons.nth(1).scrollIntoViewIfNeeded();
    await experienceButtons.nth(1).click();

    // Re-query after AnimatePresence exit/enter — all locators must be fresh.
    await page.waitForTimeout(500);
    await expect(experienceButtons.nth(0)).toHaveAttribute(
      "aria-expanded",
      "false",
      {
        timeout: 15000,
      },
    );
    await expect(experienceButtons.nth(1)).toHaveAttribute(
      "aria-expanded",
      "true",
      {
        timeout: 15000,
      },
    );
  });
});
