"use client";

import React, { type MouseEvent, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
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

/**
 * LiquidNav — Disruptive, gooey, refracted navigation dock.
 * Replaces CommandSurface with a highly aesthetic Liquid Glass implementation.
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
  const resolvedLabels = { ...defaultLabels, ...labels };

  const handleNavigate = (
    event: MouseEvent<HTMLAnchorElement | HTMLButtonElement>,
    sectionId: string
  ) => {
    event.preventDefault();
    onSectionNavigate?.(sectionId);
    setIsMenuOpen(false);
  };

  return (
    <motion.header
      data-testid="liquid-nav"
      className={cn(
        "fixed bottom-4 left-4 right-4 md:bottom-8 md:left-1/2 md:right-auto md:-translate-x-1/2 z-50",
        shouldHide ? "pointer-events-none" : "",
        className
      )}
      initial={{ y: 100 }}
      animate={{ y: shouldHide ? 140 : 0, opacity: shouldHide ? 0 : 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
    >
      <LiquidGlass
        variant="dock"
        intensity="high"
        className="relative flex items-center justify-between md:justify-center h-14 md:h-16 gap-4 p-3 border border-white/10 shadow-2xl rounded-full"
      >
        {/* Left/Mobile: Status & Children (LocaleSwitcher) */}
        <div className="flex items-center gap-3 pl-2">
          <div className="hidden md:flex items-center gap-2 text-xs font-mono text-on_surface_variant min-w-[160px]">
            <span className="relative flex h-2 w-2 flex-shrink-0">
              <span className="absolute inline-flex h-2 w-2 animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
            <span className="uppercase tracking-widest truncate">{statusLabel}</span>
          </div>
          {children}
        </div>

        {/* Center: Desktop Nav Links (Gooey) */}
        <div className="relative hidden md:flex items-center justify-center">
          {/* Gooey Background Layer */}
          <div 
            className="absolute inset-0 pointer-events-none flex items-center gap-2 px-4 opacity-30"
            style={{ filter: `url(#${LG_FILTER_IDS.gooey})` }}
          >
            {sections.map((section) => {
              const isActive = activeId === section.id;
              return (
                <div key={`bg-${section.id}`} className="relative px-4 py-2 text-xs font-mono uppercase tracking-widest">
                  {/* Invisible placeholder to force matching box width */}
                  <span className="opacity-0">{section.shortLabel ?? section.label}</span>
                  <AnimatePresence>
                    {isActive && (
                      <motion.div
                        layoutId="liquid-active-pill"
                        className="absolute inset-0 bg-primary rounded-full"
                        transition={{
                          type: "spring",
                          stiffness: 150,
                          damping: 18,
                          mass: 1.2
                        }}
                      />
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>

          {/* Interactive Text Layer */}
          <nav aria-label="Primary sections" className="relative flex items-center gap-2 px-4">
            {sections.map((section) => {
              const isActive = activeId === section.id;
              return (
                <button
                  key={section.id}
                  onClick={(e) => handleNavigate(e, section.id)}
                  className={cn(
                    "relative px-4 py-2 text-xs font-mono uppercase tracking-widest transition-colors duration-500 focus-visible:outline-none cursor-pointer",
                    isActive ? "text-primary drop-shadow-[0_0_8px_rgba(255,180,165,0.4)]" : "text-on_surface hover:text-white"
                  )}
                  aria-current={isActive ? "location" : undefined}
                >
                  <span className="relative z-10">{section.shortLabel ?? section.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right: Desktop Socials */}
        <div className="hidden md:flex items-center gap-4 pr-4 border-l border-surface_container_highest pl-4">
          {socials.map((social) => (
            <a
              key={social.kind}
              href={social.href}
              aria-label={social.label}
              className="text-xs font-mono uppercase text-on_surface_variant transition-colors hover:text-primary focus-visible:outline-none"
              target={social.external ? "_blank" : undefined}
              rel={social.external ? "noopener noreferrer external" : undefined}
            >
              {social.label}
            </a>
          ))}
        </div>

        {/* Mobile Toggle */}
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

      {/* Mobile Panel */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            id="mobile-liquid-panel"
            className="absolute bottom-[calc(100%+16px)] left-0 right-0 z-40 md:hidden"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
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
                        isActive ? "bg-primary/20 text-primary" : "text-on_surface hover:bg-white/5"
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
                        target={social.external ? "_blank" : undefined}
                        rel={social.external ? "noopener noreferrer external" : undefined}
                      >
                        {social.label}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </LiquidGlass>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
};
