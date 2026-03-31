"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useGoogleLogin } from "@react-oauth/google";
import Navbar from "@/components/navbar";
import api from "@/lib/api";

export default function CalendarPage() {
  const [token, setToken] = useState<string | null>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [synced, setSynced] = useState(false);

  useEffect(() => {
    const t = localStorage.getItem("access");
    setToken(t);
    if (!t) window.location.href = "/login";
  }, []);

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
        setEvents(res.data);
        setSynced(true);
      } catch {
        alert("Failed to sync calendar. Please try again.");
      }
      setLoading(false);
    },
    onError: () => {},
  });

  const totalCost = events.reduce((sum, e) => sum + e.cost, 0);
  const totalDuration = events.reduce((sum, e) => sum + e.duration, 0);

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <Navbar />

      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10"
        >
          <div>
            <h1 className="text-3xl font-bold mb-1">Calendar Sync</h1>
            <p className="text-white/40 text-sm">
              Import meetings from Google Calendar and calculate costs
            </p>
          </div>
          <button
            onClick={() => login()}
            disabled={loading}
            className="btn-primary px-6 py-3 rounded-xl text-sm font-semibold inline-flex items-center gap-2 disabled:opacity-50"
          >
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
                <svg className="w-5 h-5" viewBox="0 0 488 512" fill="currentColor">
                  <path d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"/>
                </svg>
                {synced ? "Refresh Calendar" : "Connect Google Calendar"}
              </>
            )}
          </button>
        </motion.div>

        {/* Summary */}
        {synced && events.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mb-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card-static p-5 text-center"
            >
              <p className="text-sm text-white/40 mb-1">Events</p>
              <p className="text-2xl font-bold text-blue-400">{events.length}</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass-card-static p-5 text-center"
            >
              <p className="text-sm text-white/40 mb-1">Total Cost</p>
              <p className="text-2xl font-bold text-emerald-400">₹{totalCost.toFixed(2)}</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-card-static p-5 text-center"
            >
              <p className="text-sm text-white/40 mb-1">Total Hours</p>
              <p className="text-2xl font-bold text-purple-400">{totalDuration.toFixed(1)}</p>
            </motion.div>
          </div>
        )}

        {/* Empty State */}
        {!synced && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass-card-static p-16 text-center"
          >
            <div className="text-6xl mb-4">📅</div>
            <h3 className="text-xl font-semibold mb-2 text-white/70">
              Connect your calendar
            </h3>
            <p className="text-white/30 text-sm max-w-sm mx-auto mb-6">
              Click the button above to sync your Google Calendar and see the cost of your meetings
            </p>
            <div className="flex items-center justify-center gap-6 text-white/20 text-sm">
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Read-only access
              </span>
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Data stays private
              </span>
            </div>
          </motion.div>
        )}

        {/* Event Cards */}
        {events.length > 0 && (
          <div className="space-y-3">
            {events.map((e: any, i: number) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass-card p-5 flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-500/5 flex items-center justify-center border border-purple-500/20 text-purple-400 font-bold text-sm">
                    {e.title?.[0] || "E"}
                  </div>
                  <div>
                    <p className="font-medium text-white/80">{e.title}</p>
                    <span className="badge-blue text-[10px] mt-1 inline-block">
                      ⏱ {e.duration} hrs
                    </span>
                  </div>
                </div>
                <p className="text-lg font-bold text-emerald-400">
                  ₹{e.cost.toFixed(2)}
                </p>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}