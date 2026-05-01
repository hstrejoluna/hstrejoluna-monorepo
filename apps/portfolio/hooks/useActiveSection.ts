import { useEffect, useRef, useState } from "react";

export function useActiveSection<T extends string>(
  sectionIds: readonly T[],
  threshold: number = 0.5,
  ready: boolean = true
) {
  const [activeId, setActiveId] = useState<T | "">("");
  const visibleEntriesRef = useRef<Map<T, IntersectionObserverEntry>>(new Map());

  useEffect(() => {
    if (!ready) return;

    const safeThreshold = Math.min(Math.max(threshold, 0.1), 1);
    const viewportBandInsetPercent = ((1 - safeThreshold) / 2) * 100;

    const options = {
      root: null,
      // Observe sections inside a centered viewport band so tall sections
      // (like certificates) can still become active reliably.
      rootMargin: `-${viewportBandInsetPercent}% 0px -${viewportBandInsetPercent}% 0px`,
      threshold: 0,
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const id = entry.target.id as T;
        if (entry.isIntersecting) {
          visibleEntriesRef.current.set(id, entry);
        } else {
          visibleEntriesRef.current.delete(id);
        }
      });

      const viewportCenterY = window.innerHeight / 2;
      const nextEntry = [...visibleEntriesRef.current.values()]
        .sort((a, b) => {
          const aCenter = a.boundingClientRect.top + a.boundingClientRect.height / 2;
          const bCenter = b.boundingClientRect.top + b.boundingClientRect.height / 2;

          return Math.abs(aCenter - viewportCenterY) - Math.abs(bCenter - viewportCenterY);
        })
        .at(0);

      if (nextEntry) {
        setActiveId(nextEntry.target.id as T);
      }
    }, options);

    sectionIds.forEach((id) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });

    return () => {
      visibleEntriesRef.current.clear();
      sectionIds.forEach((id) => {
        const element = document.getElementById(id);
        if (element) observer.unobserve(element);
      });
      observer.disconnect();
    };
  }, [sectionIds, threshold, ready]);

  return activeId;
}
