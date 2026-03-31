"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Navbar from "@/components/navbar";
import api from "@/lib/api";

export default function HistoryPage() {
  const [token, setToken] = useState<string | null>(null);
  const [meetings, setMeetings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = localStorage.getItem("access");
    setToken(t);
    if (!t) window.location.href = "/login";
  }, []);

  useEffect(() => {
    if (!token) return;

    const fetchMeetings = async () => {
      try {
        const res = await api.get("/meetings");
        setMeetings(res.data);
      } catch {
        localStorage.removeItem("access");
        window.location.href = "/login";
      } finally {
        setLoading(false);
      }
    };

    fetchMeetings();
  }, [token]);

  const totalCost = meetings.reduce((sum, m) => sum + m.total_cost, 0);
  const totalHours = meetings.reduce((sum, m) => sum + m.duration, 0);

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <Navbar />

      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <h1 className="text-3xl font-bold mb-1">Meeting History</h1>
          <p className="text-white/40 text-sm">
            {meetings.length > 0
              ? `${meetings.length} meetings • ₹${totalCost.toFixed(2)} total • ${totalHours.toFixed(1)} hours`
              : "Your calculated meetings will appear here"}
          </p>
        </motion.div>

        {/* Summary Cards */}
        {meetings.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mb-10">
            <div className="glass-card-static p-5 text-center">
              <p className="text-sm text-white/40 mb-1">Total Meetings</p>
              <p className="text-2xl font-bold text-blue-400">{meetings.length}</p>
            </div>
            <div className="glass-card-static p-5 text-center">
              <p className="text-sm text-white/40 mb-1">Total Cost</p>
              <p className="text-2xl font-bold text-emerald-400">₹{totalCost.toFixed(2)}</p>
            </div>
            <div className="glass-card-static p-5 text-center">
              <p className="text-sm text-white/40 mb-1">Total Hours</p>
              <p className="text-2xl font-bold text-purple-400">{totalHours.toFixed(1)}</p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="glass-card-static p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="skeleton h-4 w-32" />
                    <div className="skeleton h-3 w-48" />
                  </div>
                  <div className="skeleton h-6 w-20" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && meetings.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass-card-static p-16 text-center"
          >
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-xl font-semibold mb-2 text-white/70">No meetings yet</h3>
            <p className="text-white/30 text-sm max-w-sm mx-auto mb-6">
              Use the calculator on the home page to track your first meeting cost
            </p>
            <a
              href="/"
              className="btn-primary inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm"
            >
              Go to Calculator
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </a>
          </motion.div>
        )}

        {/* Meetings List */}
        {!loading && meetings.length > 0 && (
          <div className="space-y-3">
            {meetings.map((m: any, i: number) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="glass-card p-5 flex items-center justify-between group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-500/5 flex items-center justify-center border border-blue-500/20">
                    <span className="text-lg">
                      {m.source === "calendar" ? "📅" : "⚡"}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-white/80">
                      {m.source === "calendar" ? "Calendar Meeting" : "Manual Calculation"}
                    </p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="badge-blue text-[10px]">⏱ {m.duration} hrs</span>
                      <span className="badge-purple text-[10px]">👥 {m.participants}</span>
                      <span className="badge-amber text-[10px]">₹{m.avg_rate}/hr</span>
                      {m.created_at && (
                        <span className="text-[10px] text-white/20">
                          {new Date(m.created_at).toLocaleDateString("en-IN", {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-emerald-400">
                    ₹{m.total_cost.toFixed(2)}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}