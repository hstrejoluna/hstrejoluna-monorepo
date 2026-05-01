import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import * as navigation from "@/lib/navigation";
import { CommandNav } from "./CommandNav";
import { NextIntlClientProvider } from "next-intl";
import messages from "../../messages/en.json";

// Mock LocaleSwitcher to avoid its own dependencies
vi.mock("./LocaleSwitcher", () => ({
  LocaleSwitcher: () => <div data-testid="locale-switcher">LocaleSwitcher</div>,
}));

vi.mock("@hstrejoluna/ui", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@hstrejoluna/ui")>();
  return {
    ...actual,
    useReducedMotion: () => false,
  };
});

describe("CommandNav", () => {
  it("renders semantic navigation and marks active section with aria-current", () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <CommandNav
          activeId="projects"
          counts={{ projects: 4, experience: 2, certificates: 3 }}
          socials={[{ platform: "github", url: "https://github.com/example" }]}
        />
      </NextIntlClientProvider>,
    );

    expect(
      screen.getByRole("navigation", { name: /primary sections/i }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /projects/i })[0]).toHaveAttribute(
      "aria-current",
      "location",
    );
  });

  it("shows fallback text in mobile menu when socials are missing", () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <CommandNav
          activeId="experience"
          counts={{ projects: 4, experience: 2, certificates: 3 }}
        />
      </NextIntlClientProvider>,
    );

    fireEvent.click(screen.getAllByRole("button", { name: messages.brand.menu })[0]);
    expect(screen.queryByText(/Socials/i)).not.toBeInTheDocument();
  });

  it("normalizes plaintext email social links and uses smooth section navigation", () => {
    const scrollSpy = vi.spyOn(navigation, "scrollToSection").mockReturnValue(true);

    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <CommandNav
          activeId="skills"
          counts={{ projects: 4, experience: 2, certificates: 3 }}
          socials={[
            {
              platform: "email",
              email: "dev@example.com",
              label: "Contact Email",
            },
          ]}
        />
      </NextIntlClientProvider>,
    );

    expect(
      screen.getAllByRole("link", { name: /contact email/i })[0],
    ).toHaveAttribute("href", "mailto:dev@example.com");

    fireEvent.click(screen.getAllByRole("button", { name: /skills/i })[0]);
    expect(scrollSpy).toHaveBeenCalledWith({
      id: "skills",
      reducedMotion: false,
    });
  });

  it("renders all supported social links with safe external semantics", () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <CommandNav
          activeId="projects"
          counts={{ projects: 4, experience: 2, certificates: 3 }}
          socials={[
            {
              platform: "github",
              url: "https://github.com/example",
              label: "GitHub",
            },
            {
              platform: "linkedin",
              url: "https://linkedin.com/in/example",
              label: "LinkedIn",
            },
            { platform: "email", email: "dev@example.com", label: "Email" },
          ]}
        />
      </NextIntlClientProvider>,
    );

    const githubLink = screen.getAllByRole("link", { name: /github/i })[0];
    const linkedinLink = screen.getAllByRole("link", { name: /linkedin/i })[0];
    const emailLink = screen.getAllByRole("link", { name: /email/i })[0];

    expect(githubLink).toHaveAttribute("href", "https://github.com/example");
    expect(githubLink).toHaveAttribute("rel", "noopener noreferrer external");
    expect(linkedinLink).toHaveAttribute(
      "href",
      "https://linkedin.com/in/example",
    );
    expect(linkedinLink).toHaveAttribute("rel", "noopener noreferrer external");
    expect(emailLink).toHaveAttribute("href", "mailto:dev@example.com");
    expect(emailLink).not.toHaveAttribute("rel");
  });

  it("hides the command nav when hideOnScroll is enabled", () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <CommandNav
          activeId="projects"
          counts={{ projects: 4, experience: 2, certificates: 3 }}
          hideOnScroll
        />
      </NextIntlClientProvider>,
    );

    expect(screen.getByTestId("liquid-nav")).toHaveClass(
      "pointer-events-none"
    );
  });
});
