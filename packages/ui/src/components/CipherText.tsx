"use client";

import { useEffect, useMemo, useState } from "react";
import { m } from "framer-motion";

const cipherChars =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?/~`";

interface CipherTextProps {
  text: string;
  delay?: number;
  duration?: number;
  revealSpeed?: number;
}

export const CipherText = ({
  text,
  delay = 0,
  duration = 1.5,
  revealSpeed,
}: CipherTextProps) => {
  const [displayedText, setDisplayedText] = useState("");
  const stepMs = useMemo(() => {
    if (typeof revealSpeed === "number" && revealSpeed > 0) {
      return revealSpeed * 1000;
    }
    return Math.max((duration * 1000) / Math.max(text.length, 1), 16);
  }, [duration, revealSpeed, text.length]);

  useEffect(() => {
    if (!text) {
      setDisplayedText("");
      return;
    }

    let currentIndex = 0;
    let intervalId: ReturnType<typeof setInterval> | null = null;
    let scrambleTicks = 0;
    const ticksPerChar = 3;
    const delayTimeoutId = setTimeout(() => {
      intervalId = setInterval(() => {
        if (currentIndex >= text.length) {
          if (intervalId) clearInterval(intervalId);
          setDisplayedText(text);
          return;
        }

        const realChar = text[currentIndex];
        if (realChar === " ") {
          setDisplayedText((prev) => prev + realChar);
          currentIndex += 1;
          return;
        }

        scrambleTicks += 1;
        if (scrambleTicks < ticksPerChar) {
          const randomChar =
            cipherChars[Math.floor(Math.random() * cipherChars.length)];
          setDisplayedText(
            (prev) => prev.substring(0, currentIndex) + randomChar,
          );
          return;
        }

        scrambleTicks = 0;
        setDisplayedText((prev) => prev.substring(0, currentIndex) + realChar);
        currentIndex += 1;
      }, stepMs);
    }, delay * 1000);

    return () => {
      clearTimeout(delayTimeoutId);
      if (intervalId) clearInterval(intervalId);
    };
  }, [text, delay, stepMs]);

  return (
    <m.span
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: delay + 0.1 }}
      className="inline-block font-mono"
    >
      {displayedText}
    </m.span>
  );
};
