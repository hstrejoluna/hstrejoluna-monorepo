"use client";

import { m, useMotionValue, useTransform, animate } from "framer-motion";
import { useRef } from "react";
import type { MouseEvent, ReactNode } from "react";

interface MicroInteractionProps {
  children: ReactNode;
  className?: string;
}

export const MicroInteraction = ({
  children,
  className = "",
}: MicroInteractionProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const rectRef = useRef<DOMRect | null>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateX = useTransform(y, [-100, 100], [5, -5]);
  const rotateY = useTransform(x, [-100, 100], [-5, 5]);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    const rect = rectRef.current;
    if (!rect) return;

    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    x.set(e.clientX - centerX);
    y.set(e.clientY - centerY);
  };

  const handleMouseEnter = () => {
    if (!ref.current) return;
    rectRef.current = ref.current.getBoundingClientRect();
  };

  const handleMouseLeave = () => {
    rectRef.current = null;
    animate(x, 0, { duration: 0.5 });
    animate(y, 0, { duration: 0.5 });
  };

  return (
    <m.div
      ref={ref}
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ rotateX, rotateY, z: 10 }}
      whileHover={{ scale: 1.02 }}
      className={`transition-transform duration-300 ${className}`}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      {children}
    </m.div>
  );
};
