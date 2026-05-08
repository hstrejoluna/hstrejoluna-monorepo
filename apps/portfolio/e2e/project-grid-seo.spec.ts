import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("Project Grid — SEO & Semantic HTML", () => {
  test.use({ colorScheme: "dark" });

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

  // ── Semantic HTML ────────────────────────────────────────────────
  // spec § "Server-Rendered Semantic Grid", "Fixed Heading & Landmarks"

  test("homepage renders project <article> cards with semantic structure", async ({
    page,
  }) => {
    await page.goto("/");

    // Cards are <article> elements
    const articles = page.locator("article");
    await expect(articles.first()).toBeVisible({ timeout: 10000 });

    // Each article has an <h3> title
    const firstArticle = articles.first();
    await expect(firstArticle.locator("h3")).toBeVisible();

    // Each article has a paragraph description
    await expect(firstArticle.locator("p").first()).toBeVisible();

    // Images have alt text
    const images = page.locator("article img[alt]");
    const imageCount = await images.count();
    if (imageCount > 0) {
      const alt = await images.first().getAttribute("alt");
      expect(alt).toBeTruthy();
    }
  });

  test("homepage has exactly one <main id='main-content'>", async ({
    page,
  }) => {
    await page.goto("/");
    const mainElements = page.locator("main#main-content");
    await expect(mainElements).toHaveCount(1);
  });

  test("homepage has exactly one <h1>", async ({ page }) => {
    await page.goto("/");
    const h1Elements = page.locator("h1");
    await expect(h1Elements).toHaveCount(1);
  });

  test("heading hierarchy does not skip levels", async ({ page }) => {
    await page.goto("/");

    // Collect heading levels in DOM order within the projects section
    const headings = await page
      .locator(
        "#projects h1, #projects h2, #projects h3, #projects h4, #projects h5, #projects h6",
      )
      .evaluateAll((els) =>
        els.map((el) => parseInt(el.tagName.replace("H", ""), 10)),
      );

    // Should have at least one heading
    expect(headings.length).toBeGreaterThan(0);

    // Heading levels should never increase by more than 1 (no skipped levels)
    for (let i = 1; i < headings.length; i++) {
      const jump = headings[i] - headings[i - 1];
      if (jump > 1) {
        // Allow if jumping back up (e.g., h3 after h2 is fine)
        // Only flag when skipping a level (e.g., h1 → h3)
        throw new Error(
          `Heading level skip from H${headings[i - 1]} to H${headings[i]} at index ${i}`,
        );
      }
    }
    // If no exception, hierarchy is valid
    expect(true).toBe(true);
  });

  // ── Case Study Navigation ────────────────────────────────────────
  // spec § "Case Study Navigation"

  test("card links navigate to /projects/[slug] case study pages", async ({
    page,
  }) => {
    await page.goto("/");

    // Wait for article cards
    const articles = page.locator("article");
    await expect(articles.first()).toBeVisible({ timeout: 10000 });

    // Find a link that goes to /projects/
    const projectLink = page.locator('a[href*="/projects/"]').first();
    await expect(projectLink).toBeVisible();

    // Click the link
    const href = await projectLink.getAttribute("href");
    expect(href).toContain("/projects/");

    await projectLink.click();
    await page.waitForLoadState("networkidle");

    // Should be on a project page
    expect(page.url()).toContain("/projects/");
  });

  test("link text is descriptive — not generic 'click here'", async ({
    page,
  }) => {
    await page.goto("/");

    const articles = page.locator("article");
    await expect(articles.first()).toBeVisible({ timeout: 10000 });

    // The "View Case Study" label should be present
    const viewCaseStudyText = page.getByText(
      /View Case Study|Ver Caso de Estudio/i,
    );
    await expect(viewCaseStudyText.first()).toBeVisible();
  });

  // ── axe-core Accessibility ───────────────────────────────────────
  // spec § "Accessibility"

  test("project grid section has zero axe-core violations", async ({
    page,
  }) => {
    await page.goto("/");

    // Wait for articles to be present
    const articles = page.locator("article");
    await expect(articles.first()).toBeVisible({ timeout: 10000 });

    // Run axe-core on the projects section
    const results = await new AxeBuilder({ page })
      .include("#projects")
      .analyze();

    expect(results.violations).toEqual([]);
  });

  // ── JSON-LD ItemList ─────────────────────────────────────────────
  // spec § "JSON-LD ItemList"

  test("homepage emits JSON-LD ItemList with CreativeWork entries", async ({
    page,
  }) => {
    await page.goto("/");

    // Find the ItemList script tag
    const jsonLdScript = page.locator('script[type="application/ld+json"]');
    const scriptCount = await jsonLdScript.count();
    expect(scriptCount).toBeGreaterThanOrEqual(2); // Person + ItemList

    // Get all JSON-LD content and parse
    const allJsonLd: object[] = [];
    for (let i = 0; i < scriptCount; i++) {
      const content = await jsonLdScript.nth(i).textContent();
      if (content) {
        allJsonLd.push(JSON.parse(content));
      }
    }

    // Find the ItemList entry
    const itemList = allJsonLd.find(
      (entry: any) => entry["@type"] === "ItemList",
    );
    expect(itemList).toBeDefined();
    expect((itemList as any).itemListElement).toBeDefined();
    expect((itemList as any).itemListElement.length).toBeGreaterThan(0);

    // Each item should be a ListItem with a CreativeWork
    const firstItem = (itemList as any).itemListElement[0];
    expect(firstItem["@type"]).toBe("ListItem");
    expect(firstItem.position).toBe(1);
    expect(firstItem.item["@type"]).toBe("CreativeWork");
    expect(firstItem.item.name).toBeTruthy();
    expect(firstItem.item.url).toContain("/projects/");
    expect(firstItem.item.description).toBeDefined();

    // Ensure it's valid JSON that can be re-serialized
    const reparsed = JSON.parse(JSON.stringify(itemList));
    expect(reparsed["@type"]).toBe("ItemList");
  });

  // ── Keyboard Navigation ──────────────────────────────────────────
  // spec § "Accessibility" → "Keyboard navigation"

  test("project cards are keyboard-navigable with visible focus indicators", async ({
    page,
  }) => {
    await page.goto("/");

    const articles = page.locator("article");
    await expect(articles.first()).toBeVisible({ timeout: 10000 });

    // Tab to reach the project section
    // First tab through hero/skip-link
    await page.keyboard.press("Tab");
    await page.waitForTimeout(100);

    // Tab more times to reach articles in the projects section
    // We'll tab up to 20 times to find an article link
    let articleFocused = false;
    for (let i = 0; i < 20; i++) {
      const focused = page.locator(":focus");
      const tagName = await focused.evaluate((el) => el.tagName);
      const parentArticle = await focused.locator("..").first();

      // Check if focus is inside an article (directly or parent)
      const isInProjectSection =
        (await focused.locator("#projects").count()) > 0 ||
        (await page
          .locator(":focus")
          .locator("..")
          .locator("#projects")
          .count()) > 0;

      // Check if the focused element is a project card link
      const isProjectLink = await focused.evaluate(
        (el) =>
          el.tagName === "A" &&
          (el as HTMLAnchorElement).href.includes("/projects/"),
      );
      if (isProjectLink) {
        articleFocused = true;
        break;
      }

      await page.keyboard.press("Tab");
      await page.waitForTimeout(50);
    }

    // At least one article link should be reachable via keyboard
    expect(articleFocused).toBe(true);

    // Verify :focus-visible styles apply via keyboard navigation
    const focusedElement = page.locator(":focus-visible");
    const focusVisibleCount = await focusedElement.count();
    // Keyboard Tab sets :focus-visible in Playwright — we should have at least one
    expect(focusVisibleCount).toBeGreaterThan(0);
  });
});
