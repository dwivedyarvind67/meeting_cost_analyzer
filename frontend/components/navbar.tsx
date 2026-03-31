"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

export default function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const token = localStorage.getItem("access");
    setIsLoggedIn(!!token);
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    setIsLoggedIn(false);
    window.location.href = "/login";
  };

  const navLinks = isLoggedIn
    ? [
        { href: "/", label: "Home" },
        { href: "/dashboard", label: "Dashboard" },
        { href: "/calendar", label: "Calendar" },
        { href: "/history", label: "History" },
        { href: "/billing", label: "Billing" },
      ]
    : [
        { href: "/", label: "Home" },
        { href: "#features", label: "Features" },
        { href: "#pricing", label: "Pricing" },
        { href: "#contact", label: "Contact" },
      ];

  const isActive = (href: string) => pathname === href;

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
      className={`sticky top-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-[#050507]/80 backdrop-blur-2xl border-b border-white/[0.06] shadow-lg shadow-black/30"
          : "bg-transparent border-b border-transparent"
      }`}
      style={{ height: "var(--nav-height)" }}
    >
      <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group relative z-10">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2"
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-xs shadow-lg transition-shadow duration-300"
              style={{
                background: "linear-gradient(135deg, #ff6b35, #e63946)",
                boxShadow: "0 4px 20px rgba(255, 107, 53, 0.25)",
              }}
            >
              M
            </div>
            <span className="font-bold text-lg tracking-tight font-display">
              <span className="gradient-text">MCA</span>
            </span>
          </motion.div>
        </Link>

        {/* Desktop Nav Links */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                isActive(link.href)
                  ? "text-orange-400"
                  : "text-white/50 hover:text-orange-300/80"
              }`}
            >
              {isActive(link.href) && (
                <motion.div
                  layoutId="navbar-active-pill"
                  className="absolute inset-0 bg-orange-500/10 rounded-lg -z-10"
                  transition={{ type: "spring", stiffness: 200, damping: 20 }}
                />
              )}
              <span className="relative z-10">{link.label}</span>
            </Link>
          ))}

          {isLoggedIn && (
            <button
              onClick={handleLogout}
              className="ml-2 px-4 py-2 rounded-lg text-sm font-medium text-white/40 hover:text-rose-400 hover:bg-rose-500/10 transition-all duration-200"
            >
              Logout
            </button>
          )}

          {!isLoggedIn && (
            <Link
              href="/signup"
              className="ml-3 btn-primary-animated px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5"
            >
              Get Started
            </Link>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden flex flex-col gap-1.5 p-2 z-20"
          aria-label="Toggle menu"
        >
          <span
            className={`w-5 h-0.5 bg-white/70 transition-all duration-300 origin-center ${
              mobileOpen ? "rotate-45 translate-y-[8px]" : ""
            }`}
          />
          <span
            className={`w-5 h-0.5 bg-white/70 transition-all duration-300 ${
              mobileOpen ? "opacity-0" : ""
            }`}
          />
          <span
            className={`w-5 h-0.5 bg-white/70 transition-all duration-300 origin-center ${
              mobileOpen ? "-rotate-45 -translate-y-[8px]" : ""
            }`}
          />
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden overflow-hidden bg-[#050507]/95 backdrop-blur-2xl border-b border-white/[0.06] shadow-xl absolute top-full left-0 right-0 origin-top"
          >
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="px-6 py-4 space-y-1"
            >
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`block px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                    isActive(link.href)
                      ? "text-orange-400 bg-orange-500/10"
                      : "text-white/60 hover:text-white hover:bg-white/[0.05]"
                  }`}
                >
                  {link.label}
                </Link>
              ))}

              {isLoggedIn && (
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-3 rounded-lg text-sm font-medium text-white/40 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                >
                  Logout
                </button>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}