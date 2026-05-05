"use client";

import { m, Variants } from "framer-motion";
import { Skill } from "@/types/sanity";
import { HudChip } from "@hstrejoluna/ui";

interface SkillsGridProps {
  skills: Skill[];
  variants: Variants;
}

export const SkillsGrid = ({ skills, variants }: SkillsGridProps) => {
  return (
    <m.div
      variants={variants}
      className="md:col-span-2 lg:col-span-3 row-span-1 bg-surface_container_low p-10 rounded-none hover:bg-surface_container_high transition-colors"
    >
      <div className="flex items-center justify-between mb-10">
        <h2 className="text-3xl font-bold text-on_surface tracking-tighter">
          Expertise
        </h2>
      </div>

      <div className="flex flex-wrap gap-4">
        {skills.map((skill) => (
          <HudChip key={skill._id}>{skill.name}</HudChip>
        ))}
      </div>
    </m.div>
  );
};
