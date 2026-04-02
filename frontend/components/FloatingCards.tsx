"use client";

import { motion } from "framer-motion";

const cards = [
  {
    label: "Saved This Week",
    value: "₹12,000",
    icon: "💰",
    accent: "#ff6b35",
    delay: 0,
    className: "animate-float-card-1",
    position: "top-0 left-0 md:left-4 z-30",
  },
  {
    label: "Avg Meeting Time",
    value: "4.2 hrs/week",
    icon: "⏱️",
    accent: "#e63946",
    delay: 0.15,
    className: "animate-float-card-2",
    position: "top-12 right-0 md:right-4 z-20",
  },
  {
    label: "Productive",
    value: "68%",
    icon: "📈",
    accent: "#ff9f1c",
    delay: 0.3,
    className: "animate-float-card-3",
    position: "top-24 left-8 md:left-16 z-10",
  },
];

export default function FloatingCards() {
  return (
    <div className="perspective-container relative w-full max-w-lg mx-auto h-[280px] md:h-[320px]">
      {/* Background glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div
          className="w-[400px] h-[400px] rounded-full opacity-40"
          style={{
            background:
              "radial-gradient(circle, rgba(255, 107, 53, 0.15) 0%, rgba(230, 57, 70, 0.08) 40%, transparent 70%)",
            filter: "blur(40px)",
          }}
        />
      </div>

      {cards.map((card, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 40, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{
            delay: 0.6 + card.delay,
            duration: 0.7,
            type: "spring",
            stiffness: 80,
            damping: 18,
          }}
          className={`absolute ${card.position} ${card.className}`}
        >
          <div className="glass-card-float p-5 md:p-6 w-[200px] md:w-[240px] group cursor-default hover:scale-105 transition-transform duration-500">
            {/* Top glow line */}
            <div
              className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-[1px]"
              style={{
                background: `linear-gradient(90deg, transparent, ${card.accent}60, transparent)`,
              }}
            />

            <div className="flex items-center gap-3 mb-3">
              <span className="text-xl">{card.icon}</span>
              <span className="text-xs font-medium text-white/40 uppercase tracking-wider">
                {card.label}
              </span>
            </div>
            <div
              className="text-2xl md:text-3xl font-extrabold font-display"
              style={{
                background: `linear-gradient(135deg, ${card.accent}, ${card.accent}99)`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              {card.value}
            </div>

            {/* Subtle bottom stat bar */}
            <div className="mt-3 flex gap-1">
              {[...Array(5)].map((_, j) => (
                <div
                  key={j}
                  className="h-1 rounded-full flex-1"
                  style={{
                    background:
                      j < 3 + (i % 2)
                        ? `${card.accent}40`
                        : "rgba(255,255,255,0.05)",
                  }}
                />
              ))}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
