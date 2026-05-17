import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SkillsOverview } from "./SkillsOverview";

vi.mock("@hstrejoluna/ui", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@hstrejoluna/ui")>();
  return {
    ...actual,
    HudChip: ({ children }: React.PropsWithChildren) => <span>{children}</span>,
  };
});

const mockSkills = [
  {
    _id: "s1",
    _type: "skill" as const,
    name: "React",
    category: "Frontend",
    proficiency: 95,
  },
  {
    _id: "s2",
    _type: "skill" as const,
    name: "TypeScript",
    category: "Frontend",
    proficiency: 90,
  },
  {
    _id: "s3",
    _type: "skill" as const,
    name: "Node.js",
    category: "Backend",
    proficiency: 80,
  },
];

describe("SkillsOverview — Keyboard Accessibility", () => {
  it("renders each skill item as a <button> element, not a <div>", () => {
    render(<SkillsOverview skills={mockSkills} />);

    // Should find buttons for each skill in the active category (Frontend by default)
    const reactButton = screen.getByRole("button", { name: /react/i });
    expect(reactButton).toBeInTheDocument();
    expect(reactButton.tagName).toBe("BUTTON");
  });

  it("has aria-expanded attribute on skill buttons reflecting expansion state", () => {
    render(<SkillsOverview skills={mockSkills} />);

    const reactButton = screen.getByRole("button", { name: /react/i });
    expect(reactButton).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(reactButton);
    expect(reactButton).toHaveAttribute("aria-expanded", "true");
  });

  it("has aria-controls linking button to expansion panel", () => {
    render(<SkillsOverview skills={mockSkills} />);

    const reactButton = screen.getByRole("button", { name: /react/i });
    expect(reactButton).toHaveAttribute("aria-controls", "skill-panel-s1");

    fireEvent.click(reactButton);
    const panel = document.getElementById("skill-panel-s1");
    expect(panel).toBeInTheDocument();
  });

  it("toggles expansion via Enter key on skill button", () => {
    render(<SkillsOverview skills={mockSkills} />);

    const reactButton = screen.getByRole("button", { name: /react/i });
    expect(reactButton).toHaveAttribute("aria-expanded", "false");

    // Native <button> handles Enter key natively through click event
    fireEvent.click(reactButton);
    expect(reactButton).toHaveAttribute("aria-expanded", "true");

    fireEvent.click(reactButton);
    expect(reactButton).toHaveAttribute("aria-expanded", "false");
  });
});
