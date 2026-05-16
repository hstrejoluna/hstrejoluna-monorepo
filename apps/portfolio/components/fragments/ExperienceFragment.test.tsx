import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ExperienceFragment } from "./ExperienceFragment";
import { NextIntlClientProvider } from "next-intl";
import messages from "../../messages/en.json";

vi.mock("@hstrejoluna/ui", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@hstrejoluna/ui")>();
  return {
    ...actual,
    GlitchText: ({ text, className }: { text: string; className?: string }) => (
      <span className={className}>{text}</span>
    ),
    TelemetryHUD: ({
      identifier,
      status,
      dateRange,
      className,
    }: Record<string, string>) => (
      <div className={className} data-testid="telemetry-hud">
        {identifier} {status} {dateRange}
      </div>
    ),
  };
});

const mockExperience = {
  _id: "exp-1",
  _type: "experience" as const,
  role: "Senior Engineer",
  company: "TestCorp",
  startDate: "2022-01-01",
  endDate: "2023-12-31",
  isCurrent: false,
  description: "Built systems",
};

describe("ExperienceFragment — Decorative Content Isolation", () => {
  it("hides background code stream from assistive technology", () => {
    const { container } = render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <ExperienceFragment experience={mockExperience} />
      </NextIntlClientProvider>,
    );

    // Code stream contains random alphanumeric characters in many divs
    const codeStreamParent = container.querySelector(
      ".font-mono.text-white.overflow-hidden.pointer-events-none.select-none",
    );
    expect(codeStreamParent).toBeInTheDocument();
    expect(codeStreamParent).toHaveAttribute("aria-hidden", "true");
  });

  it("hides side HUD telemetry from assistive technology", () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <ExperienceFragment experience={mockExperience} />
      </NextIntlClientProvider>,
    );

    const sideHUD = screen.queryByText(/CHRONO_LOG_SYNC_STATE/);
    expect(sideHUD).toBeInTheDocument();

    const sideHUDContainer = sideHUD!.closest("[aria-hidden]");
    expect(sideHUDContainer).toHaveAttribute("aria-hidden", "true");
  });
});
