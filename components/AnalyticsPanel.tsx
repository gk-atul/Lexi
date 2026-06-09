"use client";

import { useEffect, useState } from "react";

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

export default function AnalyticsPanel() {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || data) return;
    setLoading(true);
    fetch("/api/analytics")
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open, data]);

  const refresh = () => {
    setData(null);
    setLoading(true);
    fetch("/api/analytics")
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const maxChannel = Math.max(1, ...(data?.channels.map((c) => c.n) ?? []));
  const maxProduct = Math.max(1, ...(data?.products.map((p) => p.n) ?? []));
  const maxTrend   = Math.max(1, ...(data?.trend.map((t) => t.n) ?? []));

  const gen30 = data?.generations.last30 ?? 0;
  const copies30 = data?.interactions30.copies ?? 0;
  const copyRate = gen30 > 0 ? Math.round((copies30 / gen30) * 100) : 0;
  const regenRate = gen30 > 0 ? Math.round(((data?.interactions30.regenerates ?? 0) / gen30) * 100) : 0;

  return (
    <div
      className="bg-[#FBFBFB] border border-white rounded-[20px] p-5"
      style={{ boxShadow: "0px 2px 16px 4px rgba(0,0,0,0.04)" }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full text-left"
      >
        <div>
          <h2 className="text-sm font-semibold text-[#141414]">Usage</h2>
          {!open && data && (
            <p className="text-[11px] text-[#605F63] mt-0.5">
              {data.generations.last7} generation{data.generations.last7 !== 1 ? "s" : ""} this week
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {open && (
            <button
              onClick={(e) => { e.stopPropagation(); refresh(); }}
              className="text-[#B7B7B8] hover:text-[#6841E6] transition-colors"
              title="Refresh"
            >
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                <path d="M13.5 2.5A6.5 6.5 0 118 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M13.5 2.5V5.5H10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          )}
          <svg
            width="14" height="14" viewBox="0 0 14 14" fill="none"
            className={`text-[#B7B7B8] transition-transform ${open ? "rotate-180" : ""}`}
          >
            <path d="M2 4.5l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </button>

      {open && (
        <div className="mt-4 space-y-5">
          {loading && <p className="text-[12px] text-[#B7B7B8]">Loading…</p>}
          {!loading && !data && <p className="text-[12px] text-[#B7B7B8]">No data yet.</p>}

          {data && (
            <>
              {/* ── Generation counts ──────────────────────────────────────── */}
              <div>
                <p className="text-[11px] font-semibold text-[#605F63] uppercase tracking-[0.4px] mb-2">Generations</p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: "This week", value: data.generations.last7 },
                    { label: "Last 30 days", value: data.generations.last30 },
                    { label: "All time", value: data.generations.all },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-white border border-[#F0F0F1] rounded-xl p-3 text-center">
                      <p className="text-[18px] font-semibold text-[#141414]">{value}</p>
                      <p className="text-[10px] text-[#B7B7B8] mt-0.5">{label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── 14-day trend ───────────────────────────────────────────── */}
              {data.trend.length > 0 && (
                <div>
                  <p className="text-[11px] font-semibold text-[#605F63] uppercase tracking-[0.4px] mb-2">14-day trend</p>
                  <div className="flex items-end gap-1 h-10">
                    {data.trend.map(({ day, n }) => (
                      <div
                        key={day}
                        title={`${day}: ${n}`}
                        className="flex-1 bg-[#6841E6] rounded-sm opacity-80 hover:opacity-100 transition-opacity"
                        style={{ height: `${Math.max(4, (n / maxTrend) * 40)}px` }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* ── Interaction rates ──────────────────────────────────────── */}
              <div>
                <p className="text-[11px] font-semibold text-[#605F63] uppercase tracking-[0.4px] mb-2">Interactions (30 days)</p>
                <div className="space-y-2">
                  {[
                    { label: "Copy clicks", value: data.interactions30.copies, rate: copyRate, rateLabel: `${copyRate}% copy rate` },
                    { label: "Regenerates", value: data.interactions30.regenerates, rate: regenRate, rateLabel: `${regenRate}% regen rate` },
                    { label: "Add more", value: data.interactions30.addMore },
                    { label: "AI refines", value: data.interactions30.refines },
                    { label: "Exports", value: data.interactions30.exports },
                  ].map(({ label, value, rateLabel }) => (
                    <div key={label} className="flex items-center gap-3">
                      <span className="text-[12px] text-[#605F63] w-24 flex-shrink-0">{label}</span>
                      <Bar pct={gen30 > 0 ? (value / gen30) * 100 : 0} />
                      <span className="text-[12px] font-medium text-[#141414] w-6 text-right flex-shrink-0">{value}</span>
                      {rateLabel && <span className="text-[10px] text-[#B7B7B8] flex-shrink-0 hidden xl:block">{rateLabel}</span>}
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Channel breakdown ──────────────────────────────────────── */}
              {data.channels.length > 0 && (
                <div>
                  <p className="text-[11px] font-semibold text-[#605F63] uppercase tracking-[0.4px] mb-2">By channel (30 days)</p>
                  <div className="space-y-2">
                    {data.channels.map(({ channel, n }) => (
                      <div key={channel} className="flex items-center gap-3">
                        <span className="text-[12px] text-[#605F63] w-20 flex-shrink-0">{CHANNEL_LABELS[channel] ?? channel}</span>
                        <Bar pct={(n / maxChannel) * 100} color="bg-[#0EA5E9]" />
                        <span className="text-[12px] font-medium text-[#141414] w-6 text-right flex-shrink-0">{n}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Product breakdown ──────────────────────────────────────── */}
              {data.products.length > 0 && (
                <div>
                  <p className="text-[11px] font-semibold text-[#605F63] uppercase tracking-[0.4px] mb-2">By product (30 days)</p>
                  <div className="space-y-2">
                    {data.products.map(({ product, n }) => (
                      <div key={product} className="flex items-center gap-3">
                        <span className="text-[12px] text-[#605F63] w-20 flex-shrink-0">{PRODUCT_LABELS[product] ?? product}</span>
                        <Bar pct={(n / maxProduct) * 100} color="bg-[#22C55E]" />
                        <span className="text-[12px] font-medium text-[#141414] w-6 text-right flex-shrink-0">{n}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Brief field fill rates ─────────────────────────────────── */}
              {data.brief.total > 0 && (
                <div>
                  <p className="text-[11px] font-semibold text-[#605F63] uppercase tracking-[0.4px] mb-2">Brief completeness (30 days)</p>
                  <div className="space-y-2">
                    {[
                      { label: "User description", pct: data.brief.userDesc },
                      { label: "Desired action", pct: data.brief.desiredAction },
                      { label: "Non-negotiables", pct: data.brief.nonNeg },
                      { label: "Reference material", pct: data.brief.reference },
                    ].map(({ label, pct }) => (
                      <div key={label} className="flex items-center gap-3">
                        <span className="text-[12px] text-[#605F63] w-28 flex-shrink-0">{label}</span>
                        <Bar pct={pct} color="bg-[#F59E0B]" />
                        <span className="text-[12px] font-medium text-[#141414] w-8 text-right flex-shrink-0">{pct}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Tone + comm type ───────────────────────────────────────── */}
              <div className="grid grid-cols-2 gap-4">
                {data.tone.length > 0 && (
                  <div>
                    <p className="text-[11px] font-semibold text-[#605F63] uppercase tracking-[0.4px] mb-2">Tone dial</p>
                    <div className="space-y-1.5">
                      {data.tone.map(({ tone, n }) => (
                        <div key={tone} className="flex items-center justify-between text-[12px]">
                          <span className="text-[#605F63]">{TONE_LABELS[tone] ?? tone}</span>
                          <span className="font-medium text-[#141414]">{n}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {data.commType.length > 0 && (
                  <div>
                    <p className="text-[11px] font-semibold text-[#605F63] uppercase tracking-[0.4px] mb-2">Comm type</p>
                    <div className="space-y-1.5">
                      {data.commType.map(({ comm_type, n }) => (
                        <div key={comm_type} className="flex items-center justify-between text-[12px]">
                          <span className="text-[#605F63]">{COMM_LABELS[comm_type] ?? comm_type}</span>
                          <span className="font-medium text-[#141414]">{n}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
