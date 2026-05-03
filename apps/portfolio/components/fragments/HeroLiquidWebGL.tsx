"use client";

import { useRef, useEffect, type ReactElement } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { MeshTransmissionMaterial } from "@react-three/drei/core/MeshTransmissionMaterial";
import { useLiquidHeroCapability } from "@hstrejoluna/ui";
import * as THREE from "three";
import type { Mesh } from "three";
import {
  getBurstStore,
  getScrollStore,
  computeBurstValue,
} from "./hero-uniform-store";

const BURST_DURATION_MS = 1200;

/**
 * Inner component — rendered INSIDE the r3f Canvas.
 *
 * Renders a fullscreen plane with a MeshTransmissionMaterial whose
 * uniforms are driven by:
 *  - uTime: clock elapsed time
 *  - uMx/uMy: cursor position (placeholder — wired in future phase)
 *  - uScroll: scroll progress from HeroLiquidField → scrollStore
 *  - uBurst: one-shot entrance burst (0→1→0 via computeBurstValue)
 */
const LiquidGlassPlane = () => {
  const meshRef = useRef<Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  // ── Entrance burst tween (design §3.3) ──────────────────────────
  useEffect(() => {
    const burst = getBurstStore();
    if (burst.hasPlayed()) return; // Already played this page load

    const start = performance.now();
    let raf = 0;

    const tick = (now: number) => {
      const elapsed = now - start;
      const t = Math.min(1, elapsed / BURST_DURATION_MS);
      burst.set(computeBurstValue(t));
      if (t < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        burst.set(0);
        burst.markPlayed();
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // ── Frame loop — reads stores to update uniforms ────────────────
  useFrame((state) => {
    if (!materialRef.current) return;
    const mat = materialRef.current;

    const burst = getBurstStore();
    const scroll = getScrollStore();

    if (mat.uniforms.uTime) {
      mat.uniforms.uTime.value = state.clock.elapsedTime;
    }
    if (mat.uniforms.uScroll) {
      mat.uniforms.uScroll.value = scroll.value;
    }
    if (mat.uniforms.uBurst) {
      mat.uniforms.uBurst.value = burst.value;
    }
  });

  return (
    <mesh ref={meshRef} position={[0, 0, 0]}>
      <planeGeometry args={[2, 2, 1, 1]} />
      <meshTransmissionMaterial
        ref={materialRef}
        transmission={1}
        thickness={1.5}
        ior={1.4}
        chromaticAberration={0.05}
        distortion={0.5}
        distortionScale={0.3}
        temporalDistortion={0.1}
        samples={6}
        resolution={256}
        backside
        transparent
        opacity={0.85}
        roughness={0.1}
        metalness={0}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        {...({
          uniforms: {
            uTime: { value: 0 },
            uMx: { value: 0.5 },
            uMy: { value: 0.5 },
            uScroll: { value: 0 },
            uBurst: { value: 0 },
          },
        } as any)}
      />
    </mesh>
  );
};

/**
 * HeroLiquidWebGL — WebGL refraction layer.
 *
 * Only renders a Three.js Canvas when `useLiquidHeroCapability()` returns
 * "css+webgl". Otherwise the component renders nothing.
 *
 * Design contract: spec § "WebGL refraction layer", design §2.
 */
export const HeroLiquidWebGL = (): ReactElement | null => {
  const capability = useLiquidHeroCapability();

  if (capability !== "css+webgl") {
    return null;
  }

  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 z-0 pointer-events-none"
    >
      <Canvas
        data-testid="r3f-canvas"
        dpr={[1, 1.5]}
        frameloop="demand"
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
        camera={{ position: [0, 0, 1], fov: 45 }}
        style={{ position: "absolute", inset: 0 }}
      >
        <LiquidGlassPlane />
      </Canvas>
    </div>
  );
};
