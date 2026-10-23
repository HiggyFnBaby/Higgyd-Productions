import { useId } from "react";

// The FirstReply emblem (speech bubble + lightning bolt) on a black tile.
// Inline SVG so it needs no image file and stays sharp at any size.
// The matching favicon lives in src/app/icon.svg.
export function LogoMark({ size = 32 }: { size?: number }) {
  // Each instance needs its own gradient id, or two logos on one page clash.
  const gradientId = useId();
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      width={size}
      height={size}
      aria-hidden="true"
      className="shrink-0"
    >
      <defs>
        <linearGradient id={gradientId} gradientUnits="userSpaceOnUse" x1="260" y1="110" x2="780" y2="560">
          <stop offset="0" stopColor="#F7E08A" />
          <stop offset="0.5" stopColor="#D4AF37" />
          <stop offset="1" stopColor="#A67C00" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="14" fill="#0A0A0A" />
      <g transform="translate(32,32) scale(0.0955) translate(-512,-330)">
        <rect x="292" y="120" width="440" height="310" rx="96" fill={`url(#${gradientId})`} />
        <path d="M372 410 L322 540 L470 428 Z" fill={`url(#${gradientId})`} />
        <path d="M528 163 L432 288 L490 288 L470 387 L592 243 L531 243 Z" fill="#0A0A0A" />
      </g>
    </svg>
  );
}

// Emblem plus the "FirstReply" name, for headers and page tops.
export function Logo({ size = 32, className = "" }: { size?: number; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 font-bold ${className}`}>
      <LogoMark size={size} />
      <span>FirstReply</span>
    </span>
  );
}
