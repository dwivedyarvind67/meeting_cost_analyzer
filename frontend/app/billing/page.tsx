"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Navbar from "@/components/navbar";
import api from "@/lib/api";

interface Subscription {
  id: number;
  tier: string;
  status: string;
  start_date: string;
  end_date: string | null;
  auto_renew: boolean;
}

interface Stats {
  total_meetings: number;
  total_cost: number;
  meetings_this_month: number;
  current_plan: string;
  plan_limit: number;
  usage_percentage: number;
}

interface PlanInfo {
  name: string;
  price: number;
  meetings_per_month: number;
  features: {
    export_pdf: boolean;
    calendar_sync: boolean;
    team_invites: boolean;
  };
}

export default function BillingPage() {
  const [token, setToken] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [pricing, setPricing] = useState<Record<string, PlanInfo>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const t = localStorage.getItem("access");
    setToken(t);
    if (!t) window.location.href = "/login";
  }, []);

  useEffect(() => {
    if (!token) return;
    fetchBillingData();
  }, [token]);

  const fetchBillingData = async () => {
    try {
      const [subRes, statsRes, pricingRes] = await Promise.all([
        api.get("/subscriptions/current"),
        api.get("/stats"),
        api.get("/pricing"),
      ]);
      setSubscription(subRes.data);
      setStats(statsRes.data);
      setPricing(pricingRes.data);
    } catch {
      setError("Failed to load billing information");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f]">
        <Navbar />
        <div className="max-w-6xl mx-auto px-6 py-10">
          <div className="space-y-6">
            <div className="skeleton h-8 w-64 mb-2" />
            <div className="skeleton h-4 w-96" />
            <div className="skeleton h-48 w-full rounded-2xl" />
            <div className="grid md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton h-72 rounded-2xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentTierPrice = subscription
    ? pricing[subscription.tier]?.price || 0
    : 0;
  const planName = subscription
    ? pricing[subscription.tier]?.name || "Free"
    : "Free";

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <Navbar />

      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <h1 className="text-3xl font-bold mb-1">Billing & Subscription</h1>
          <p className="text-white/40 text-sm">
            Manage your plan and payment methods
          </p>
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl mb-8 text-sm"
          >
            {error}
          </motion.div>
        )}

        {/* Current Plan Card */}
        {subscription && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card-static p-8 mb-10 relative overflow-hidden"
          >
            {/* Decorative gradient */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-emerald-500/5 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />

            <div className="grid md:grid-cols-2 gap-8 relative z-10">
              {/* Left: Plan Details */}
              <div>
                <p className="text-sm text-white/40 mb-1 font-medium">
                  Current Plan
                </p>
                <h2 className="text-3xl font-bold mb-4">{planName}</h2>

                {currentTierPrice > 0 && (
                  <div className="mb-5">
                    <span className="text-4xl font-extrabold gradient-text-emerald">
                      ₹{currentTierPrice}
                    </span>
                    <span className="text-white/40 ml-2">/month</span>
                  </div>
                )}

                <div className="space-y-2 mb-6">
                  <span
                    className={`badge ${
                      subscription.status === "active"
                        ? "badge-emerald"
                        : "badge-amber"
                    }`}
                  >
                    {subscription.status === "active" ? "● " : "○ "}
                    {subscription.status.toUpperCase()}
                  </span>

                  {subscription.start_date && (
                    <p className="text-sm text-white/30">
                      Started:{" "}
                      {new Date(subscription.start_date).toLocaleDateString(
                        "en-IN",
                        {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        }
                      )}
                    </p>
                  )}
                  {subscription.auto_renew && (
                    <p className="text-sm text-white/30">
                      Auto-renewal: Enabled
                    </p>
                  )}
                </div>

                <Link
                  href="/checkout"
                  className="btn-primary inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm"
                >
                  Upgrade Plan
                  <svg
                    className="w-4 h-4"
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
              </div>

              {/* Right: Usage Stats */}
              {stats && (
                <div>
                  <p className="text-sm text-white/40 font-medium mb-4">
                    Monthly Usage
                  </p>

                  {/* Meetings Counter */}
                  <div className="glass-card-static p-5 mb-4">
                    <div className="flex justify-between mb-3">
                      <p className="text-sm text-white/50">Meetings Used</p>
                      <p className="text-sm font-bold text-emerald-400">
                        {stats.meetings_this_month} /{" "}
                        {stats.plan_limit >= 999999
                          ? "Unlimited"
                          : stats.plan_limit}
                      </p>
                    </div>
                    <div className="progress-bar">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{
                          width: `${Math.min(stats.usage_percentage, 100)}%`,
                        }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className={`progress-fill ${
                          stats.usage_percentage > 80
                            ? "progress-fill-danger"
                            : ""
                        }`}
                      />
                    </div>
                    {stats.usage_percentage > 80 && (
                      <p className="text-xs text-rose-400 mt-2">
                        ⚠ Approaching limit. Consider upgrading.
                      </p>
                    )}
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="glass-card-static p-4 text-center">
                      <p className="text-xs text-white/40 mb-1">
                        Total Meetings
                      </p>
                      <p className="text-2xl font-bold text-blue-400">
                        {stats.total_meetings}
                      </p>
                    </div>
                    <div className="glass-card-static p-4 text-center">
                      <p className="text-xs text-white/40 mb-1">Total Cost</p>
                      <p className="text-2xl font-bold text-emerald-400">
                        ₹{stats.total_cost.toFixed(0)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Available Plans */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className="text-xl font-bold mb-6">Available Plans</h3>

          <div className="grid md:grid-cols-3 gap-6">
            <PlanCard
              tier="free"
              plan={pricing.free}
              isCurrentPlan={subscription?.tier === "free"}
              onUpgrade={() => (window.location.href = "/checkout?tier=free")}
            />
            <PlanCard
              tier="pro"
              plan={pricing.pro}
              isCurrentPlan={subscription?.tier === "pro"}
              isPopular={true}
              onUpgrade={() => (window.location.href = "/checkout?tier=pro")}
            />
            <PlanCard
              tier="team"
              plan={pricing.team}
              isCurrentPlan={subscription?.tier === "team"}
              onUpgrade={() => (window.location.href = "/checkout?tier=team")}
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function PlanCard({
  tier,
  plan,
  isCurrentPlan,
  isPopular,
  onUpgrade,
}: {
  tier: string;
  plan: PlanInfo;
  isCurrentPlan: boolean;
  isPopular?: boolean;
  onUpgrade: () => void;
}) {
  if (!plan) return null;

  const featureList = [
    {
      enabled: true,
      label:
        plan.meetings_per_month >= 999999
          ? "Unlimited meetings"
          : `${plan.meetings_per_month} meetings/month`,
    },
    { enabled: plan.features.calendar_sync, label: "Google Calendar Sync" },
    { enabled: plan.features.export_pdf, label: "PDF Reports" },
    { enabled: plan.features.team_invites, label: "Team Collaboration" },
  ];

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className={`relative rounded-2xl p-7 border transition-all duration-300 ${
        isPopular
          ? "bg-gradient-to-b from-emerald-500/10 to-transparent border-emerald-500/30"
          : "glass-card-static border-white/[0.06]"
      }`}
    >
      {isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="badge-emerald text-xs px-4 py-1.5">
            Most Popular
          </span>
        </div>
      )}

      <h3 className="text-xl font-bold mb-1 capitalize">{plan.name}</h3>

      <div className="mb-6">
        <span className="text-3xl font-extrabold">
          {plan.price === 0 ? "Free" : `₹${plan.price}`}
        </span>
        {plan.price > 0 && (
          <span className="text-white/40 ml-1 text-sm">/month</span>
        )}
      </div>

      <div className="space-y-3 mb-8">
        {featureList.map((f, i) => (
          <div key={i} className="flex items-center gap-3">
            {f.enabled ? (
              <svg
                className="w-4 h-4 text-emerald-400 flex-shrink-0"
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
            ) : (
              <svg
                className="w-4 h-4 text-white/20 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            )}
            <span
              className={`text-sm ${
                f.enabled ? "text-white/60" : "text-white/25 line-through"
              }`}
            >
              {f.label}
            </span>
          </div>
        ))}
      </div>

      <button
        onClick={onUpgrade}
        disabled={isCurrentPlan}
        className={`w-full py-3 rounded-xl font-semibold text-sm transition-all duration-300 ${
          isCurrentPlan
            ? "bg-white/[0.03] text-white/30 border border-white/[0.06] cursor-not-allowed"
            : isPopular
            ? "btn-primary"
            : "btn-secondary"
        }`}
      >
        {isCurrentPlan ? "✓ Current Plan" : "Upgrade"}
      </button>
    </motion.div>
  );
}
