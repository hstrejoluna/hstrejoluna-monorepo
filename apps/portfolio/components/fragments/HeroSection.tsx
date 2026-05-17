import { useTranslations } from "next-intl";
import Link from "next/link";
import type { Profile } from "@/types/sanity";

interface HeroSectionProps {
  profile: Profile | null;
}

/** SEO-critical hero rendered server-side with zero JS. */
export const HeroSection = ({ profile }: HeroSectionProps) => {
  const t = useTranslations("hero");

  const h1Name = t("h1Name");
  const h1Role = t("h1Role");
  const eyebrow = t("eyebrow");
  const lead = profile?.headline ?? t("lead");
  const primaryCta = t("cta");
  const secondaryLabel = t("secondaryLabel");
  const secondaryHref = t("secondaryHref");

  return (
    <section id="hero" aria-labelledby="hero-title" className="relative z-[1] pointer-events-none">
      <div className="relative z-[2] pointer-events-none flex flex-col items-start w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-24">
        <p className="font-mono text-[10px] md:text-xs tracking-[0.5em] text-ember mb-6 uppercase">
          {eyebrow}
        </p>

        <h1
          id="hero-title"
          className="text-[clamp(3rem,8vw,7rem)] font-black tracking-tighter leading-[0.9] uppercase italic text-white mb-8 md:mb-12"
        >
          {h1Name}
          {" — "}
          {h1Role}
        </h1>

        <p className="text-sm md:text-lg text-white/90 font-light leading-relaxed max-w-2xl mb-10">
          {lead}
        </p>

        <div className="flex flex-col sm:flex-row gap-4 pointer-events-auto">
          <Link
            href="#projects"
            aria-label={`${primaryCta} — ${t("ctaAriaLabel")}`}
            className="inline-flex items-center px-8 py-4 bg-ember text-[#3a0000] font-mono tracking-[0.3em] uppercase text-xs font-bold transition-all duration-300 hover:bg-ember/80 rounded-tl-[16px] rounded-br-[16px]"
          >
            {primaryCta}
          </Link>

          <a
            href={secondaryHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-8 py-4 border border-white/10 text-white/60 font-mono tracking-[0.3em] uppercase text-xs font-bold transition-all duration-300 hover:border-ember/30 hover:text-white rounded-tl-[16px] rounded-br-[16px]"
          >
            {secondaryLabel}
          </a>
        </div>
      </div>

      <div
        className="hero-blob hero-blob-drift-1 absolute -top-[10%] -left-[5%] w-[45%] h-[55%] rounded-[40%_60%_60%_40%/45%_45%_55%_55%] bg-gradient-to-br from-ember/15 via-ember/5 to-transparent blur-3xl"
        aria-hidden="true"
      />
      <div
        className="hero-blob hero-blob-drift-2 absolute top-[5%] -right-[10%] w-[40%] h-[50%] rounded-[60%_40%_40%_60%/55%_55%_45%_45%] bg-gradient-to-tl from-primary/10 via-primary/5 to-transparent blur-3xl"
        aria-hidden="true"
      />
      <div
        className="hero-blob hero-blob-drift-3 absolute -bottom-[15%] left-[20%] w-[35%] h-[45%] rounded-[50%_50%_45%_55%/60%_40%_60%_40%] bg-gradient-to-tr from-accent/8 via-accent/3 to-transparent blur-3xl"
        aria-hidden="true"
      />
    </section>
  );
};
