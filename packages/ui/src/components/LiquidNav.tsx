"use client";

import React, { type MouseEvent, useEffect, useState } from "react";
import { LiquidGlass } from "../liquid-glass";
import { cn } from "../utils/cn";
import { LG_FILTER_IDS } from "../liquid-glass/filter-defs";

export interface LiquidNavSection {
  id: string;
  label: string;
  shortLabel?: string;
}

export interface LiquidNavSocialLink {
  kind: string;
  href: string;
  label: string;
  external?: boolean;
}

export interface LiquidNavLabels {
  menu: string;
  close: string;
  socialHeading: string;
}

export interface LiquidNavProps {
  activeId: string;
  sections: readonly LiquidNavSection[];
  socials?: readonly LiquidNavSocialLink[];
  hideOnScroll?: boolean;
  onSectionNavigate?: (sectionId: string) => void;
  statusLabel?: string;
  labels?: Partial<LiquidNavLabels>;
  children?: React.ReactNode;
  className?: string;
}

const defaultLabels: LiquidNavLabels = {
  menu: "Menu",
  close: "Close",
  socialHeading: "Social",
};

const externalLinkProps = (social: LiquidNavSocialLink) =>
  social.external
    ? { target: "_blank" as const, rel: "noopener noreferrer external" }
    : {};

/**
 * LiquidNav — Disruptive, gooey, refracted navigation dock.
 * Pure-CSS animations (no framer-motion). Apps must include
 * `@hstrejoluna/ui/styles/liquid-nav.css` once at the root.
 */
