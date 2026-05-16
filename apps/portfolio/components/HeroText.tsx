import { getTranslations } from "next-intl/server";
import Link from "next/link";
import type { Profile } from "@/types/sanity";

interface HeroTextProps {
  profile: Profile | null;
  locale: string;
}

/**
 * HeroText — Server Component. Fast SSR hero shell for LCP.
 *
 * Renders SEO-critical content (eyebrow, h1, lead, CTAs) without any
 * client-side JS. The visual liquid-glass layer is deferred to the
 * dynamic ObsidianStream client component.
 */
export const HeroText = async ({ profile, locale }: HeroTextProps) => {
  const t = await getTranslations({ locale, namespace: "hero" });
  const lead = profile?.headline ?? t("lead");

  return (
    <section id="hero" aria-labelledby="hero-title" className="relative">
      {/* Text content — zero JS shipped */}
      <div className="z-10 relative flex flex-col items-start w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-24 pt-24 md:pt-32 pb-16 md:pb-24">
        {/* Eyebrow */}
        <p className="font-mono text-[10px] md:text-xs tracking-[0.5em] text-ember mb-6 uppercase">
          {t("eyebrow")}
        </p>

        {/* h1 — the LCP candidate */}
        <h1
          id="hero-title"
          className="text-[clamp(3rem,8vw,7rem)] font-black tracking-tighter leading-[0.9] uppercase italic text-white mb-8 md:mb-12"
        >
          {t("h1Name")}
          {" — "}
          {t("h1Role")}
        </h1>

        {/* Lead paragraph */}
        <p className="text-sm md:text-lg text-white/90 font-light leading-relaxed max-w-2xl mb-10">
          {lead}
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="#projects"
            aria-label={`${t("ctaAriaLabel")} — ${t("cta")}`}
            className="inline-flex items-center px-8 py-4 bg-ember text-[#3a0000] font-mono tracking-[0.3em] uppercase text-xs font-bold transition-all duration-300 hover:bg-ember/80 rounded-tl-[16px] rounded-br-[16px]"
          >
            {t("cta")}
          </Link>

          <a
            href={t("secondaryHref")}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-8 py-4 border border-white/10 text-white/60 font-mono tracking-[0.3em] uppercase text-xs font-bold transition-all duration-300 hover:border-ember/30 hover:text-white rounded-tl-[16px] rounded-br-[16px]"
          >
            {t("secondaryLabel")}
          </a>
        </div>
      </div>

      {/* Portal mount point — HeroLiquidField renders here via createPortal
          from ObsidianStream, replacing the static CSS blobs with the full
          animated/WebGL liquid glass visual. */}
      <div id="hero-visual-mount" aria-hidden="true" />

      {/* Static visual placeholder — pure CSS, zero JS.
          Replaced by HeroLiquidField's WebGL canvas on capable devices
          once the client bundle loads. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 z-0 overflow-hidden pointer-events-none"
      >
        {/* Blob 1 — primary */}
        <div
          className="hero-blob hero-blob--primary absolute w-[60vw] h-[60vw] max-w-[800px] max-h-[800px] rounded-full opacity-60"
          style={{
            background:
              "radial-gradient(circle, rgba(255,86,55,0.3) 0%, rgba(255,86,55,0.05) 50%, transparent 70%)",
            left: "calc(0.5 * 100% - 30vw)",
            top: "calc(0.5 * 100% - 30vw)",
            filter: "blur(40px)",
          }}
        />

        {/* Blob 2 — secondary */}
        <div
          className="hero-blob hero-blob--secondary absolute w-[40vw] h-[40vw] max-w-[500px] max-h-[500px] rounded-full opacity-40"
          style={{
            background:
              "radial-gradient(circle, rgba(209,77,255,0.2) 0%, rgba(209,77,255,0.03) 60%, transparent 80%)",
            right: "calc(0.5 * 100% - 20vw)",
            bottom: "calc(0.5 * 100% - 20vw)",
            filter: "blur(50px)",
          }}
        />

        {/* Blob 3 — accent */}
        <div
          className="hero-blob hero-blob--accent absolute w-[30vw] h-[30vw] max-w-[350px] max-h-[350px] rounded-full opacity-30"
          style={{
            background:
              "radial-gradient(circle, rgba(34,197,94,0.15) 0%, rgba(34,197,94,0.02) 60%, transparent 80%)",
            left: "calc(0.5 * 100% - 20vw)",
            bottom: "calc(0.5 * 100% - 25vw)",
            filter: "blur(35px)",
          }}
        />
      </div>
    </section>
  );
};
