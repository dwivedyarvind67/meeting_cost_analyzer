"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import api from "@/lib/api";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const getPasswordStrength = (pwd: string): { score: number; label: string; color: string } => {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[a-z]/.test(pwd)) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/\d/.test(pwd)) score++;
    if (/[^a-zA-Z0-9]/.test(pwd)) score++;

    if (score <= 2) return { score, label: "Weak", color: "#f43f5e" };
    if (score <= 3) return { score, label: "Fair", color: "#f59e0b" };
    if (score <= 4) return { score, label: "Good", color: "#3b82f6" };
    return { score, label: "Strong", color: "#10b981" };
  };

  const validatePassword = (pwd: string): { valid: boolean; feedback: string } => {
    if (pwd.length < 8) return { valid: false, feedback: "At least 8 characters" };
    if (!/[a-z]/.test(pwd)) return { valid: false, feedback: "Add a lowercase letter" };
    if (!/[A-Z]/.test(pwd)) return { valid: false, feedback: "Add an uppercase letter" };
    if (!/\d/.test(pwd)) return { valid: false, feedback: "Add a number" };
    return { valid: true, feedback: "Password is strong" };
  };

  const handleSignup = async () => {
    setError("");
    setSuccess("");

    if (!email || !password || !confirmPassword) {
      setError("All fields are required");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    const validation = validatePassword(password);
    if (!validation.valid) {
      setError(validation.feedback);
      return;
    }

    setLoading(true);
    try {
      await api.post("/signup", { email, password });
      setSuccess("Account created! Redirecting to login...");
      setTimeout(() => (window.location.href = "/login"), 2000);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !loading) handleSignup();
  };

  const strength = getPasswordStrength(password);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f] px-6 relative overflow-hidden">
      {/* Background effects */}
      <div className="orb orb-purple w-[500px] h-[500px] -top-[150px] -left-[150px]" />
      <div className="orb orb-emerald w-[400px] h-[400px] bottom-[10%] -right-[150px]" />
      <div className="bg-grid fixed inset-0 pointer-events-none opacity-20" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-10">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white font-bold shadow-lg shadow-emerald-500/20">
            M
          </div>
          <span className="font-bold text-xl tracking-tight">
            <span className="gradient-text">Meeting</span>
            <span className="text-white/60 ml-1 font-medium">Cost</span>
          </span>
        </div>

        {/* Card */}
        <div className="glass-card-static p-8 md:p-10 relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-px bg-gradient-to-r from-transparent via-purple-500/40 to-transparent" />

          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold mb-2">Create your account</h1>
            <p className="text-white/40 text-sm">Start tracking meeting costs for free</p>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 mb-6 rounded-xl text-sm text-center"
              >
                {error}
              </motion.div>
            )}
            {success && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 mb-6 rounded-xl text-sm text-center"
              >
                {success}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-white/50 mb-2">Email</label>
              <input
                type="email"
                placeholder="you@company.com"
                className="input-field"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={loading}
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/50 mb-2">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                className="input-field"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={loading}
                autoComplete="new-password"
              />
              {/* Strength meter */}
              {password && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="mt-3"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-white/40">Password strength</span>
                    <span className="text-xs font-semibold" style={{ color: strength.color }}>
                      {strength.label}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <motion.div
                        key={level}
                        className="h-1 flex-1 rounded-full"
                        initial={{ scaleX: 0 }}
                        animate={{
                          scaleX: 1,
                          backgroundColor:
                            level <= strength.score ? strength.color : "rgba(255,255,255,0.06)",
                        }}
                        transition={{ delay: level * 0.05 }}
                        style={{ transformOrigin: "left" }}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-white/50 mb-2">Confirm Password</label>
              <input
                type="password"
                placeholder="••••••••"
                className="input-field"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={loading}
                autoComplete="new-password"
              />
              {confirmPassword && password !== confirmPassword && (
                <p className="text-xs text-rose-400 mt-1.5">Passwords do not match</p>
              )}
              {confirmPassword && password === confirmPassword && password.length > 0 && (
                <p className="text-xs text-emerald-400 mt-1.5">Passwords match ✓</p>
              )}
            </div>
          </div>

          <button
            onClick={handleSignup}
            disabled={loading}
            className="w-full btn-primary py-3.5 rounded-xl text-sm font-semibold mb-6 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Creating account...
              </span>
            ) : (
              "Create Account"
            )}
          </button>

          {/* Benefits */}
          <div className="flex items-center justify-center gap-6 mb-6">
            {["Free forever plan", "No credit card", "Cancel anytime"].map((b, i) => (
              <span key={i} className="text-[11px] text-white/30 flex items-center gap-1">
                <svg className="w-3 h-3 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
                {b}
              </span>
            ))}
          </div>

          <p className="text-center text-white/30 text-sm">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
