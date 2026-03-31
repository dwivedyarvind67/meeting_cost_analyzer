"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GoogleLogin } from "@react-oauth/google";
import Link from "next/link";
import api from "@/lib/api";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const login = async () => {
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const res = await api.post("/login", { email, password });

      if (!res.data.access_token) {
        setError("Login failed. Please try again.");
        return;
      }

      localStorage.setItem("access", res.data.access_token);
      if (res.data.refresh_token) {
        localStorage.setItem("refresh", res.data.refresh_token);
      }
      window.location.href = "/";
    } catch (err: any) {
      setError(err.response?.data?.detail || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async (credentialResponse: any) => {
    setError("");
    setLoading(true);

    try {
      const res = await api.post("/google-login", {
        token: credentialResponse.credential,
      });

      localStorage.setItem("access", res.data.access_token);
      if (res.data.refresh_token) {
        localStorage.setItem("refresh", res.data.refresh_token);
      }
      window.location.href = "/";
    } catch (err: any) {
      setError(err.response?.data?.detail || "Google login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !loading) login();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f] px-6 relative overflow-hidden">
      {/* Background effects */}
      <div className="orb orb-emerald w-[500px] h-[500px] -top-[150px] -right-[150px]" />
      <div className="orb orb-purple w-[400px] h-[400px] bottom-[10%] -left-[150px]" />
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
          {/* Top glow line */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-px bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />

          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold mb-2">Welcome back</h1>
            <p className="text-white/40 text-sm">Sign in to continue tracking meeting costs</p>
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
          </AnimatePresence>

          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-white/50 mb-2">
                Email
              </label>
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
              <label className="block text-sm font-medium text-white/50 mb-2">
                Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                className="input-field"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={loading}
                autoComplete="current-password"
              />
            </div>
          </div>

          <button
            onClick={login}
            disabled={loading}
            className="w-full btn-primary py-3.5 rounded-xl text-sm font-semibold mb-6 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Signing in...
              </span>
            ) : (
              "Sign In"
            )}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-white/[0.06]" />
            <span className="text-xs text-white/30 font-medium">OR</span>
            <div className="flex-1 h-px bg-white/[0.06]" />
          </div>

          {/* Google Login */}
          <div className="flex justify-center mb-6">
            <GoogleLogin
              onSuccess={handleGoogle}
              onError={() => setError("Google popup closed or blocked by browser")}
              theme="filled_black"
              shape="pill"
              size="large"
              width={320}
            />
          </div>

          <p className="text-center text-white/30 text-sm">
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors"
            >
              Create one
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}