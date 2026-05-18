import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { userEvent, within } from "storybook/test";
import { NextIntlClientProvider } from "next-intl";
import { HeroSection } from "./HeroSection";
import type { Profile } from "@/types/sanity";

const mockProfile: Profile = {
  name: "Héctor Trejo Luna",
  headline: "Architecting zero-latency ecosystems and immersive digital voids.",
  bio: "Senior Software Architect specializing in clean architecture and performance engineering.",
  socials: [],
};

// Messages matching apps/portfolio/messages/en.json — hero + brand namespaces
const heroMessages = {
  eyebrow: "Building digital experiences",
  h1Name: "Héctor Trejo Luna",
  h1Role: "Senior Software Architect",
  lead: "Engineering scalable, high-performance digital ecosystems from architecture to pixel",
  cta: "Explore my work",
  ctaAriaLabel: "View featured projects and case studies",
  secondaryLabel: "LinkedIn Profile",
  secondaryHref: "https://linkedin.com/in/htrejoluna",
};

const brandMessages = {};

const meta = {
  title: "Fragments/HeroSection",
  component: HeroSection,
  parameters: {
    layout: "fullscreen",
    nextjs: { appDirectory: true },
  },
  decorators: [
    (Story) => (
      <NextIntlClientProvider
        locale="en"
        messages={{ hero: heroMessages, brand: brandMessages }}
      >
        <div className="bg-void min-h-screen text-white w-full">
          <Story />
        </div>
      </NextIntlClientProvider>
    ),
  ],
} satisfies Meta<typeof HeroSection>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * 1. Default — full hero with profile headline override.
 *
 * In Storybook, `useLiquidHeroCapability` resolves from the browser
 * environment. With `matchMedia` mocked to always return `false`, the
 * effective capability is `"css-only"` (CSS blobs + glass card active;
 * WebGL canvas not loaded because the 1024px viewport gate returns false).
 */
export const Default: Story = {
  args: {
    profile: mockProfile,
  },
};

/**
 * 2. ReducedMotion — static/frozen visual layer, no WebGL canvas.
 *
 * To activate: open browser devtools → Rendering tab →
 * "Emulate CSS media feature prefers-reduced-motion: reduce".
 *
 * When reduced-motion is active:
 * - Blob animations are paused
 * - Cursor tracking is disabled (no pointermove listener)
 * - WebGL canvas is never loaded
 * - SVG goo filter still applies as static distortion
 */
export const ReducedMotion: Story = {
  args: {
    profile: mockProfile,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Enable `prefers-reduced-motion: reduce` in devtools to see the " +
          "static frozen visual layer. Blob animations pause, cursor tracking " +
          "is disabled, and the WebGL layer is NOT loaded.",
      },
    },
  },
};

/**
 * 3. NoWebGL — css-only capability, no WebGL canvas.
 *
 * Uses a small viewport (< 1024px) to trigger the capability gate.
 * CSS blob layer and glass card are active; WebGL is excluded.
 */
export const NoWebGL: Story = {
  args: {
    profile: mockProfile,
  },
  parameters: {
    viewport: {
      defaultViewport: "mobile1",
    },
    docs: {
      description: {
        story:
          "Small viewport (< 1024px) triggers the css-only capability gate. " +
          "CSS blob layer and glass card are active; no WebGL canvas mounts.",
      },
    },
  },
};

/**
 * 4. Hover — pointer movement updates CSS custom properties --mx / --my.
 *
 * Uses Storybook's `play` function to simulate pointer movement across
 * the hero section. CSS vars should update without React re-renders
 * (zero-rerender cursor reactivity via rAF-throttled handler).
 */
export const Hover: Story = {
  args: {
    profile: mockProfile,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const section = canvasElement.querySelector("section");
    if (!section) return;

    // Simulate pointer entering and sweeping across the hero
    await userEvent.pointer({
      target: section,
      coords: { x: 200, y: 150 },
    });
    await userEvent.pointer({
      target: section,
      coords: { x: 400, y: 250 },
    });
    await userEvent.pointer({
      target: section,
      coords: { x: 600, y: 200 },
    });
    await userEvent.pointer({
      target: section,
      coords: { x: 800, y: 350 },
    });
  },
};

/**
 * 5. Scroll — 200vh container, scroll-driven distortion.
 *
 * Wraps the story in a 200vh container so the hero can be scrolled.
 * The `play` function simulates scrolling to test that the CSS
 * distortion layer and scroll-linked uniforms react correctly.
 */
export const Scroll: Story = {
  args: {
    profile: mockProfile,
  },
  decorators: [
    (Story) => (
      <NextIntlClientProvider
        locale="en"
        messages={{ hero: heroMessages, brand: brandMessages }}
      >
        <div
          className="bg-void text-white w-full"
          style={{ height: "200vh" }}
        >
          <Story />
        </div>
      </NextIntlClientProvider>
    ),
  ],
  play: async () => {
    // Scroll partway to trigger distortion mid-range
    window.scrollTo({ top: 200, behavior: "instant" });
    await new Promise((r) => setTimeout(r, 100));
    window.scrollTo({ top: 400, behavior: "instant" });
  },
};

/**
 * 6. ~~FlagOff~~ — REMOVED in Phase 10 cleanup.
 * Legacy `HeroFragment` and its stories are no longer needed
 * after the liquid-glass migration is stable.
 */
