"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import { LiquidGlass } from "@hstrejoluna/ui";

export function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  function onLocaleChange(nextLocale: "en" | "es") {
    router.replace(pathname, { locale: nextLocale });
  }

  return (
    <LiquidGlass
      variant="pill"
      intensity="low"
      className="flex items-center gap-1 p-1 border border-white/10 rounded-sm"
    >
      {(["en", "es"] as const).map((cur) => (
        <button
          key={cur}
          onClick={() => onLocaleChange(cur)}
          className={`px-2 py-0.5 text-[10px] font-mono transition-all duration-300 uppercase ${
            locale === cur
              ? "bg-ember text-void font-bold"
              : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
          }`}
          aria-label={`${cur.toUpperCase()} — Switch to ${cur === "en" ? "English" : "Spanish"}`}
          aria-pressed={locale === cur}
        >
          {cur}
        </button>
      ))}
    </LiquidGlass>
  );
}
