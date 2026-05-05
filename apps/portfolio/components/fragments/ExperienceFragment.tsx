"use client";

import { useMemo } from "react";
import { m } from "framer-motion";
import { Experience } from "@/types/sanity";
import { GlitchText } from "@hstrejoluna/ui";
import { TelemetryHUD } from "@hstrejoluna/ui";
import { blockToPlainText } from "@/lib/utils";
import { useTranslations } from "next-intl";

interface ExperienceFragmentProps {
  experience: Experience;
}

/**
 * ExperienceFragment Component
 * Reimagines job history as a cinematic 'Chrono Log' with HUD data and code stream background.
 */
export const ExperienceFragment = ({ experience }: ExperienceFragmentProps) => {
  const tCommon = useTranslations("common");
  const t = useTranslations("fragments.experience");
  const formatDate = (dateStr?: string) =>
    dateStr ? dateStr.replace(/-/g, ".") : "N/A";
  const dateRange = `${formatDate(experience.startDate)} // ${experience.isCurrent ? tCommon("present") : experience.endDate ? formatDate(experience.endDate) : t("stable")}`;

  const backgroundDecoration = useMemo(
    () => (
      <div
        aria-hidden="true"
        className="absolute top-0 right-0 h-full w-1/2 opacity-[0.03] font-mono text-[8px] md:text-[10px] text-white overflow-hidden pointer-events-none select-none leading-none z-0"
      >
        {Array.from({ length: 100 }).map((_, i) => {
          // Deterministic LCG pseudo-random — same output on server & client
          let seed = (i + 1) * 9301 + 49297;
          const chars = "0123456789abcdefghijklmnopqrstuvwxyz";
          let str = "";
          for (let j = 0; j < 45; j++) {
            seed = (seed * 9301 + 49297) % 233280;
            str += chars[seed % chars.length];
          }
          return (
            <div key={i} className="whitespace-nowrap mb-1">
              {str}
            </div>
          );
        })}
      </div>
    ),
    [],
  );

  return (
    <section className="stream-fragment flex items-center justify-center p-6 md:p-24 relative overflow-hidden bg-void">
      {/* Background Code Stream Decoration */}
      {backgroundDecoration}

      <div className="w-full max-w-5xl z-10">
        <m.div
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="border-l-4 border-primary pl-8 md:pl-20 py-16 relative"
        >
          {/* Timeline Node Glow Indicator */}
          <div className="absolute top-0 left-0 -translate-x-[10px] w-4 h-4 bg-primary rounded-none shadow-[0_0_20px_rgba(255,42,0,1)]" />

          {/* HUD Metadata */}
          <TelemetryHUD
            identifier={experience.company || "ENTITY_UNDEFINED"}
            status="ACTIVE_OPS"
            dateRange={dateRange}
            className="mb-10"
          />

          {/* Main Role Title */}
          <h3 className="text-fluid-h2 font-black uppercase tracking-tighter mb-4 leading-[0.85] italic">
            <GlitchText text={experience.role} className="text-white" />
          </h3>

          {/* Company Context */}
          <div className="flex items-center gap-4 mb-12">
            <span className="w-12 h-[1px] bg-primary/40" />
            <div className="text-primary font-mono text-sm md:text-base tracking-[0.4em] uppercase font-bold">
              SYS_NODE: {experience.company}
            </div>
          </div>

          {/* Description / Log Entry */}
          <div className="text-white/40 text-lg md:text-xl font-light leading-relaxed max-w-3xl border-t border-white/5 pt-10">
            <span className="text-white/60 font-mono text-xs block mb-4 uppercase tracking-widest">
              {t("logEntry")}
            </span>
            {blockToPlainText(experience.description) || t("noLogEntry")}
          </div>
        </m.div>
      </div>

      {/* Side HUD Telemetry */}
      <div
        aria-hidden="true"
        className="absolute bottom-12 left-12 hidden lg:block font-mono text-[9px] text-white/10 tracking-[0.3em] uppercase rotate-90 origin-left"
      >
        {t("chronoLogSync")}
      </div>
    </section>
  );
};
