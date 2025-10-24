
"use client";

import { motion } from "framer-motion";

export function AnimatedLogo({ text = false }: { text?: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center text-primary">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 48 48"
        width="80"
        height="80"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Lingkaran luar (spinning) */}
        <motion.circle
          cx="24"
          cy="24"
          r="20"
          strokeDasharray="125"
          strokeDashoffset="80"
          animate={{ rotate: 360 }}
          transition={{
            repeat: Infinity,
            duration: 1.2,
            ease: "linear",
          }}
          style={{
            transformOrigin: "center",
          }}
        />

        {/* Simbol $ (diam di tengah) */}
        <g transform="translate(12,12) scale(1)">
          <line x1="12" x2="12" y1="2" y2="22" />
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </g>
      </svg>
      {text && <p className="text-muted-foreground mt-2">Loading CoinKeeper...</p>}
    </div>
  );
}
