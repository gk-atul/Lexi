"use client";

import { useState, useEffect, useCallback } from "react";
import { CHANNEL_LABELS, PRODUCT_LABELS } from "@/lib/prompts";

interface InsightRow {
  channel: string;
  product: string;
  userState: string;
  insights: string[];
  summary: string;
  feedbackCount: number;
  updatedAt: string;
}

interface GroupedChannel {
  channel: string;
  label: string;
  combos: InsightRow[];
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export default function LearningPanel() {
  const [rows, setRows] = useState<InsightRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const res = await fetch("/api/learn");
      const data = await res.json();
      setRows(data.insights ?? []);
    } catch {
      // silently ignore — panel is non-critical
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = async (row: InsightRow) => {
    const key = `${row.channel}:${row.product}:${row.userState}`;
    setRefreshing(key);
    try {
      await fetch("/api/learn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel: row.channel,
          product: row.product,
          userState: row.userState,
        }),
      });
      await loadData();
    } finally {
      setRefreshing(null);
    }
  };

  const toggleExpanded = (key: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  // Group by channel
  const grouped: GroupedChannel[] = [];
  for (const row of rows) {
    let group = grouped.find((g) => g.channel === row.channel);
    if (!group) {
      group = {
        channel: row.channel,
        label: CHANNEL_LABELS[row.channel as keyof typeof CHANNEL_LABELS] ?? row.channel,
        combos: [],
      };
      grouped.push(group);
    }
    group.combos.push(row);
  }

  if (loading) return null; // Don't flash a skeleton — just wait silently
  if (rows.length === 0) return null; // Hide entirely until there's something to show

  return (
    <div
      className="bg-[#FBFBFB] border border-white rounded-[20px] p-5"
      style={{ boxShadow: "0px 2px 16px 4px rgba(0,0,0,0.04)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {/* Sparkle icon */}
          <div className="w-6 h-6 rounded-md bg-[#EAEAFD] flex items-center justify-center flex-shrink-0">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
              <path
                d="M8 1l1.5 4.5L14 7l-4.5 1.5L8 13l-1.5-4.5L2 7l4.5-1.5L8 1z"
                fill="#6841E6"
              />
            </svg>
          </div>
          <h2 className="text-sm font-semibold text-[#141414]">Learned insights</h2>
        </div>
        <span className="text-[11px] text-[#605F63] bg-[#F3F4F6] px-2 py-0.5 rounded-full">
          {rows.length} {rows.length === 1 ? "pattern" : "patterns"}
        </span>
      </div>

      {/* Channel groups */}
      <div className="space-y-2">
        {grouped.map((group) => {
          const groupKey = group.channel;
          const isOpen = expanded.has(groupKey);
          const totalInsights = group.combos.reduce((n, c) => n + c.insights.length, 0);

          return (
            <div
              key={groupKey}
              className="border border-[#EAEAFD] rounded-[12px] overflow-hidden"
            >
              {/* Accordion header */}
              <button
                onClick={() => toggleExpanded(groupKey)}
                className="w-full flex items-center justify-between px-3 py-2.5 bg-white hover:bg-[#FAFAFA] transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-[12px] font-semibold text-[#141414]">
                    {group.label}
                  </span>
                  <span className="text-[10px] bg-[#EAEAFD] text-[#6841E6] px-1.5 py-0.5 rounded-full font-medium">
                    {totalInsights} rules
                  </span>
                </div>
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  fill="none"
                  className={`transition-transform text-[#B7B7B8] ${isOpen ? "rotate-180" : ""}`}
                >
                  <path
                    d="M2 4l4 4 4-4"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>

              {/* Expanded content */}
              {isOpen && (
                <div className="bg-white border-t border-[#F0F0F1] px-3 pb-3 pt-2 space-y-3">
                  {group.combos.map((combo) => {
                    const comboKey = `${combo.channel}:${combo.product}:${combo.userState}`;
                    const isRefreshing = refreshing === comboKey;
                    const productLabel =
                      PRODUCT_LABELS[combo.product as keyof typeof PRODUCT_LABELS] ??
                      combo.product;

                    return (
                      <div key={comboKey}>
                        {/* Sub-label (product / user state) */}
                        {(combo.product || combo.userState) && (
                          <p className="text-[10px] font-semibold text-[#B7B7B8] uppercase tracking-[0.4px] mb-1.5">
                            {[productLabel, combo.userState].filter(Boolean).join(" · ")}
                          </p>
                        )}

                        {/* Summary */}
                        {combo.summary && (
                          <p className="text-[12px] text-[#605F63] italic mb-2 leading-snug">
                            {combo.summary}
                          </p>
                        )}

                        {/* Insight bullets */}
                        <ul className="space-y-1.5 mb-2">
                          {combo.insights.map((insight, i) => (
                            <li key={i} className="flex gap-2 items-start">
                              <span
                                className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#6841E6] flex-shrink-0"
                                aria-hidden="true"
                              />
                              <span className="text-[12px] text-[#3F3F46] leading-snug">
                                {insight}
                              </span>
                            </li>
                          ))}
                        </ul>

                        {/* Footer: count + date + refresh */}
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-[#B7B7B8]">
                            From {combo.feedbackCount} feedback ·{" "}
                            {formatDate(combo.updatedAt)}
                          </span>
                          <button
                            onClick={() => handleRefresh(combo)}
                            disabled={isRefreshing}
                            className="flex items-center gap-1 text-[11px] font-medium text-[#6841E6] hover:text-[#5230c4] disabled:opacity-50 transition-colors"
                          >
                            <svg
                              width="10"
                              height="10"
                              viewBox="0 0 16 16"
                              fill="none"
                              className={isRefreshing ? "animate-spin" : ""}
                            >
                              <path
                                d="M13.5 8A5.5 5.5 0 112.5 8M2.5 8V4.5M2.5 4.5H6"
                                stroke="currentColor"
                                strokeWidth="1.6"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                            {isRefreshing ? "Analysing…" : "Re-analyse"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Subtle footer hint */}
      <p className="text-[10px] text-[#B7B7B8] mt-3 text-center leading-snug">
        Auto-updates every 5 ratings · Affects future generations
      </p>
    </div>
  );
}
