"use client";

import { useState, useEffect } from "react";
import { useGoogleLogin } from "@react-oauth/google";
import { motion, AnimatePresence, Variants } from "framer-motion";
import Navbar from "@/components/navbar";
import api from "@/lib/api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell
} from "recharts";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card-static px-4 py-3 text-sm border-emerald-500/20 shadow-md shadow-emerald-500/10">
        <p className="font-semibold text-white/80 mb-1">{label}</p>
        <p className="text-emerald-400 font-bold">₹{payload[0].value.toFixed(2)}</p>
      </div>
    );
  }
  return null;
}

// ==============================
// VARIANTS
// ==============================
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 100, damping: 15 },
  },
};

const listVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 120 } },
};

export default function Dashboard() {
  const [events, setEvents] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [synced, setSynced] = useState(false);
  const [chartReady, setChartReady] = useState(false);

  useEffect(() => {
    const t = localStorage.getItem("access");
    setToken(t);
    if (!t) window.location.href = "/login";
  }, []);

  // Delay chart render slightly for animation effect
  useEffect(() => {
    if (events.length > 0) {
      setTimeout(() => setChartReady(true), 300);
    }
  }, [events]);

  const login = useGoogleLogin({
    scope: "https://www.googleapis.com/auth/calendar.readonly",
    onSuccess: async (tokenResponse) => {
      if (!token) {
        window.location.href = "/login";
        return;
      }
      setLoading(true);
      try {
        const res = await api.post("/google-calendar", {
          access_token: tokenResponse.access_token,
        });
        const data = res.data;
        setEvents(data);
        setTotal(data.reduce((sum: number, e: any) => sum + e.cost, 0));
        setSynced(true);
      } catch {
        localStorage.removeItem("access");
        window.location.href = "/login";
      }
      setLoading(false);
    },
    onError: () => {},
  });

  const avgCost = events.length > 0 ? total / events.length : 0;

  const stats = [
    {
      label: "Total Cost",
      value: `₹${total.toFixed(2)}`,
      icon: "💰",
      color: "emerald",
    },
    {
      label: "Meetings",
      value: events.length.toString(),
      icon: "📅",
      color: "blue",
    },
    {
      label: "Avg. Cost",
      value: `₹${avgCost.toFixed(2)}`,
      icon: "📊",
      color: "purple",
    },
    {
      label: "Total Hours",
      value: events.reduce((s: number, e: any) => s + e.duration, 0).toFixed(1),
      icon: "⏱",
      color: "amber",
    },
  ];

  const colorMap: Record<string, string> = {
    emerald: "from-emerald-500/20 to-emerald-500/5 border-emerald-500/20 shadow-emerald-500/5 hover:border-emerald-500/40",
    blue: "from-blue-500/20 to-blue-500/5 border-blue-500/20 shadow-blue-500/5 hover:border-blue-500/40",
    purple: "from-purple-500/20 to-purple-500/5 border-purple-500/20 shadow-purple-500/5 hover:border-purple-500/40",
    amber: "from-amber-500/20 to-amber-500/5 border-amber-500/20 shadow-amber-500/5 hover:border-amber-500/40",
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] relative overflow-hidden">
      {/* Background Orbs */}
      <div className="orb orb-emerald w-[500px] h-[500px] -top-[100px] -right-[100px] fixed opacity-50" />
      <div className="bg-grid fixed inset-0 pointer-events-none opacity-20" />

      <Navbar />

      <div className="max-w-7xl mx-auto px-6 py-10 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10"
        >
          <div>
            <h1 className="text-3xl font-bold mb-1 tracking-tight">Dashboard</h1>
            <p className="text-white/40 text-sm">
              {synced
                ? `Showing ${events.length} calendar events`
                : "Connect your Google Calendar to get started"}
            </p>
          </div>
          <motion.button
            whileHover={!loading ? { scale: 1.05 } : {}}
            whileTap={!loading ? { scale: 0.95 } : {}}
            onClick={() => login()}
            disabled={loading}
            className="btn-primary px-6 py-3 rounded-xl text-sm font-semibold inline-flex items-center gap-2 disabled:opacity-50 relative overflow-hidden"
          >
            {/* Button Sheen Effect */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: "200%" }}
              transition={{ repeat: Infinity, duration: 2, ease: "linear", repeatDelay: 1 }}
              className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[30deg]"
            />
            {loading ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Syncing...
              </>
            ) : (
              <>
                <svg className="w-4 h-4 relative z-10" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.372 0 0 5.372 0 12s5.372 12 12 12 12-5.372 12-12S18.628 0 12 0zm5.82 14.547c0 .347-.282.628-.628.628h-3.563v3.563c0 .347-.282.628-.629.628h-2c-.347 0-.628-.282-.628-.628v-3.563H6.808c-.347 0-.628-.282-.628-.628v-2c0-.347.282-.628.628-.628h3.564V8.355c0-.347.282-.628.628-.628h2c.347 0 .629.282.629.628v3.564h3.563c.346 0 .628.282.628.628v2z" />
                </svg>
                <span className="relative z-10">{synced ? "Refresh Calendar" : "Connect Google Calendar"}</span>
              </>
            )}
          </motion.button>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10"
        >
          {stats.map((s, i) => (
            <motion.div
              key={i}
              variants={cardVariants}
              whileHover={{ scale: 1.03, y: -5 }}
              className={`rounded-2xl p-6 border bg-gradient-to-br transition-shadow cursor-default shadow-md ${colorMap[s.color]}`}
            >
              <div className="text-3xl mb-3">{s.icon}</div>
              <p className="text-sm text-white/40 mb-1 font-medium">{s.label}</p>
              <p className="text-2xl font-bold tracking-tight">{s.value}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Chart Section */}
        <AnimatePresence mode="wait">
          {events.length > 0 ? (
            <motion.div
              key="chart"
              initial={{ opacity: 0, height: 0, overflow: 'hidden' }}
              animate={{ opacity: 1, height: 'auto', overflow: 'visible' }}
              transition={{ duration: 0.6, type: "spring", bounce: 0.3 }}
              className="glass-card-static p-6 md:p-8 mb-10 border-t-emerald-500/20"
            >
              <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
                Meeting Cost Breakdown
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-2" />
              </h2>
              <div style={{ width: "100%", height: 350 }}>
                {chartReady && (
                  <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    transition={{ duration: 0.5 }}
                    style={{ width: '100%', height: '100%' }}
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={events} barSize={40}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                        <XAxis
                          dataKey="title"
                          tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 12 }}
                          axisLine={{ stroke: "rgba(255,255,255,0.06)" }}
                          tickLine={false}
                          dy={10}
                        />
                        <YAxis
                          tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 12 }}
                          axisLine={{ stroke: "rgba(255,255,255,0.06)" }}
                          tickLine={false}
                          dx={-10}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.02)" }} />
                        <defs>
                          <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#34d399" stopOpacity={0.9} />
                            <stop offset="100%" stopColor="#059669" stopOpacity={0.3} />
                          </linearGradient>
                        </defs>
                        <Bar 
                          dataKey="cost" 
                          fill="url(#barGrad)" 
                          radius={[8, 8, 0, 0]}
                          animationDuration={1500}
                          animationEasing="ease-out"
                        >
                          {events.map((entry, index) => (
                            <Cell key={`cell-${index}`} className="hover:opacity-80 transition-opacity cursor-pointer" />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </motion.div>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, position: 'absolute' }}
              transition={{ duration: 0.4 }}
              className="glass-card-static p-16 text-center mb-10 border-dashed border-white/10"
            >
              <motion.div 
                initial={{ rotate: -10, scale: 0.8 }}
                animate={{ rotate: 10, scale: 1 }}
                transition={{ repeat: Infinity, repeatType: "reverse", duration: 2 }}
                className="text-6xl mb-4 inline-block drop-shadow-lg"
              >
                📊
              </motion.div>
              <h3 className="text-xl font-semibold mb-2 text-white/70">No data yet</h3>
              <p className="text-white/30 text-sm max-w-sm mx-auto">
                Connect your Google Calendar above to see your meeting cost breakdown
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Events List */}
        <AnimatePresence>
          {events.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <h2 className="text-lg font-semibold mb-4 tracking-tight">Recent Calendar Events</h2>
              <motion.div 
                variants={listVariants}
                initial="hidden"
                animate="visible"
                className="grid gap-3"
              >
                {events.map((e: any, i: number) => (
                  <motion.div
                    key={i}
                    variants={itemVariants}
                    whileHover={{ scale: 1.01, x: 5 }}
                    className="glass-card p-5 flex items-center justify-between border-transparent hover:border-emerald-500/30 transition-all shadow-sm hover:shadow-emerald-500/10"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 flex items-center justify-center text-emerald-400 font-bold text-sm border border-emerald-500/20 shadow-inner">
                        {e.title?.[0] || "M"}
                      </div>
                      <div>
                        <p className="font-medium text-white/90">{e.title}</p>
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="badge-blue text-[10px] px-2 py-0.5">⏱ {e.duration} hrs</span>
                          <span className="badge-purple text-[10px] px-2 py-0.5">📅 Calendar</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-extrabold text-emerald-400 tracking-tight">₹{e.cost.toFixed(2)}</p>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}