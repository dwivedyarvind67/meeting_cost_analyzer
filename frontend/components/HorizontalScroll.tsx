"use client";

import { useRef, useState, useEffect } from "react";
import { motion, useInView } from "framer-motion";

const features = [
  {
    icon: "⚡",
    title: "Real-time Cost Tracking",
    desc: "Track meeting investments second by second as your team collaborates. See exactly how your budget is optimized.",
    gradient: "from-orange-500/20 to-red-500/10",
    accent: "#ff6b35",
  },
  {
    icon: "👥",
    title: "Team Insights",
    desc: "Understand who's spending the most time in meetings and identify optimization opportunities across your organization.",
    gradient: "from-red-500/20 to-amber-500/10",
    accent: "#e63946",
  },
  {
    icon: "📊",
    title: "Productivity Analytics",
    desc: "Beautiful charts and dashboards that reveal patterns in your meeting culture. Data-driven decisions, simplified.",
    gradient: "from-amber-500/20 to-orange-500/10",
    accent: "#ff9f1c",
  },
  {
    icon: "📅",
    title: "Calendar Integration",
    desc: "Auto-sync with Google Calendar to track every meeting automatically. Zero manual effort required.",
    gradient: "from-orange-500/20 to-amber-500/10",
    accent: "#ff6b35",
  },
  {
    icon: "📑",
    title: "Export Reports",
    desc: "Generate PDF and CSV reports for management reviews. Share insights with stakeholders effortlessly.",
    gradient: "from-red-500/20 to-orange-500/10",
    accent: "#e63946",
  },
];

export default function HorizontalScroll() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const handleScroll = () => {
      const scrollLeft = el.scrollLeft;
      const cardWidth = el.querySelector(".horizontal-scroll-card")?.clientWidth || 340;
      const gap = 24;
      const index = Math.round(scrollLeft / (cardWidth + gap));
      setActiveIndex(Math.min(index, features.length - 1));
    };

    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div ref={containerRef}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }}
      >
        {/* Scrollable container */}
        <div
          ref={scrollRef}
          className="horizontal-scroll-container px-6 md:px-[calc(50%-600px)]"
        >
          {features.map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.1 * i, duration: 0.5 }}
              className="horizontal-scroll-card"
            >
              <div
                className={`glass-card-glow h-full p-7 md:p-8 bg-gradient-to-br ${feature.gradient} group cursor-default relative overflow-hidden`}
              >
                {/* Top glow */}
                <div
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-[1px]"
                  style={{
                    background: `linear-gradient(90deg, transparent, ${feature.accent}50, transparent)`,
                  }}
                />

                <div className="text-4xl mb-5 group-hover:scale-110 transition-transform duration-300 origin-bottom-left">
                  {feature.icon}
                </div>
                <h3
                  className="text-xl font-bold font-display mb-3 transition-colors duration-300"
                  style={{ color: "rgba(255,255,255,0.9)" }}
                >
                  {feature.title}
                </h3>
                <p className="text-white/40 text-sm leading-relaxed group-hover:text-white/60 transition-colors duration-300">
                  {feature.desc}
                </p>

                {/* Decorative corner glow */}
                <div
                  className="absolute -bottom-8 -right-8 w-32 h-32 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{
                    background: `radial-gradient(circle, ${feature.accent}15, transparent 70%)`,
                  }}
                />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Scroll indicators */}
        <div className="flex justify-center gap-2 mt-6">
          {features.map((_, i) => (
            <button
              key={i}
              onClick={() => {
                const el = scrollRef.current;
                if (!el) return;
                const cardWidth =
                  el.querySelector(".horizontal-scroll-card")?.clientWidth || 340;
                el.scrollTo({
                  left: i * (cardWidth + 24),
                  behavior: "smooth",
                });
              }}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === activeIndex
                  ? "w-8 bg-gradient-to-r from-orange-500 to-red-500"
                  : "w-1.5 bg-white/15 hover:bg-white/25"
              }`}
              aria-label={`Scroll to feature ${i + 1}`}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}
