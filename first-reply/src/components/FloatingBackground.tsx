"use client";

import { useEffect, useRef, useState } from "react";

// Animated backdrop for the public pages: a night skyline, rows of "FirstReply"
// lettering gliding across at different heights, and gold reply bubbles that
// float around. Add ?controls=1 to the page address to show the arrow pad that
// steers the bubbles (it stays hidden for visitors).

type Direction = "float" | "up" | "down" | "left" | "right";

const VECTORS: Record<Direction, { x: number; y: number }> = {
  float: { x: 0.3, y: -1 }, // default: a slow upward drift with a little sideways sway
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

// x/y are the starting position as a fraction of the screen; speed is pixels
// per second; larger bubbles move a little slower so they feel closer.
const BUBBLES = [
  { size: 150, x: 0.1, y: 0.7, speed: 18, op: 0.9, blur: 0 },
  { size: 96, x: 0.32, y: 0.2, speed: 26, op: 0.85, blur: 0 },
  { size: 210, x: 0.55, y: 0.45, speed: 14, op: 0.9, blur: 0 },
  { size: 80, x: 0.78, y: 0.15, speed: 30, op: 0.8, blur: 0 },
  { size: 120, x: 0.9, y: 0.6, speed: 22, op: 0.75, blur: 0 },
  { size: 56, x: 0.05, y: 0.12, speed: 36, op: 0.5, blur: 1.5 },
  { size: 52, x: 0.45, y: 0.82, speed: 38, op: 0.45, blur: 1.5 },
  { size: 64, x: 0.7, y: 0.88, speed: 34, op: 0.5, blur: 1.5 },
  { size: 320, x: 0.25, y: 0.5, speed: 9, op: 0.14, blur: 12 },
  { size: 380, x: 0.8, y: 0.35, speed: 8, op: 0.12, blur: 14 },
];

// Rows of lettering: height on the screen, size, speed (seconds per pass),
// direction and strength.
const ROWS = [
  { top: "6%", size: "clamp(2.5rem, 7vw, 6rem)", seconds: 110, reverse: false, o: 0.16 },
  { top: "19%", size: "clamp(1.5rem, 4vw, 3.5rem)", seconds: 70, reverse: true, o: 0.22 },
  { top: "31%", size: "clamp(3rem, 9vw, 8rem)", seconds: 140, reverse: false, o: 0.12 },
  { top: "47%", size: "clamp(1.25rem, 3vw, 2.5rem)", seconds: 55, reverse: true, o: 0.26 },
  { top: "60%", size: "clamp(2rem, 6vw, 5rem)", seconds: 95, reverse: false, o: 0.15 },
  { top: "73%", size: "clamp(1.5rem, 4.5vw, 4rem)", seconds: 80, reverse: true, o: 0.2 },
  { top: "86%", size: "clamp(2.5rem, 8vw, 7rem)", seconds: 125, reverse: false, o: 0.13 },
];

const WORD_RUN = Array.from({ length: 10 }, () => "FirstReply").join("  ✦  ");

export function FloatingBackground() {
  const bubbleRefs = useRef<(HTMLDivElement | null)[]>([]);
  const directionRef = useRef<Direction>("float");
  const speedRef = useRef(1);
  const [direction, setDirection] = useState<Direction>("float");
  const [speed, setSpeed] = useState(1);
  const [showControls, setShowControls] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    directionRef.current = direction;
  }, [direction]);
  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  useEffect(() => {
    setShowControls(new URLSearchParams(window.location.search).get("controls") === "1");
    setReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  useEffect(() => {
    let width = window.innerWidth;
    let height = window.innerHeight;
    const state = BUBBLES.map((b) => ({
      x: b.x * width,
      y: b.y * height,
      phase: Math.random() * Math.PI * 2,
    }));

    const place = (i: number, rotate: number) => {
      const el = bubbleRefs.current[i];
      if (el) el.style.transform = `translate3d(${state[i].x}px, ${state[i].y}px, 0) rotate(${rotate}deg)`;
    };

    const onResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
    };
    window.addEventListener("resize", onResize);

    if (reducedMotion) {
      state.forEach((_, i) => place(i, 0));
      return () => window.removeEventListener("resize", onResize);
    }

    let last = performance.now();
    let elapsed = 0;
    let frame = 0;
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      elapsed += dt;
      const dir = VECTORS[directionRef.current];
      const gain = speedRef.current;
      BUBBLES.forEach((b, i) => {
        const s = state[i];
        const sway = directionRef.current === "float" ? 1 : 0.35;
        s.x += (dir.x * b.speed * gain + Math.sin(elapsed * 0.6 + s.phase) * 12 * sway) * dt;
        s.y += (dir.y * b.speed * gain + Math.cos(elapsed * 0.5 + s.phase) * 8 * sway) * dt;
        // wrap around the edges so bubbles keep coming back
        if (s.x > width + b.size) s.x = -b.size;
        if (s.x < -b.size) s.x = width + b.size;
        if (s.y > height + b.size) s.y = -b.size;
        if (s.y < -b.size) s.y = height + b.size;
        place(i, Math.sin(elapsed * 0.4 + s.phase) * 8);
      });
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", onResize);
    };
  }, [reducedMotion]);

  const padButton = (dir: Direction, label: string, glyph: string, extra = "") => (
    <button
      type="button"
      aria-label={label}
      aria-pressed={direction === dir}
      onClick={() => setDirection(dir)}
      className={`flex h-9 w-9 items-center justify-center rounded-lg border text-lg leading-none transition ${
        direction === dir
          ? "border-amber-300 bg-amber-400 text-black"
          : "border-amber-400/40 bg-black/60 text-amber-200 hover:bg-amber-400/20"
      } ${extra}`}
    >
      {glyph}
    </button>
  );

  return (
    <>
      {/* shared gradient and bubble shape used by every floating bubble */}
      <svg width="0" height="0" className="absolute" aria-hidden="true">
        <defs>
          <linearGradient id="fr-gold" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#F7E08A" />
            <stop offset="0.5" stopColor="#D4AF37" />
            <stop offset="1" stopColor="#A67C00" />
          </linearGradient>
          <g id="fr-bubble">
            <rect x="0" y="0" width="100" height="70" rx="24" fill="url(#fr-gold)" />
            <path d="M20 62 L8 84 L44 66 Z" fill="url(#fr-gold)" />
            <path d="M53 14 L35 37.4 L45.8 37.4 L42.2 56 L65 29 L53.6 29 Z" fill="#0A0A0A" />
          </g>
        </defs>
      </svg>

      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-[#05070b]">
        {/* skyline photo-style backdrop */}
        <div
          className="absolute inset-0 bg-cover bg-bottom"
          style={{ backgroundImage: "url(/bg-skyline.webp)" }}
        />
        {/* warm horizon glow that slowly breathes */}
        <div className="fr-glow absolute inset-0" />
        {/* darken the top and bottom so page text stays easy to read */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/10 to-black/60" />

        {/* "FirstReply" rows gliding across at different heights */}
        {ROWS.map((row, i) => (
          <div
            key={i}
            className={`fr-row ${row.reverse ? "fr-row-reverse" : ""}`}
            style={
              {
                top: row.top,
                fontSize: row.size,
                "--fr-seconds": `${row.seconds}s`,
                "--fr-o": row.o,
              } as React.CSSProperties
            }
          >
            <span>{WORD_RUN}</span>
            <span>{WORD_RUN}</span>
          </div>
        ))}

        {/* floating reply bubbles */}
        {BUBBLES.map((b, i) => (
          <div
            key={i}
            ref={(el) => {
              bubbleRefs.current[i] = el;
            }}
            className="absolute left-0 top-0 will-change-transform"
            style={{
              width: b.size,
              height: b.size * 0.84,
              opacity: b.op,
              filter: b.blur ? `blur(${b.blur}px)` : "drop-shadow(0 0 14px rgba(242,199,92,0.45))",
            }}
          >
            <svg viewBox="0 0 100 84" width="100%" height="100%">
              <use href="#fr-bubble" />
            </svg>
          </div>
        ))}
      </div>

      {showControls && (
        <div
          role="group"
          aria-label="Steer the floating background"
          className="fixed bottom-4 right-4 z-40 flex flex-col items-center gap-2 rounded-2xl border border-amber-400/40 bg-black/70 p-3 text-amber-200 shadow-xl backdrop-blur"
        >
          <p className="text-[11px] font-semibold uppercase tracking-widest text-amber-300">Drift</p>
          {padButton("up", "Drift up", "↑")}
          <div className="flex gap-2">
            {padButton("left", "Drift left", "←")}
            {padButton("float", "Free float", "●")}
            {padButton("right", "Drift right", "→")}
          </div>
          {padButton("down", "Drift down", "↓")}
          <div className="mt-1 flex items-center gap-2 text-xs">
            <button
              type="button"
              aria-label="Slower"
              onClick={() => setSpeed((v) => Math.max(0.25, +(v / 1.5).toFixed(2)))}
              className="h-8 rounded-lg border border-amber-400/40 px-2 hover:bg-amber-400/20"
            >
              Slower
            </button>
            <button
              type="button"
              aria-label="Faster"
              onClick={() => setSpeed((v) => Math.min(8, +(v * 1.5).toFixed(2)))}
              className="h-8 rounded-lg border border-amber-400/40 px-2 hover:bg-amber-400/20"
            >
              Faster
            </button>
          </div>
          {reducedMotion && <p className="max-w-[10rem] text-center text-[10px] text-amber-200/70">Motion is off in your device settings.</p>}
        </div>
      )}
    </>
  );
}
