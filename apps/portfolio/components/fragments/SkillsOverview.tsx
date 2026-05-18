"use client";

import { useState, useMemo } from "react";
import { type Skill } from "@/types/sanity";
import { HudChip } from "@hstrejoluna/ui";

export const SkillsOverview = ({ skills }: { skills: Skill[] }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const categories = useMemo(
    () =>
      Array.from(
        new Set(
          skills
            .map((s) => s.category)
            .filter((c): c is string => Boolean(c)),
        ),
      ),
    [skills],
  );
  const [activeCategory, setActiveCategory] = useState<string>(
    categories[0] || "",
  );

  const filteredSkills = useMemo(
    () => skills.filter((s) => s.category === activeCategory),
    [skills, activeCategory],
  );

  return (
    <div className="w-full relative z-20">
      <div className="flex flex-wrap gap-2 md:gap-4 mb-8 md:mb-12 border-b border-surface_container_highest pb-4 px-4 md:px-0">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => {
              setActiveCategory(cat);
              setExpandedId(null);
            }}
            className={`font-mono text-xs md:text-sm uppercase tracking-widest px-4 py-2 transition-colors duration-300 ${
              activeCategory === cat
                ? "text-primary border-b-2 border-primary bg-primary/5"
                : "text-on_surface_variant hover:text-on_surface"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-0 border-t border-surface_container_highest">
        {filteredSkills.map((skill) => {
          const isExpanded = expandedId === skill._id;
          const proficiency = skill.proficiency || 0;

          return (
            <div
              key={skill._id}
              className={`border-b border-surface_container_highest bg-background ${isExpanded ? "bg-surface_container_lowest" : ""}`}
            >
              <button
                type="button"
                onClick={() => setExpandedId(isExpanded ? null : skill._id)}
                aria-expanded={isExpanded}
                aria-controls={`skill-panel-${skill._id}`}
                className="w-full text-left cursor-pointer p-4 md:p-6 flex items-center justify-between group hover:bg-surface_container_low transition-colors"
              >
                <div className="flex items-center gap-4">
                  <span className="font-mono text-primary text-xs opacity-70 group-hover:opacity-100">
                    {`[${proficiency}%]`}
                  </span>
                  <h3 className="text-base md:text-lg font-bold text-on_surface uppercase tracking-tight">
                    {skill.name}
                  </h3>
                </div>

                <div className="hidden md:flex gap-2">
                  <HudChip>SYNC_RATE: {proficiency}%</HudChip>
                </div>
              </button>

              <div
                id={`skill-panel-${skill._id}`}
                data-open={isExpanded ? "true" : "false"}
                className="collapsible-region border-t border-primary/20 bg-primary/5"
              >
                <div className="collapsible-inner">
                  <div className="p-6 md:p-8 space-y-6">
                    <div className="w-full bg-surface_container_highest h-2 relative overflow-hidden">
                      <div
                        key={isExpanded ? "open" : "closed"}
                        className="skill-proficiency-bar absolute left-0 top-0 bottom-0 bg-primary"
                        style={
                          {
                            "--skill-proficiency": `${proficiency}%`,
                          } as React.CSSProperties
                        }
                      />
                    </div>

                    <div className="font-mono text-xs text-on_surface_variant leading-relaxed columns-1 md:columns-2 gap-8">
                      <div>
                        <p className="text-primary mb-2">
                          {"// DOCUMENTATION_FRAGMENT"}
                        </p>
                        <p>
                          {skill.name} represents a core competency within the{" "}
                          {skill.category} cluster. Proficiency mapped at{" "}
                          {proficiency}% indicates active mastery and deployment
                          capability in production environments.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
