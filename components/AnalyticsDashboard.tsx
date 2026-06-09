"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Analytics {
  generations: { last7: number; last30: number; all: number };
  interactions30: { copies: number; regenerates: number; addMore: number; refines: number; exports: number };
  channels: { channel: string; n: number }[];
  products: { product: string; n: number }[];
  brief: { total: number; userDesc: number; desiredAction: number; nonNeg: number; reference: number };
  tone: { tone: string; n: number }[];
  commType: { comm_type: string; n: number }[];
  trend: { day: string; n: number }[];
}

function Bar({ pct, color = "bg-[#6841E6]" }: { pct: number; color?: string }) {
  return (
    <div className="flex-1 h-1.5 bg-[#F0F0F1] rounded-full overflow-hidden">
      <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${Math.min(pct, 100)}%` }} />
    </div>
  );
}

const CHANNEL_LABELS: Record<string, string> = {
  push: "Push", whatsapp: "WhatsApp", email: "Email", "in-app": "In-App",
};
const PRODUCT_LABELS: Record<string, string> = {
  auto: "Auto", health: "Health", life: "Life", travel: "Travel",
};
const TONE_LABELS: Record<string, string> = {
  warm: "Warm", balanced: "Balanced", direct: "Direct",
};
const COMM_LABELS: Record<string, string> = {
  informational: "Informational", feature: "Feature", incentive: "Incentive",
};

export default function AnalyticsDashboard() {
  const router = useRouter();
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    fetch("/api/analytics")
      .then((r) => {
        if (r.status === 401) { router.push("/login"); return null; }
        return r.json();
      })
      .then((d) => { if (d) setData(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const maxChannel = Math.max(1, ...(data?.channels.map((c) => c.n) ?? []));
  const maxProduct = Math.max(1, ...(data?.products.map((p) => p.n) ?? []));
  const maxTrend   = Math.max(1, ...(data?.trend.map((t) => t.n) ?? []));
  const gen30 = data?.generations.last30 ?? 0;
  const copyRate  = gen30 > 0 ? Math.round(((data?.interactions30.copies ?? 0) / gen30) * 100) : 0;
  const regenRate = gen30 > 0 ? Math.round(((data?.interactions30.regenerates ?? 0) / gen30) * 100) : 0;

  async function handleLogout() {
    await fetch("/api/auth/admin", { method: "DELETE" });
    router.push("/");
  }

  return (
    <div className="min-h-screen bg-[#F7F7F8]">
      {/* Header */}
      <header className="bg-white border-b border-[#F0F0F1] sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/" className="flex items-center gap-2 text-[#B7B7B8] hover:text-[#6841E6] transition-colors">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="text-[12px]">Generator</span>
            </a>
            <span className="text-[#E0E0E1]">/</span>
            <span className="text-[13px] font-semibold text-[#141414]">Usage Analytics</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={load}
              className="text-[#B7B7B8] hover:text-[#6841E6] transition-colors p-1"
              title="Refresh"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M13.5 2.5A6.5 6.5 0 118 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M13.5 2.5V5.5H10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <button
              onClick={handleLogout}
              className="text-[12px] text-[#605F63] hover:text-red-500 transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {loading && (
          <div className="flex items-center justify-center py-24">
            <p className="text-[13px] text-[#B7B7B8]">Loading…</p>
          </div>
        )}

        {!loading && !data && (
          <div className="flex items-center justify-center py-24">
            <p className="text-[13px] text-[#B7B7B8]">No data yet — generate some copy first.</p>
          </div>
        )}

        {data && (
          <div className="space-y-6">
            {/* ── Generation counts ─────────────────────────────────────────── */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "This week", value: data.generations.last7, sub: "generations" },
                { label: "Last 30 days", value: data.generations.last30, sub: "generations" },
                { label: "All time", value: data.generations.all, sub: "total" },
              ].map(({ label, value, sub }) => (
                <div
                  key={label}
                  className="bg-white rounded-2xl p-5 border border-[#F0F0F1]"
                  style={{ boxShadow: "0px 2px 8px rgba(0,0,0,0.04)" }}
                >
                  <p className="text-[28px] font-semibold text-[#141414] leading-none">{value}</p>
                  <p className="text-[12px] text-[#B7B7B8] mt-1.5">{sub}</p>
                  <p className="text-[11px] font-medium text-[#605F63] mt-0.5">{label}</p>
                </div>
              ))}
            </div>

            {/* ── 14-day trend ──────────────────────────────────────────────── */}
            {data.trend.length > 0 && (
              <div
                className="bg-white rounded-2xl p-5 border border-[#F0F0F1]"
                style={{ boxShadow: "0px 2px 8px rgba(0,0,0,0.04)" }}
              >
                <p className="text-[12px] font-semibold text-[#605F63] uppercase tracking-[0.5px] mb-4">14-day trend</p>
                <div className="flex items-end gap-1.5 h-16">
                  {data.trend.map(({ day, n }) => (
                    <div key={day} className="flex-1 flex flex-col items-center gap-1">
                      <div
                        title={`${day}: ${n} generation${n !== 1 ? "s" : ""}`}
                        className="w-full bg-[#6841E6] rounded-sm opacity-75 hover:opacity-100 transition-opacity cursor-default"
                        style={{ height: `${Math.max(3, (n / maxTrend) * 56)}px` }}
                      />
                    </div>
                  ))}
                </div>
                <div className="flex justify-between mt-1.5">
                  <span className="text-[10px] text-[#B7B7B8]">{data.trend[0]?.day}</span>
                  <span className="text-[10px] text-[#B7B7B8]">{data.trend[data.trend.length - 1]?.day}</span>
                </div>
              </div>
            )}

            {/* ── Interaction rates ────────────────────────────────────────── */}
            <div
              className="bg-white rounded-2xl p-5 border border-[#F0F0F1]"
              style={{ boxShadow: "0px 2px 8px rgba(0,0,0,0.04)" }}
            >
                <p className="text-[12px] font-semibold text-[#605F63] uppercase tracking-[0.5px] mb-4">Interactions · last 30 days</p>
                <div className="space-y-3">
                  {[
                    { label: "Copy clicks", value: data.interactions30.copies, badge: `${copyRate}%` },
                    { label: "Regenerates", value: data.interactions30.regenerates, badge: `${regenRate}%` },
                    { label: "Add more", value: data.interactions30.addMore },
                    { label: "AI refines", value: data.interactions30.refines },
                    { label: "Exports", value: data.interactions30.exports },
                  ].map(({ label, value, badge }) => (
                    <div key={label} className="flex items-center gap-3">
                      <span className="text-[12px] text-[#605F63] w-24 flex-shrink-0">{label}</span>
                      <Bar pct={gen30 > 0 ? (value / gen30) * 100 : 0} />
                      <span className="text-[12px] font-semibold text-[#141414] w-6 text-right flex-shrink-0">{value}</span>
                      {badge && (
                        <span className="text-[10px] text-[#6841E6] bg-[#F0EEFE] rounded-full px-1.5 py-0.5 flex-shrink-0 font-medium">
                          {badge}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* ── Channel breakdown ────────────────────────────────────────── */}
              {data.channels.length > 0 && (
                <div
                  className="bg-white rounded-2xl p-5 border border-[#F0F0F1]"
                  style={{ boxShadow: "0px 2px 8px rgba(0,0,0,0.04)" }}
                >
                  <p className="text-[12px] font-semibold text-[#605F63] uppercase tracking-[0.5px] mb-4">By channel · 30 days</p>
                  <div className="space-y-3">
                    {data.channels.map(({ channel, n }) => (
                      <div key={channel} className="flex items-center gap-3">
                        <span className="text-[12px] text-[#605F63] w-20 flex-shrink-0">{CHANNEL_LABELS[channel] ?? channel}</span>
                        <Bar pct={(n / maxChannel) * 100} color="bg-[#0EA5E9]" />
                        <span className="text-[12px] font-semibold text-[#141414] w-6 text-right flex-shrink-0">{n}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Product breakdown ────────────────────────────────────────── */}
              {data.products.length > 0 && (
                <div
                  className="bg-white rounded-2xl p-5 border border-[#F0F0F1]"
                  style={{ boxShadow: "0px 2px 8px rgba(0,0,0,0.04)" }}
                >
                  <p className="text-[12px] font-semibold text-[#605F63] uppercase tracking-[0.5px] mb-4">By product · 30 days</p>
                  <div className="space-y-3">
                    {data.products.map(({ product, n }) => (
                      <div key={product} className="flex items-center gap-3">
                        <span className="text-[12px] text-[#605F63] w-20 flex-shrink-0">{PRODUCT_LABELS[product] ?? product}</span>
                        <Bar pct={(n / maxProduct) * 100} color="bg-[#22C55E]" />
                        <span className="text-[12px] font-semibold text-[#141414] w-6 text-right flex-shrink-0">{n}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ── Tone + comm type ──────────────────────────────────────────── */}
            <div className="grid grid-cols-2 gap-4">
              {data.tone.length > 0 && (
                <div
                  className="bg-white rounded-2xl p-5 border border-[#F0F0F1]"
                  style={{ boxShadow: "0px 2px 8px rgba(0,0,0,0.04)" }}
                >
                  <p className="text-[12px] font-semibold text-[#605F63] uppercase tracking-[0.5px] mb-4">Tone dial</p>
                  <div className="space-y-2">
                    {data.tone.map(({ tone, n }) => (
                      <div key={tone} className="flex items-center justify-between">
                        <span className="text-[13px] text-[#605F63]">{TONE_LABELS[tone] ?? tone}</span>
                        <span className="text-[13px] font-semibold text-[#141414]">{n}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {data.commType.length > 0 && (
                <div
                  className="bg-white rounded-2xl p-5 border border-[#F0F0F1]"
                  style={{ boxShadow: "0px 2px 8px rgba(0,0,0,0.04)" }}
                >
                  <p className="text-[12px] font-semibold text-[#605F63] uppercase tracking-[0.5px] mb-4">Comm type</p>
                  <div className="space-y-2">
                    {data.commType.map(({ comm_type, n }) => (
                      <div key={comm_type} className="flex items-center justify-between">
                        <span className="text-[13px] text-[#605F63]">{COMM_LABELS[comm_type] ?? comm_type}</span>
                        <span className="text-[13px] font-semibold text-[#141414]">{n}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
