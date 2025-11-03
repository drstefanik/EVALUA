import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronDown, LayoutDashboard } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import { getStoredSession, getDashboardPath } from "../api";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState(null);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  // Load session
  useEffect(() => {
    const s = getStoredSession?.();
    setSession(s || null);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function onClickOutside(e) {
      if (open && menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  const handleDashboard = () => {
    try {
      const path = getDashboardPath?.(session?.role) || "/dashboard";
      navigate(path);
    } catch {
      navigate("/dashboard");
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur dark:bg-slate-900/70">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        {/* Logo / Brand */}
        <Link
          to="/"
          className="font-semibold tracking-wide text-[#00247D] dark:text-white"
        >
          BI NEXT
        </Link>

        {/* Right side actions */}
        <div className="flex items-center gap-2">
          {/* If logged in: show Dashboard button */}
          {session ? (
            <button
              type="button"
              onClick={handleDashboard}
              className="inline-flex items-center gap-2 rounded-xl bg-[#00247D] px-3 py-1.5 text-sm font-semibold text-white shadow hover:bg-[#001c5e] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 dark:focus-visible:ring-white/60"
            >
              <LayoutDashboard size={18} />
              Dashboard
            </button>
          ) : (
            /* If NOT logged in: show Sign-up/Login dropdown */
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={open}
                className="inline-flex items-center gap-1 rounded-xl border px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 dark:border-white/10 dark:text-slate-100 dark:hover:bg-slate-800"
              >
                Log in / Sign up
                <ChevronDown
                  className={`transition-transform ${open ? "rotate-180" : ""}`}
                  size={16}
                />
              </button>

              {/* Menu */}
              {open && (
                <div
                  role="menu"
                  aria-label="Access menu"
                  className="absolute right-0 mt-2 w-56 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl dark:border-white/10 dark:bg-slate-900/90"
                >
                  <Link
                    to="/signup-school"
                    role="menuitem"
                    className="block rounded-xl px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 focus:bg-slate-50 dark:text-slate-100 dark:hover:bg-slate-800"
                    onClick={() => setOpen(false)}
                  >
                    School sign-up
                  </Link>
                  <Link
                    to="/signup-student"
                    role="menuitem"
                    className="block rounded-xl px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 focus:bg-slate-50 dark:text-slate-100 dark:hover:bg-slate-800"
                    onClick={() => setOpen(false)}
                  >
                    Student sign-up
                  </Link>
                  <Link
                    to="/login"
                    role="menuitem"
                    className="block rounded-xl px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 focus:bg-slate-50 dark:text-slate-100 dark:hover:bg-slate-800"
                    onClick={() => setOpen(false)}
                  >
                    Login
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Toggle Tema */}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