export const LiquidNav = ({
  activeId,
  sections,
  socials = [],
  hideOnScroll = false,
  onSectionNavigate,
  statusLabel = "SYSTEM ONLINE",
  labels,
  children,
  className,
}: LiquidNavProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const shouldHide = hideOnScroll && !isMenuOpen;

  // When the mobile menu is open, add a class to <body> that disables
  // pointer-events on any hero CTA that uses pointer-events-auto
  // inside a pointer-events-none parent. Without this, Mobile Safari
  // treats the hero CTA as a click target that intercepts taps meant
  // for the mobile nav panel buttons.
  useEffect(() => {
    if (isMenuOpen) {
      document.body.classList.add("mobile-nav-open");
    } else {
      document.body.classList.remove("mobile-nav-open");
    }
    return () => {
      document.body.classList.remove("mobile-nav-open");
    };
  }, [isMenuOpen]);
  const resolvedLabels = { ...defaultLabels, ...labels };

  const handleNavigate = (
    event: MouseEvent<HTMLAnchorElement | HTMLButtonElement>,
    sectionId: string,
  ) => {
    event.preventDefault();
    onSectionNavigate?.(sectionId);
    setIsMenuOpen(false);
  };

  return (
    <header
      data-testid="liquid-nav"
      data-hidden={shouldHide ? "true" : "false"}
      className={cn(
        "liquid-nav-root fixed bottom-4 left-4 right-4 md:bottom-8 md:left-1/2 md:right-auto md:-translate-x-1/2 z-50",
        shouldHide ? "pointer-events-none" : "",
        className,
      )}
    >
      <LiquidGlass
        variant="dock"
        intensity="high"
        className="relative flex items-center justify-between md:justify-center h-14 md:h-16 gap-4 p-3 border border-white/10 shadow-2xl rounded-full"
      >
        <div className="flex items-center gap-3 pl-2">
          <div className="hidden md:flex items-center gap-2 text-xs font-mono text-on_surface_variant min-w-[160px]">
            <span className="relative flex h-2 w-2 flex-shrink-0">
              <span className="absolute inline-flex h-2 w-2 animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
            <span className="uppercase tracking-widest truncate">
              {statusLabel}
            </span>
          </div>
          {children}
        </div>

        <div className="relative hidden md:flex items-center justify-center">
          <div
            className="absolute inset-0 pointer-events-none flex items-center gap-2 px-4 opacity-30"
            style={{ filter: `url(#${LG_FILTER_IDS.gooey})` }}
          >
            {sections.map((section) => {
              const isActive = activeId === section.id;
              return (
                <div
                  key={`bg-${section.id}`}
                  className="relative px-4 py-2 text-xs font-mono uppercase tracking-widest"
                >
                  <span className="opacity-0">
                    {section.shortLabel ?? section.label}
                  </span>
                  <span
                    aria-hidden="true"
                    data-active={isActive ? "true" : "false"}
                    className="liquid-nav-pill absolute inset-0 bg-primary rounded-full"
                  />
                </div>
              );
            })}
          </div>

          <nav
            aria-label="Primary sections"
            className="relative flex items-center gap-2 px-4"
          >
            {sections.map((section) => {
              const isActive = activeId === section.id;
              return (
                <button
                  key={section.id}
                  onClick={(e) => handleNavigate(e, section.id)}
                  className={cn(
                    "relative px-4 py-2 text-xs font-mono uppercase tracking-widest transition-colors duration-500 focus-visible:outline-none cursor-pointer",
                    isActive
                      ? "text-primary drop-shadow-[0_0_8px_rgba(255,180,165,0.4)]"
                      : "text-on_surface hover:text-white",
                  )}
                  aria-current={isActive ? "location" : undefined}
                >
                  <span className="relative z-10">
                    {section.shortLabel ?? section.label}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="hidden md:flex items-center gap-4 pr-4 border-l border-surface_container_highest pl-4">
          {socials.map((social) => (
            <a
              key={social.kind}
              href={social.href}
              aria-label={social.label}
              className="text-xs font-mono uppercase text-on_surface_variant transition-colors hover:text-primary focus-visible:outline-none"
              {...externalLinkProps(social)}
            >
              {social.label}
            </a>
          ))}
        </div>

        <button
          type="button"
          className="md:hidden flex items-center justify-center rounded-full bg-surface_container_highest/50 px-4 py-2 text-[11px] font-mono uppercase tracking-wider text-on_surface focus-visible:outline-none cursor-pointer"
          aria-expanded={isMenuOpen}
          aria-controls="mobile-liquid-panel"
          onClick={() => setIsMenuOpen((p) => !p)}
        >
          {isMenuOpen ? resolvedLabels.close : resolvedLabels.menu}
        </button>
      </LiquidGlass>

      {isMenuOpen && (
        <div
          id="mobile-liquid-panel"
          data-state="open"
          className="liquid-nav-mobile-panel absolute bottom-[calc(100%+16px)] left-0 right-0 z-40 md:hidden"
        >
          <LiquidGlass
            variant="dialog"
            intensity="high"
            className="p-4 border border-white/10 rounded-3xl shadow-2xl flex flex-col gap-4"
          >
            <nav aria-label="Mobile sections" className="flex flex-col gap-2">
              {sections.map((section) => {
                const isActive = activeId === section.id;
                return (
                  <button
                    key={`mob-${section.id}`}
                    onClick={(e) => handleNavigate(e, section.id)}
                    className={cn(
                      "w-full text-left px-4 py-3 rounded-xl text-sm font-mono uppercase tracking-wider transition-colors cursor-pointer",
                      isActive
                        ? "bg-primary/20 text-primary"
                        : "text-on_surface hover:bg-white/5",
                    )}
                  >
                    {section.label}
                  </button>
                );
              })}
            </nav>

            {socials.length > 0 && (
              <div className="pt-4 border-t border-white/10">
                <p className="mb-3 px-2 text-[10px] font-mono uppercase tracking-widest text-on_surface_variant">
                  {resolvedLabels.socialHeading}
                </p>
                <div className="flex flex-wrap gap-2">
                  {socials.map((social) => (
                    <a
                      key={`mob-soc-${social.kind}`}
                      href={social.href}
                      className="px-3 py-2 rounded-lg bg-surface_container_highest/30 text-xs font-mono text-on_surface transition-colors hover:text-primary"
                      {...externalLinkProps(social)}
                    >
                      {social.label}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </LiquidGlass>
        </div>
      )}
    </header>
  );
};
