"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (res.ok) {
        router.push("/analytics");
      } else {
        setError("Wrong username or password.");
      }
    } catch {
      setError("Something went wrong — try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F7F7F8] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo / wordmark */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-lg bg-[#6841E6] flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 1L13 7L7 13L1 7L7 1Z" fill="white" opacity="0.9"/>
              </svg>
            </div>
            <span className="text-[15px] font-semibold text-[#141414] tracking-tight">
              ACKO Copy
            </span>
          </div>
          <p className="text-[13px] text-[#888]">Sign in to access your dashboard</p>
        </div>

        {/* Card */}
        <div
          className="bg-white rounded-2xl p-7 w-full"
          style={{ boxShadow: "0px 4px 24px rgba(0,0,0,0.07), 0px 1px 4px rgba(0,0,0,0.04)" }}
        >
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-medium text-[#444]" htmlFor="username">
                Username
              </label>
              <input
                id="username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full border border-[#E0E0E1] rounded-xl px-3.5 py-2.5 text-[13px] text-[#141414] placeholder:text-[#B7B7B8] focus:outline-none focus:ring-2 focus:ring-[#6841E6] focus:border-transparent transition-all"
                placeholder="Enter username"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-medium text-[#444]" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full border border-[#E0E0E1] rounded-xl px-3.5 py-2.5 text-[13px] text-[#141414] placeholder:text-[#B7B7B8] focus:outline-none focus:ring-2 focus:ring-[#6841E6] focus:border-transparent transition-all"
                placeholder="Enter password"
              />
            </div>

            {error && (
              <p className="text-[12px] text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-1 w-full bg-[#6841E6] hover:bg-[#5733CC] text-white text-[13px] font-semibold rounded-xl py-2.5 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>

        <p className="text-center text-[11px] text-[#B7B7B8] mt-5">
          <a href="/" className="hover:text-[#6841E6] transition-colors">← Back to generator</a>
        </p>
      </div>
    </div>
  );
}
