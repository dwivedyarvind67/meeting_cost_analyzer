"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/navbar";
import api from "@/lib/api";

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface PlanInfo {
  name: string;
  price: number;
  meetings_per_month: number;
}

function CheckoutContent() {
  const searchParams = useSearchParams();
  const [token, setToken] = useState<string | null>(null);
  const [selectedTier, setSelectedTier] = useState(
    searchParams?.get("tier") || "pro"
  );
  const [pricing, setPricing] = useState<Record<string, PlanInfo>>({});
  const [paymentMethod, setPaymentMethod] = useState<
    "razorpay" | "stripe" | "free"
  >("razorpay");
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const t = localStorage.getItem("access");
    setToken(t);
    if (!t) window.location.href = "/login";
  }, []);

  useEffect(() => {
    if (!token) return;
    fetchPricing();
  }, [token]);

  const fetchPricing = async () => {
    try {
      const res = await api.get("/pricing");
      setPricing(res.data);
    } catch {
      setError("Could not load pricing information");
    } finally {
      setLoading(false);
    }
  };

  const handleRazorpayPayment = async () => {
    if (selectedTier === "free") {
      handleFreeActivation();
      return;
    }
    setProcessing(true);
    try {
      if (!window.Razorpay) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement("script");
          script.src = "https://checkout.razorpay.com/v1/checkout.js";
          script.onload = () => resolve();
          script.onerror = () => reject(new Error("Failed to load Razorpay"));
          document.body.appendChild(script);
        });
      }

      const orderRes = await api.post("/payments/razorpay/order", {
        tier: selectedTier,
      });

      const { order_id, amount, key_id } = orderRes.data;

      const options = {
        key: key_id || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: amount,
        currency: "INR",
        order_id: order_id,
        handler: async (response: any) => {
          try {
            await api.post("/payments/razorpay/verify", {
              order_id: response.razorpay_order_id,
              payment_id: response.razorpay_payment_id,
              signature: response.razorpay_signature,
              tier: selectedTier,
            });
            localStorage.setItem("last_payment_status", "success");
            window.location.href = "/billing?success=true";
          } catch {
            setError("Payment verification failed. Please try again.");
          }
        },
        prefill: {
          email: localStorage.getItem("user_email") || "",
        },
        theme: {
          color: "#10b981",
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (err: any) {
      setError(
        err.response?.data?.detail || "Failed to create payment order"
      );
    } finally {
      setProcessing(false);
    }
  };

  const handleStripePayment = async () => {
    if (selectedTier === "free") {
      handleFreeActivation();
      return;
    }
    setProcessing(true);
    try {
      const sessionRes = await api.post("/payments/stripe/create-session", {
        tier: selectedTier,
      });
      const { session_id } = sessionRes.data;
      const stripe = await loadStripe(
        process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
      );
      if (stripe) {
        const { error } = await stripe.redirectToCheckout({
          sessionId: session_id,
        });
        if (error) {
          setError(error.message || "Failed to redirect to payment");
        }
      }
    } catch (err: any) {
      setError(
        err.response?.data?.detail || "Failed to create checkout session"
      );
    } finally {
      setProcessing(false);
    }
  };

  const handleFreeActivation = async () => {
    try {
      await api.post("/subscriptions/upgrade", { tier: "free" });
      window.location.href = "/billing?success=true";
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to activate free plan");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f]">
        <Navbar />
        <div className="max-w-2xl mx-auto px-6 py-10">
          <div className="skeleton h-8 w-48 mb-2" />
          <div className="skeleton h-4 w-64 mb-8" />
          <div className="grid md:grid-cols-2 gap-6">
            <div className="skeleton h-64 rounded-2xl" />
            <div className="skeleton h-64 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  const plan = pricing[selectedTier];
  if (!plan) {
    return (
      <div className="min-h-screen bg-[#0a0a0f]">
        <Navbar />
        <div className="max-w-2xl mx-auto px-6 py-20 text-center">
          <div className="text-5xl mb-4">❌</div>
          <p className="text-white/50 mb-4">Invalid plan selected</p>
          <a
            href="/billing"
            className="text-emerald-400 hover:text-emerald-300 text-sm font-medium transition-colors"
          >
            ← Back to Billing
          </a>
        </div>
      </div>
    );
  }

  const amount = selectedTier === "free" ? 0 : plan.price;

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <Navbar />

      <div className="max-w-3xl mx-auto px-6 py-10">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <a
            href="/billing"
            className="text-white/30 hover:text-white/50 text-sm font-medium transition-colors inline-flex items-center gap-1 mb-4"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Billing
          </a>
          <h1 className="text-3xl font-bold mb-1">Checkout</h1>
          <p className="text-white/40 text-sm">
            Complete your subscription upgrade
          </p>
        </motion.div>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl mb-8 text-sm"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Plan Selector */}
        <div className="flex gap-3 mb-8">
          {Object.entries(pricing).map(([key, p]) => (
            <button
              key={key}
              onClick={() => setSelectedTier(key)}
              className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-200 border ${
                selectedTier === key
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                  : "bg-white/[0.02] border-white/[0.06] text-white/40 hover:text-white/60 hover:border-white/[0.1]"
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Order Summary */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-card-static p-7 relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />

            <h2 className="text-lg font-semibold mb-6">Order Summary</h2>

            <div className="space-y-4 mb-6">
              <div className="flex justify-between">
                <span className="text-white/40">Plan</span>
                <span className="font-semibold capitalize">{plan.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">Meetings/month</span>
                <span className="font-semibold">
                  {plan.meetings_per_month >= 999999
                    ? "Unlimited"
                    : plan.meetings_per_month}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">Billing</span>
                <span className="font-semibold">Monthly</span>
              </div>
              <div className="h-px bg-white/[0.06]" />
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span className="gradient-text-emerald">
                  {amount === 0 ? "Free" : `₹${amount}`}
                </span>
              </div>
            </div>

            {selectedTier === "free" && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
                <p className="text-emerald-400 text-sm font-medium flex items-center gap-2">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  No payment required
                </p>
              </div>
            )}

            {/* Trust indicators */}
            <div className="mt-6 pt-6 border-t border-white/[0.04]">
              <div className="flex items-center gap-4 text-white/20 text-xs">
                <span className="flex items-center gap-1">
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                  SSL Encrypted
                </span>
                <span className="flex items-center gap-1">
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                  PCI Compliant
                </span>
              </div>
            </div>
          </motion.div>

          {/* Payment Method */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-card-static p-7 relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />

            <h2 className="text-lg font-semibold mb-6">Payment Method</h2>

            {selectedTier !== "free" && (
              <div className="space-y-3 mb-6">
                <label
                  className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                    paymentMethod === "razorpay"
                      ? "border-emerald-500/40 bg-emerald-500/5"
                      : "border-white/[0.06] hover:border-white/[0.1] bg-white/[0.01]"
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value="razorpay"
                    checked={paymentMethod === "razorpay"}
                    onChange={(e) =>
                      setPaymentMethod(e.target.value as "razorpay")
                    }
                    className="sr-only"
                  />
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mr-3 transition-all ${
                      paymentMethod === "razorpay"
                        ? "border-emerald-400"
                        : "border-white/20"
                    }`}
                  >
                    {paymentMethod === "razorpay" && (
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                    )}
                  </div>
                  <div>
                    <span className="font-semibold text-sm">Razorpay</span>
                    <p className="text-xs text-white/30 mt-0.5">
                      UPI, Cards, Net Banking (India)
                    </p>
                  </div>
                </label>

                <label
                  className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                    paymentMethod === "stripe"
                      ? "border-blue-500/40 bg-blue-500/5"
                      : "border-white/[0.06] hover:border-white/[0.1] bg-white/[0.01]"
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value="stripe"
                    checked={paymentMethod === "stripe"}
                    onChange={(e) =>
                      setPaymentMethod(e.target.value as "stripe")
                    }
                    className="sr-only"
                  />
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mr-3 transition-all ${
                      paymentMethod === "stripe"
                        ? "border-blue-400"
                        : "border-white/20"
                    }`}
                  >
                    {paymentMethod === "stripe" && (
                      <div className="w-2.5 h-2.5 rounded-full bg-blue-400" />
                    )}
                  </div>
                  <div>
                    <span className="font-semibold text-sm">Stripe</span>
                    <p className="text-xs text-white/30 mt-0.5">
                      International cards
                    </p>
                  </div>
                </label>
              </div>
            )}

            <button
              onClick={() =>
                paymentMethod === "razorpay"
                  ? handleRazorpayPayment()
                  : handleStripePayment()
              }
              disabled={processing}
              className="w-full btn-primary py-4 rounded-xl text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
            >
              {processing ? (
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
                  Processing...
                </span>
              ) : selectedTier === "free" ? (
                "Activate Free Plan"
              ) : (
                `Pay ₹${amount}`
              )}
            </button>

            <p className="text-white/20 text-xs text-center mt-4">
              Your payment is securely processed. Cancel anytime.
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
          <div className="text-center">
            <div className="w-10 h-10 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-white/40 text-sm">Loading checkout...</p>
          </div>
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}

// Load Stripe dynamically
async function loadStripe(publishableKey: string) {
  return new Promise<any>((resolve, reject) => {
    if ((window as any).Stripe) {
      resolve((window as any).Stripe(publishableKey));
      return;
    }
    const script = document.createElement("script");
    script.src = "https://js.stripe.com/v3/";
    script.onload = () => {
      const Stripe = (window as any).Stripe;
      if (Stripe) resolve(Stripe(publishableKey));
      else reject(new Error("Stripe failed to load"));
    };
    script.onerror = () => reject(new Error("Failed to load Stripe script"));
    document.body.appendChild(script);
  });
}
