"use client";

import { m } from "framer-motion";
import { Skill } from "@/types/sanity";
import { GlitchText } from "@hstrejoluna/ui";

interface SkillsFragmentProps {
  skills: Skill[];
}

/**
 * SkillsFragment Component
 * Displays technical expertise as a 'Neural Map' of technical modules.
 */
export const SkillsFragment = ({ skills }: SkillsFragmentProps) => {
  const categories = Array.from(new Set(skills.map((s) => s.category)));

  return (
    <section className="stream-fragment flex items-center justify-center p-6 md:p-24 relative overflow-hidden bg-background">
      {/* Background HUD Grid Decoration */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[length:100px_100px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_80%)]" />

      <div className="w-full max-w-7xl z-10">
        <m.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24 items-start"
        >
          {/* Header Panel */}
          <div className="lg:col-span-4">
            <div className="font-mono text-[10px] md:text-xs tracking-[0.5em] text-ember mb-8 uppercase flex items-center gap-4">
              <span className="w-8 h-[1px] bg-ember/30" />
              [NEURAL_MAPPING_V4.2]
            </div>
            <h2 className="text-fluid-hero font-black uppercase tracking-tighter mb-8 md:mb-10 leading-[0.8] italic">
              <GlitchText text="Skill" className="text-white" />
              <br />
              <GlitchText text="Map" className="text-white/10" />
            </h2>
            <p className="text-white/30 text-lg font-light leading-relaxed max-w-xs border-l-2 border-white/5 pl-6">
              SYSTEM_DECOMPOSITION: Systematic breakdown of architectural
              modules, language fluencies, and ecosystem synchronization.
            </p>
          </div>

          {/* Modules Grid */}
          <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-12">
            {categories.map((category, idx) => (
              <m.div
                key={category}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="space-y-8"
              >
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <h3 className="font-mono text-[11px] tracking-[0.6em] text-ember uppercase font-bold">
                    {category}_CORE
                  </h3>
                  <span className="font-mono text-[9px] text-white/20">
                    V.0{idx + 1}
                  </span>
                </div>

                <div className="flex flex-wrap gap-4">
                  {skills
                    .filter((s) => s.category === category)
                    .map((skill) => (
                      <m.div
                        key={skill._id}
                        whileHover={{
                          scale: 1.05,
                          color: "#FFFFFF",
                          borderColor: "rgba(255,42,0,0.5)",
                          backgroundColor: "rgba(255,42,0,0.05)",
                        }}
                        className="px-5 py-2.5 border border-white/5 text-white/40 font-mono text-[10px] md:text-xs tracking-[0.2em] uppercase cursor-crosshair transition-all duration-300 bg-white/[0.02]"
                      >
                        {skill.name}
                      </m.div>
                    ))}
                </div>
              </m.div>
            ))}
          </div>
        </m.div>
      </div>

      {/* Floating coordinates HUD */}
      <div className="absolute top-12 left-12 hidden lg:block font-mono text-[9px] text-white/10 tracking-[0.3em] uppercase">
        ACTIVE_NODES: {skills.length}
        <br />
        SYNC_RATE: 99.9%
      </div>
    </section>
  );
};
