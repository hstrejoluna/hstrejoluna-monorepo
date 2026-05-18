"use client";

import { Link } from "@/i18n/navigation";
import { useCookieConsent } from "@hstrejoluna/compliance";
import { ShieldAlert } from "lucide-react";
import { useTranslations } from "next-intl";
import { LiquidGlass } from "@hstrejoluna/ui";

export default function CookieBanner() {
  const tCookie = useTranslations("cookie");
  const { shouldShowBanner, acceptCookies, rejectCookies } = useCookieConsent();

  if (!shouldShowBanner) {
    return null;
  }

  return (
    <div className="cookie-banner-shell fixed bottom-0 left-0 right-0 z-[100]">
      <LiquidGlass
        as="aside"
        variant="dialog"
        aria-label={tCookie("bannerLabel")}
        role="complementary"
        className="border-t border-white/10 p-4 text-sm text-gray-300 md:p-6"
      >
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-3">
            <ShieldAlert
              className="h-5 w-5 text-emerald-400"
              aria-hidden="true"
            />
            <p className="flex-1">
              {tCookie("message")}{" "}
              <Link
                href="/privacy"
                className="text-emerald-400 transition-colors hover:text-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-black"
              >
                {tCookie("privacyLink")}
              </Link>
              .
            </p>
          </div>
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:w-auto">
            <button
              onClick={rejectCookies}
              className="rounded-br-xl rounded-tl-xl border border-gray-500/20 bg-gray-500/10 px-6 py-2 font-mono text-gray-400 transition-all hover:bg-gray-500/20 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-black"
            >
              {tCookie("reject")}
            </button>
            <button
              onClick={acceptCookies}
              className="rounded-br-xl rounded-tl-xl border border-emerald-500/20 bg-emerald-500/10 px-6 py-2 font-mono text-emerald-400 transition-all hover:bg-emerald-500/20 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-black"
            >
              {tCookie("accept")}
            </button>
          </div>
        </div>
      </LiquidGlass>
    </div>
  );
}
