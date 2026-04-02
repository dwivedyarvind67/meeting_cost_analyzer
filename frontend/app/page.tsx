"use client";

import { useState, useEffect } from "react";
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
  Variants,
} from "framer-motion";
import Navbar from "@/components/navbar";
import CursorGlow from "@/components/CursorGlow";
import FloatingCards from "@/components/FloatingCards";
import HorizontalScroll from "@/components/HorizontalScroll";
import AnimatedCounter from "@/components/AnimatedCounter";
import Link from "next/link";
import api from "@/lib/api";

// ==============================
// VARIANTS
// ==============================
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.1 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 100, damping: 20 },
  },
};

// ==============================
// MAIN PAGE
// ==============================
export default function Home() {
  const [token, setToken] = useState<string | null>(null);
  const [duration, setDuration] = useState(1);
  const [participants, setParticipants] = useState(5);
  const [rate, setRate] = useState(500);
  const [cost, setCost] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  // Extra tracking states
  const [meetingId, setMeetingId] = useState<number | null>(null);
  const [secondsElapsed, setSecondsElapsed] = useState(0);

  const { scrollYProgress } = useScroll();
  const yOrb1 = useTransform(scrollYProgress, [0, 1], [0, 400]);
  const yOrb2 = useTransform(scrollYProgress, [0, 1], [0, -350]);
  const yOrb3 = useTransform(scrollYProgress, [0, 1], [0, 250]);

  // Real-time estimated cost — updates instantly as user types
  const estimatedCost = participants * rate * duration;

  useEffect(() => {
    const t = localStorage.getItem("access");
    setToken(t);
  }, []);

  // Helper: parse numeric input, fallback to 0 for empty strings
  const parseNum = (val: string, fallback: number = 0) => {
    const n = parseFloat(val);
    return isNaN(n) ? fallback : n;
  };

  // Select all text on focus so user can type a clean value
  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select();
  };

  const startMeeting = async () => {
    if (participants <= 0 || rate <= 0 || duration < 0) {
      setError("Please enter valid values for all fields.");
      return;
    }
    // Always show the cost immediately — no login required to see result
    const localCost = participants * rate * duration;
    setCost(localCost);
    setIsRunning(true);
    setError("");
    setSuccess("Meeting started — tracking savings potential live!");

    // If logged in, also save to backend
    if (token) {
      setLoading(true);
      try {
        if (token) {
          const res = await api.post("/calculate", {
            duration,
            participants,
            avg_rate: rate,
          });
          setMeetingId(res.data.meeting_id);
        }

        setIsRunning(true);
        setSuccess("");
        setSecondsElapsed(0);
        setCost(participants * rate * duration);
      } catch {
        // API failed, but local calculation continues — no redirect
        console.warn("Backend save failed, using local calculation.");
      }
      setLoading(false);
    }
  };

  const stopMeeting = async () => {
    setIsRunning(false);
    
    if (token && meetingId) {
      try {
        await api.put(`/meetings/${meetingId}`, {
           duration: duration + (secondsElapsed / 3600),
           total_cost: cost
        });
      } catch (err) {
        console.error("Failed to update exact meeting costs", err);
      }
    }
    
    setSuccess("Meeting stopped. Savings recorded.");
  };

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isRunning) {
      interval = setInterval(() => {
        setCost((prev) => prev + (participants * rate) / 3600);
        setSecondsElapsed((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, participants, rate]);

  const features = [
    {
      icon: "⚡",
      title: "Real-Time Tracking",
      desc: "Monitor savings opportunities live as your meeting progresses",
    },
    {
      icon: "📅",
      title: "Calendar Sync",
      desc: "Auto-import meetings from Google Calendar",
    },
    {
      icon: "📊",
      title: "Analytics Dashboard",
      desc: "Visualize spending patterns with interactive charts",
    },
    {
      icon: "💳",
      title: "Flexible Plans",
      desc: "Free tier included, upgrade anytime",
    },
    {
      icon: "🔒",
      title: "Enterprise Security",
      desc: "JWT authentication, encrypted data, and CORS protection",
    },
    {
      icon: "👥",
      title: "Team Collaboration",
      desc: "Share insights and optimize budgets across your organization",
    },
  ];

  return (
    <div className="min-h-screen bg-[#050507] relative overflow-hidden">
      {/* Cursor Glow */}
      <CursorGlow />

      {/* Background decorative orbs */}
      <motion.div
        style={{ y: yOrb1 }}
        className="orb orb-orange w-[700px] h-[700px] -top-[250px] -right-[200px] fixed"
      />
      <motion.div
        style={{ y: yOrb2 }}
        className="orb orb-red w-[600px] h-[600px] top-[60%] -left-[250px] fixed"
      />
      <motion.div
        style={{ y: yOrb3 }}
        className="orb orb-amber w-[500px] h-[500px] top-[30%] right-[10%] fixed opacity-40"
      />
      <div className="bg-grid fixed inset-0 pointer-events-none opacity-20" />

      <Navbar />

      {/* ==============================
          HERO SECTION
          ============================== */}
      <section className="relative pt-24 pb-16 md:pt-32 md:pb-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Text */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <motion.div
                variants={itemVariants}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/8 border border-orange-500/15 text-orange-400 text-sm font-medium mb-8"
              >
                <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
                Now tracking 10,000+ meetings
              </motion.div>

              <motion.h1
                variants={itemVariants}
                className="text-5xl md:text-6xl lg:text-7xl font-extrabold font-display tracking-tight mb-6 leading-[1.05]"
              >
                Maximize Your
                <br />
                Meeting{" "}
                <span className="gradient-text-warm">Savings</span>
              </motion.h1>

              <motion.p
                variants={itemVariants}
                className="text-lg md:text-xl text-white/40 max-w-xl mb-10 leading-relaxed"
              >
                Start saving smarter. Track meeting investments in real-time, sync your
                calendar, and make data-driven decisions to optimize how your team
                invests time.
              </motion.p>

              <motion.div
                variants={itemVariants}
                className="flex flex-col sm:flex-row gap-4"
              >
                {!token ? (
                  <>
                    <Link
                      href="/signup"
                      className="btn-primary-animated text-base px-8 py-4 rounded-xl inline-flex items-center justify-center gap-2 group"
                    >
                      Start Calculating
                      <svg
                        className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2.5}
                          d="M13 7l5 5m0 0l-5 5m5-5H6"
                        />
                      </svg>
                    </Link>
                    <Link
                      href="/login"
                      className="btn-secondary-animated text-base px-8 py-4 rounded-xl inline-flex items-center justify-center"
                    >
                      Sign In
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      href="/dashboard"
                      className="btn-primary-animated text-base px-8 py-4 rounded-xl inline-flex items-center justify-center gap-2 group"
                    >
                      Go to Dashboard
                      <svg
                        className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2.5}
                          d="M13 7l5 5m0 0l-5 5m5-5H6"
                        />
                      </svg>
                    </Link>
                    <Link
                      href="/calendar"
                      className="btn-secondary-animated text-base px-8 py-4 rounded-xl inline-flex items-center justify-center"
                    >
                      Sync Calendar
                    </Link>
                  </>
                )}
              </motion.div>
            </motion.div>

            {/* Right: 3D Floating Cards */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.8, type: "spring" }}
            >
              <FloatingCards />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ==============================
          LIVE CALCULATOR
          ============================== */}
      <section className="relative pb-32 px-6" id="calculator">
        <div className="max-w-xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold font-display mb-4">
              Try It{" "}
              <span className="gradient-text">Live</span>
            </h2>
            <p className="text-white/40 max-w-md mx-auto">
              Enter your meeting details and discover your savings potential in real-time
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 40 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, type: "spring" }}
            className="relative"
          >
            <motion.div
              animate={{
                boxShadow: isRunning
                  ? "0px 0px 50px rgba(255, 107, 53, 0.3)"
                  : "0px 4px 20px rgba(0, 0, 0, 0.5)",
                borderColor: isRunning
                  ? "rgba(255, 107, 53, 0.4)"
                  : "rgba(255, 255, 255, 0.06)",
              }}
              transition={{ duration: 0.5 }}
              className="glass-card p-8 md:p-10 relative overflow-hidden z-10"
            >
              {isRunning && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.12 }}
                  transition={{ duration: 1 }}
                  className="absolute inset-0 bg-gradient-to-b from-orange-500/20 to-transparent pointer-events-none"
                />
              )}
              <div className="glow-line-top" />

              <h2 className="text-2xl font-bold font-display text-center mb-2">
                Live Meeting Calculator
              </h2>
              <p className="text-white/35 text-center text-sm mb-8">
                Enter details and see your potential savings in real-time
              </p>

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 mb-4 rounded-xl text-sm text-center"
                  >
                    {error}
                  </motion.div>
                )}
                {success && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-orange-500/10 border border-orange-500/20 text-orange-400 p-3 mb-4 rounded-xl text-sm text-center"
                  >
                    {success}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-4 mb-6 relative z-10" role="form" aria-label="Meeting savings calculator">
                <div>
                  <label htmlFor="calc-people" className="block text-sm font-medium text-white/45 mb-2">
                    Number of People
                  </label>
                  <input
                    id="calc-people"
                    type="number"
                    value={participants}
                    className="input-field"
                    onChange={(e) => setParticipants(parseNum(e.target.value, 1))}
                    onFocus={handleFocus}
                    min={1}
                    placeholder="5"
                    aria-label="Number of people in the meeting"
                  />
                </div>
                <div>
                  <label htmlFor="calc-rate" className="block text-sm font-medium text-white/45 mb-2">
                    Avg. Hourly Rate (₹)
                  </label>
                  <input
                    id="calc-rate"
                    type="number"
                    value={rate}
                    className="input-field"
                    onChange={(e) => setRate(parseNum(e.target.value, 0))}
                    onFocus={handleFocus}
                    min={0}
                    placeholder="500"
                    aria-label="Average hourly rate in rupees"
                  />
                </div>
                <div>
                  <label htmlFor="calc-duration" className="block text-sm font-medium text-white/45 mb-2">
                    Meeting Duration (hours)
                  </label>
                  <input
                    id="calc-duration"
                    type="number"
                    value={duration}
                    className="input-field"
                    onChange={(e) => setDuration(parseNum(e.target.value, 0))}
                    onFocus={handleFocus}
                    min={0}
                    step={0.5}
                    placeholder="1"
                    aria-label="Meeting duration in hours"
                  />
                </div>
              </div>

              {/* Real-time Estimated Cost — updates as user types */}
              {!isRunning && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center mb-6 p-4 rounded-xl relative z-10"
                  style={{ background: "rgba(255, 107, 53, 0.06)", border: "1px solid rgba(255, 107, 53, 0.12)" }}
                  aria-live="polite"
                >
                  <p className="text-xs text-white/40 mb-1 uppercase tracking-wide">Savings You Could Unlock</p>
                  <p className="text-3xl font-extrabold font-display gradient-text-primary tabular-nums">
                    ₹{estimatedCost.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-white/25 mt-1">
                    {participants} people × ₹{rate}/hr × {duration}h
                  </p>
                </motion.div>
              )}

              <div className="flex gap-3 mb-8 relative z-10">
                <motion.button
                  whileHover={
                    !loading && !isRunning ? { scale: 1.02, y: -2 } : {}
                  }
                  whileTap={!loading && !isRunning ? { scale: 0.98 } : {}}
                  onClick={startMeeting}
                  disabled={loading || isRunning}
                  className="flex-1 btn-primary py-3.5 rounded-xl text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg
                        className="w-4 h-4 animate-spin"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                      Starting...
                    </span>
                  ) : (
                    "▶ Start Meeting"
                  )}
                </motion.button>

                <motion.button
                  whileHover={isRunning ? { scale: 1.02, y: -2 } : {}}
                  whileTap={isRunning ? { scale: 0.98 } : {}}
                  onClick={stopMeeting}
                  disabled={!isRunning}
                  className="flex-1 btn-danger py-3.5 rounded-xl text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  ■ Stop
                </motion.button>
              </div>

              {/* Cost Display — only shown when meeting is running */}
              {isRunning && (
                <div className="text-center relative z-10" aria-live="polite">
                  <p className="text-sm text-white/35 mb-2">Potential savings growing...</p>
                  <div className="flex items-center justify-center">
                    <motion.div
                      key={Math.floor(cost)}
                      initial={{ y: -5, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      className="text-5xl font-extrabold font-display gradient-text-primary tabular-nums inline-block"
                    >
                      ₹{cost.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </motion.div>
                  </div>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center justify-center gap-2 mt-3"
                  >
                    <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
                    <span className="text-xs text-orange-400 font-medium tracking-wide">
                      LIVE SESSION RECORDING
                    </span>
                  </motion.div>
                  {!token && (
                    <p className="text-xs text-white/30 mt-4">
                      <Link href="/signup" className="text-orange-400 hover:text-orange-300 font-semibold transition-colors underline underline-offset-2">
                        Sign up free
                      </Link>{" "}
                      to save history & unlock advanced analytics
                    </p>
                  )}
                </div>
              )}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Section divider */}
      <div className="section-divider mx-6" />

      {/* ==============================
          HORIZONTAL SCROLL FEATURES
          ============================== */}
      <section className="relative py-32 overflow-hidden" id="features">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            className="text-center mb-12 px-6"
          >
            <h2 className="text-3xl md:text-4xl font-bold font-display mb-4">
              Built for{" "}
              <span className="gradient-text">Modern Teams</span>
            </h2>
            <p className="text-white/40 max-w-xl mx-auto">
              Swipe through our powerful features designed to transform how you
              think about meetings
            </p>
          </motion.div>

          <HorizontalScroll />
        </div>
      </section>

      {/* Section divider */}
      <div className="section-divider mx-6" />

      {/* ==============================
          FEATURES GRID
          ============================== */}
      <section className="relative py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold font-display mb-4">
              Everything You Need to{" "}
              <span className="gradient-text">Maximize Savings</span>
            </h2>
            <p className="text-white/40 max-w-xl mx-auto">
              Powerful tools for individuals and teams to optimize meeting investments
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {features.map((f, i) => (
              <motion.div
                key={i}
                variants={itemVariants}
                whileHover={{ y: -6, scale: 1.02 }}
                className="glass-card-glow p-7 group cursor-default"
              >
                <div className="text-3xl mb-4 group-hover:scale-110 transition-transform origin-bottom-left">
                  {f.icon}
                </div>
                <h3 className="text-lg font-semibold font-display mb-2 text-white/90 group-hover:text-orange-400 transition-colors">
                  {f.title}
                </h3>
                <p className="text-white/40 text-sm leading-relaxed group-hover:text-white/60 transition-colors">
                  {f.desc}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ==============================
          STATS SECTION
          ============================== */}
      <section className="relative pb-32 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5 }}
            className="glass-card-static p-10 md:p-14 overflow-hidden relative"
            style={{
              borderTop: "1px solid rgba(255, 107, 53, 0.2)",
            }}
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-56 h-56 bg-orange-500/8 blur-[100px] pointer-events-none rounded-full" />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 relative z-10">
              {[
                { value: 10000, suffix: "+", label: "Meetings Tracked" },
                { value: 500, prefix: "₹", suffix: "K+", label: "Money Saved" },
                { value: 2500, suffix: "+", label: "Active Users" },
                { value: 99, suffix: "%", label: "Uptime" },
              ].map((s, i) => (
                <div key={i} className="text-center">
                  <div className="text-3xl md:text-4xl font-extrabold font-display gradient-text-primary mb-2">
                    <AnimatedCounter
                      end={s.value}
                      prefix={s.prefix}
                      suffix={s.suffix}
                    />
                  </div>
                  <p className="text-white/40 text-sm font-medium">{s.label}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ==============================
          PRICING PREVIEW
          ============================== */}
      <section className="relative pb-32 px-6" id="pricing">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold font-display mb-4">
              Simple, Transparent{" "}
              <span className="gradient-text">Pricing</span>
            </h2>
            <p className="text-white/40 max-w-xl mx-auto">
              Start free. Upgrade when you need more.
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="grid md:grid-cols-3 gap-6"
          >
            {[
              {
                name: "Free",
                price: "₹0",
                period: "forever",
                features: [
                  "50 meetings/month",
                  "Google Calendar sync",
                  "Basic analytics",
                ],
                cta: "Get Started",
                popular: false,
              },
              {
                name: "Pro",
                price: "₹499",
                period: "/month",
                features: [
                  "Unlimited meetings",
                  "PDF export",
                  "Advanced analytics",
                  "Priority support",
                ],
                cta: "Upgrade to Pro",
                popular: true,
              },
              {
                name: "Team",
                price: "₹1,999",
                period: "/month",
                features: [
                  "Everything in Pro",
                  "Team collaboration",
                  "Admin dashboard",
                  "Custom integrations",
                ],
                cta: "Contact Sales",
                popular: false,
              },
            ].map((plan, i) => (
              <motion.div
                key={i}
                variants={itemVariants}
                whileHover={{ y: -8 }}
                className={`relative p-8 rounded-2xl border transition-all duration-300 ${
                  plan.popular
                    ? "bg-gradient-to-b from-orange-500/10 to-red-900/10 border-orange-500/30 shadow-lg shadow-orange-500/10"
                    : "glass-card border-white/[0.06]"
                } flex flex-col`}
              >
                {plan.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="badge-primary text-xs px-4 py-1.5 shadow-sm shadow-orange-500/20">
                      Most Popular
                    </span>
                  </div>
                )}

                <h3 className="text-xl font-bold font-display mb-1">
                  {plan.name}
                </h3>
                <div className="mb-6">
                  <span className="text-4xl font-extrabold font-display">
                    {plan.price}
                  </span>
                  <span className="text-white/40 ml-1">{plan.period}</span>
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((f, j) => (
                    <li
                      key={j}
                      className="flex items-center gap-3 text-sm text-white/60"
                    >
                      <svg
                        className="w-4 h-4 text-orange-400 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2.5}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>

                <Link
                  href={token ? "/billing" : "/signup"}
                  className={`block text-center py-3.5 rounded-xl font-semibold text-sm transition-all duration-300 ${
                    plan.popular
                      ? "btn-primary w-full shadow-orange-500/20"
                      : "btn-secondary w-full hover:bg-white/10"
                  }`}
                >
                  {plan.cta}
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ==============================
          CONTACT / CTA SECTION
          ============================== */}
      <section className="relative pb-32 px-6" id="contact">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="glass-card-static p-12 md:p-16 text-center relative overflow-hidden"
          >
            {/* Background glow */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div
                className="w-[500px] h-[300px] rounded-full opacity-30"
                style={{
                  background:
                    "radial-gradient(circle, rgba(255, 107, 53, 0.12) 0%, transparent 70%)",
                  filter: "blur(60px)",
                }}
              />
            </div>

            <div className="glow-line-top" />

            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-bold font-display mb-4">
                Start Maximizing Your{" "}
                <span className="gradient-text">Meeting Savings</span>
                <br />
                Today
              </h2>
              <p className="text-white/40 max-w-lg mx-auto mb-8">
                Join thousands of teams who&apos;ve already saved time and money
                with Meeting Savings Analyzer. Get started in seconds.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Link
                  href={token ? "/dashboard" : "/signup"}
                  className="btn-primary-animated text-base px-10 py-4 rounded-xl inline-flex items-center justify-center gap-2 group"
                >
                  Get Started Free
                  <svg
                    className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                </Link>
                <a
                  href="mailto:hello@meetingcost.app"
                  className="btn-secondary-animated text-base px-8 py-4 rounded-xl inline-flex items-center justify-center"
                >
                  Contact Us
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ==============================
          FOOTER
          ============================== */}
      <footer className="border-t border-white/[0.06] py-12 px-6 relative z-10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs shadow-md"
              style={{
                background: "linear-gradient(135deg, #ff6b35, #e63946)",
                boxShadow: "0 4px 16px rgba(255, 107, 53, 0.2)",
              }}
            >
              M
            </div>
            <span className="font-bold text-lg font-display gradient-text">MCA</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-white/30">
            <Link href="/billing" className="hover:text-emerald-400 transition-colors">Pricing</Link>
            <span>•</span>
            <span>© {new Date().getFullYear()} All rights reserved</span>
          </div>
        </div>
      </footer>
    </div>
  );
}