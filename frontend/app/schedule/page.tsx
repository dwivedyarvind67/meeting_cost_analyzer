"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/navbar";
import api from "@/lib/api";

export default function SchedulePage() {
  const [token, setToken] = useState<string | null>(null);
  const [meetings, setMeetings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  // Form state
  const [title, setTitle] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [duration, setDuration] = useState(1);
  const [participants, setParticipants] = useState(5);
  const [rate, setRate] = useState(500);

  const projectedCost = participants * rate * duration;

  const fetchMeetings = async () => {
    setFetching(true);
    try {
      const res = await api.get("/scheduled-meetings");
      setMeetings(res.data);
    } catch (err) {
      console.error("Failed to fetch scheduled meetings", err);
    }
    setFetching(false);
  };

  useEffect(() => {
    const t = localStorage.getItem("access");
    setToken(t);
    if (!t) {
      window.location.href = "/login";
    } else {
      fetchMeetings();
    }
  }, []);

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !scheduledDate || !scheduledTime) return;

    setLoading(true);
    try {
      const scheduled_datetime = new Date(`${scheduledDate}T${scheduledTime}`).toISOString();
      await api.post("/scheduled-meetings", {
        title,
        scheduled_time: scheduled_datetime,
        duration,
        participants,
        avg_rate: rate,
      });
      
      // Reset form
      setTitle("");
      setScheduledDate("");
      setScheduledTime("");
      setDuration(1);
      
      // Refresh list
      fetchMeetings();
    } catch (err) {
      console.error(err);
      alert("Failed to schedule meeting.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] relative overflow-hidden">
      {/* Background Orbs */}
      <div className="orb orb-orange w-[500px] h-[500px] top-[10%] -left-[100px] fixed opacity-30" />
      <div className="bg-grid fixed inset-0 pointer-events-none opacity-20" />

      <Navbar />

      <div className="max-w-6xl mx-auto px-6 py-10 relative z-10 grid md:grid-cols-12 gap-10">
        
        {/* Left Col: Scheduling Form */}
        <div className="md:col-span-5">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6 md:p-8"
          >
            <div className="glow-line-top" />
            <h1 className="text-2xl font-bold mb-2">Plan a Meeting</h1>
            <p className="text-white/40 text-sm mb-6">
              Schedule future meetings and forecast their budget impact.
            </p>

            <form onSubmit={handleSchedule} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/50 mb-1">
                  Meeting Title
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="input-field w-full"
                  placeholder="e.g. Q3 Roadmap Review"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/50 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    required
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="input-field w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/50 mb-1">
                    Time
                  </label>
                  <input
                    type="time"
                    required
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="input-field w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/50 mb-1">
                    Participants
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={participants}
                    onChange={(e) => setParticipants(parseFloat(e.target.value) || 1)}
                    className="input-field w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/50 mb-1">
                    Duration (hrs)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    required
                    value={duration}
                    onChange={(e) => setDuration(parseFloat(e.target.value) || 0)}
                    className="input-field w-full"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/50 mb-1">
                  Avg. Hourly Rate (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={rate}
                  onChange={(e) => setRate(parseFloat(e.target.value) || 0)}
                  className="input-field w-full"
                />
              </div>

              <div className="pt-4 mt-4 border-t border-white/10">
                <p className="text-xs text-white/40 mb-1">Projected Cost</p>
                <p className="text-2xl font-bold gradient-text-primary mb-4">
                  ₹{projectedCost.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-primary py-3 rounded-xl font-semibold disabled:opacity-50"
                >
                  {loading ? "Scheduling..." : "Schedule Meeting"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>

        {/* Right Col: Upcoming List */}
        <div className="md:col-span-7">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="h-full flex flex-col"
          >
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              Upcoming Schedule
              <span className="badge-primary px-2 py-0.5 text-xs block">{meetings.length}</span>
            </h2>

            {fetching ? (
              <div className="flex-1 flex items-center justify-center p-12 glass-card-static border-dashed border-white/10">
                <div className="text-white/40 flex flex-col items-center">
                  <svg className="w-8 h-8 animate-spin mb-3 text-orange-500" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Loading schedule...
                </div>
              </div>
            ) : meetings.length === 0 ? (
              <div className="flex-1 flex items-center justify-center p-12 glass-card-static border-dashed border-white/10">
                <div className="text-center">
                  <div className="text-4xl mb-3">📅</div>
                  <h3 className="text-lg font-medium text-white/70">No upcoming meetings</h3>
                  <p className="text-sm text-white/30">Use the form to plan your budget</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <AnimatePresence>
                  {meetings.map((m: any, i: number) => {
                    const dateObj = new Date(m.scheduled_time);
                    const formattedDate = dateObj.toLocaleDateString("en-IN", {
                      weekday: 'short', month: 'short', day: 'numeric'
                    });
                    const formattedTime = dateObj.toLocaleTimeString("en-IN", {
                      hour: '2-digit', minute:'2-digit'
                    });

                    return (
                      <motion.div
                        key={m.id || i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="glass-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 flex flex-col items-center justify-center text-orange-400">
                            <span className="text-[10px] font-bold uppercase leading-none">{dateObj.toLocaleDateString("en-US", { month: 'short' })}</span>
                            <span className="text-lg font-bold leading-none mt-1">{dateObj.getDate()}</span>
                          </div>
                          <div>
                            <h4 className="font-semibold text-white/90">{m.title}</h4>
                            <div className="flex items-center gap-2 mt-1 text-xs text-white/40">
                              <span>🕒 {formattedTime}</span>
                              <span>•</span>
                              <span>⏱ {m.duration} hrs</span>
                              <span>•</span>
                              <span>👥 {m.participants}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-[10px] text-white/40 uppercase mb-0.5">Projected</p>
                          <p className="text-lg font-bold gradient-text-primary">
                            ₹{m.total_projected_cost.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        </div>

      </div>
    </div>
  );
}
