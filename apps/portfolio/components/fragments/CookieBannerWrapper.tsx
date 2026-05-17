"use client";

import dynamic from "next/dynamic";

function CookieBannerFallback() {
  return <div aria-hidden="true" className="min-h-[80px] w-full" />;
}

const CookieBanner = dynamic(() => import("./CookieBanner"), {
  ssr: false,
  loading: CookieBannerFallback,
});

export function CookieBannerWrapper() {
  return <CookieBanner />;
}
