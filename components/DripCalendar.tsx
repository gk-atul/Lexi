"use client";

import { useState, useCallback } from "react";
import { Channel, Product, UseCase } from "@/lib/prompts";
import { Variant } from "@/components/OutputCards";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CellState {
  enabled: boolean;
  loading: boolean;
  variants: Variant[];
  error: string | null;
  expanded: boolean;
}

type DripPlan = Record<string, CellState>; // key: `${day}-${channel}`

const cellKey = (day: number, channel: Channel) => `${day}-${channel}`;

const CHANNEL_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  push:     { bg: "#EAEAFD", text: "#4E29BB", border: "#D9D8FC" },
  whatsapp: { bg: "#DCFCE7", text: "#15803D", border: "#BBF7D0" },
  email:    { bg: "#DBEAFE", text: "#1D4ED8", border: "#BFDBFE" },
  "in-app": { bg: "#FEF9C3", text: "#A76406", border: "#FDE047" },
};

const CHANNEL_SHORT: Record<string, string> = {
  push: "PN", whatsapp: "WA", email: "EM", "in-app": "IA",
};

const PN_HEADLINE_LIMIT = 33;
const PN_BODY_LIMIT = 75;

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  totalDays: number;
  channels: Channel[];
  lob: Product;
  useCase: UseCase;
  context: string;
  variantCount: number;
  onCellPreview?: (channel: Channel, copy: string) => void;
  userDescription?: string;
  commType?: string;
  desiredAction?: string;
  nonNegotiables?: string;
  referenceText?: string;
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function DripCalendar({
  totalDays,
  channels,
  lob,
  useCase,
  context,
  variantCount,
  onCellPreview,
  userDescription,
  commType,
  desiredAction,
  nonNegotiables,
  referenceText,
}: Props) {
  // Stable journey ID scoped to this DripCalendar mount — used by journey-memory Layer 2
  const [journeyId] = useState(() => crypto.randomUUID());
  const [localDays, setLocalDays] = useState(totalDays);
  const [editingDays, setEditingDays] = useState(false);

  const [plan, setPlan] = useState<DripPlan>(() => {
    const init: DripPlan = {};
    for (let d = 1; d <= totalDays; d++) {
      for (const ch of channels) {
        init[cellKey(d, ch)] = { enabled: false, loading: false, variants: [], error: null, expanded: false };
      }
    }
    return init;
  });

  const adjustDays = (delta: number) => {
    const next = Math.max(2, Math.min(90, localDays + delta));
    if (next === localDays) return;
    setLocalDays(next);
    setPlan((prev) => {
      const updated = { ...prev };
      if (delta > 0) {
        // Add new empty cells for each new day
        for (let d = localDays + 1; d <= next; d++) {
          for (const ch of channels) {
            updated[cellKey(d, ch)] = { enabled: false, loading: false, variants: [], error: null, expanded: false };
          }
        }
      } else {
        // Remove cells for days beyond the new count
        for (let d = next + 1; d <= localDays; d++) {
          for (const ch of channels) {
            delete updated[cellKey(d, ch)];
          }
        }
      }
      return updated;
    });
  };

  const toggleCell = (day: number, ch: Channel) => {
    setPlan((prev) => {
      const k = cellKey(day, ch);
      const cell = prev[k];
      if (cell.loading || cell.variants.length > 0) return prev;
      return { ...prev, [k]: { ...cell, enabled: !cell.enabled } };
    });
  };

  const toggleExpand = (day: number, ch: Channel) => {
    setPlan((prev) => {
      const k = cellKey(day, ch);
      const cell = prev[k];
      const nowExpanded = !cell.expanded;
      if (nowExpanded && cell.variants.length > 0) {
        onCellPreview?.(ch, cell.variants[0].copy);
      }
      return { ...prev, [k]: { ...cell, expanded: nowExpanded } };
    });
  };

  const generateCell = useCallback(
    async (day: number, ch: Channel, refineNote?: string) => {
      const k = cellKey(day, ch);
      setPlan((prev) => ({
        ...prev,
        [k]: { ...prev[k], loading: true, error: null, variants: [] },
      }));

      const effectiveContext = refineNote
        ? `${context}\n\nRefinement note: ${refineNote}`
        : context;

      try {
        const res = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            channel: ch, product: lob, useCase,
            context: effectiveContext, variantCount,
            dripDay: day, dripTotal: localDays,
            journeyId,
            userDescription: userDescription || undefined,
            commType: commType || undefined,
            desiredAction: desiredAction || undefined,
            nonNegotiables: nonNegotiables || undefined,
            referenceText: referenceText || undefined,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Generation failed");
        onCellPreview?.(ch, data.variants[0]?.copy ?? "");
        setPlan((prev) => ({
          ...prev,
          [k]: { ...prev[k], loading: false, variants: data.variants, enabled: true, expanded: true },
        }));
      } catch (err) {
        setPlan((prev) => ({
          ...prev,
          [k]: { ...prev[k], loading: false, error: String(err) },
        }));
      }
    },
    [lob, useCase, context, variantCount, localDays, journeyId, onCellPreview, userDescription, commType, desiredAction, nonNegotiables, referenceText]
  );

  const generateAll = async () => {
    const enabled = Object.entries(plan).filter(
      ([, c]) => c.enabled && !c.loading && c.variants.length === 0
    );
    await Promise.all(
      enabled.map(([key]) => {
        const [dayStr, ...chParts] = key.split("-");
        return generateCell(Number(dayStr), chParts.join("-") as Channel);
      })
    );
  };

  const enabledCount = Object.values(plan).filter((c) => c.enabled && c.variants.length === 0).length;
  const generatedCount = Object.values(plan).filter((c) => c.variants.length > 0).length;
  const anyLoading = Object.values(plan).some((c) => c.loading);
  const days = Array.from({ length: localDays }, (_, i) => i + 1);

  return (
    <div>
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="flex items-center gap-2">
            {editingDays ? (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => adjustDays(-1)}
                  disabled={localDays <= 2}
                  className="w-6 h-6 rounded-full border border-[#E0E0E1] flex items-center justify-center text-[#605F63] hover:border-[#6841E6] hover:text-[#6841E6] disabled:opacity-30 transition-colors text-[14px] leading-none"
                >−</button>
                <span className="text-[14px] font-semibold text-[#141414] w-14 text-center tabular-nums">
                  {localDays} days
                </span>
                <button
                  type="button"
                  onClick={() => adjustDays(1)}
                  disabled={localDays >= 90}
                  className="w-6 h-6 rounded-full border border-[#E0E0E1] flex items-center justify-center text-[#605F63] hover:border-[#6841E6] hover:text-[#6841E6] disabled:opacity-30 transition-colors text-[14px] leading-none"
                >+</button>
                <button
                  type="button"
                  onClick={() => setEditingDays(false)}
                  className="ml-1 text-[11px] font-medium text-[#6841E6] hover:text-[#582FD2] transition-colors"
                >Done</button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h2 className="text-[14px] font-semibold text-[#141414]">{localDays}-day drip journey</h2>
                <button
                  type="button"
                  onClick={() => setEditingDays(true)}
                  className="text-[#B7B7B8] hover:text-[#6841E6] transition-colors"
                  title="Edit journey length"
                >
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                    <path d="M11.5 2.5l2 2L5 13H3v-2L11.5 2.5z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            )}
          </div>
          <p className="text-[12px] text-[#605F63] mt-0.5">
            Toggle channels per day, then generate
          </p>
        </div>
        <div className="flex items-center gap-3">
          {generatedCount > 0 && (
            <span className="text-[11px] text-[#605F63]">
              {generatedCount} cell{generatedCount !== 1 ? "s" : ""} generated
            </span>
          )}
          <button
            onClick={generateAll}
            disabled={enabledCount === 0 || anyLoading}
            className="px-4 py-2 rounded-full bg-[#6841E6] text-white text-[13px] font-semibold hover:bg-[#582FD2] active:bg-[#4E29BB] active:scale-[0.97] transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {anyLoading ? "Generating…" : `Generate ${enabledCount > 0 ? enabledCount : "selected"}`}
          </button>
        </div>
      </div>

      {/* ── Channel legend ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-4 mb-5 flex-wrap">
        {channels.map((ch) => {
          const c = CHANNEL_COLORS[ch] ?? CHANNEL_COLORS["push"];
          return (
            <span key={ch} className="flex items-center gap-1.5 text-[11px] font-medium" style={{ color: c.text }}>
              <span className="w-2 h-2 rounded-full inline-block" style={{ background: c.text }} />
              {CHANNEL_SHORT[ch] ?? ch}
            </span>
          );
        })}
      </div>

      {/* ── Day rows ───────────────────────────────────────────────────────── */}
      <div className="space-y-3">
        {days.map((day) => (
          <DayRow
            key={day}
            day={day}
            totalDays={localDays}
            channels={channels}
            plan={plan}
            onToggle={toggleCell}
            onExpand={toggleExpand}
            onRegenerate={generateCell}
            onPreview={(ch, copy) => onCellPreview?.(ch, copy)}
          />
        ))}
      </div>
    </div>
  );
}

// ─── DayRow ───────────────────────────────────────────────────────────────────

interface DayRowProps {
  day: number;
  totalDays: number;
  channels: Channel[];
  plan: DripPlan;
  onToggle: (day: number, ch: Channel) => void;
  onExpand: (day: number, ch: Channel) => void;
  onRegenerate: (day: number, ch: Channel, refineNote?: string) => void;
  onPreview: (ch: Channel, copy: string) => void;
}

function DayRow({ day, totalDays, channels, plan, onToggle, onExpand, onRegenerate, onPreview }: DayRowProps) {
  const hasAny = channels.some((ch) => plan[cellKey(day, ch)]?.enabled);
  const hasGenerated = channels.some((ch) => plan[cellKey(day, ch)]?.variants.length > 0);

  return (
    <div
      className="rounded-[20px] border bg-[#FBFBFB] overflow-hidden transition-colors"
      style={{
        borderColor: hasGenerated ? "#D9D8FC" : hasAny ? "#E8E7FC" : "#EFEFEF",
        boxShadow: "0px 2px 12px 2px rgba(0,0,0,0.03)",
      }}
    >
      {/* Day header */}
      <div
        className="px-4 py-3 border-b flex items-center gap-3"
        style={{ borderColor: hasGenerated ? "#D9D8FC" : "#EFEFEF" }}
      >
        <span className="text-[12px] font-semibold text-[#605F63] uppercase tracking-[0.5px]">
          Day {day}
        </span>
        {day === 1 && (
          <span className="text-[10px] text-[#B7B7B8] bg-[#F5F5F5] rounded-full px-2 py-0.5">
            First touch
          </span>
        )}
        {day === totalDays && (
          <span className="text-[10px] text-[#B7B7B8] bg-[#F5F5F5] rounded-full px-2 py-0.5">
            Final touch
          </span>
        )}
      </div>

      {/* Channel cells — horizontal flex, each takes equal width */}
      <div className="p-3 flex gap-3">
        {channels.map((ch) => (
          <div key={ch} className="flex-1 min-w-0">
            <ChannelCell
              day={day}
              channel={ch}
              cell={plan[cellKey(day, ch)]}
              onToggle={() => onToggle(day, ch)}
              onExpand={() => onExpand(day, ch)}
              onRegenerate={(note) => onRegenerate(day, ch, note)}
              onPreview={() => onPreview(ch, plan[cellKey(day, ch)].variants[0]?.copy ?? "")}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── ChannelCell ──────────────────────────────────────────────────────────────

interface ChannelCellProps {
  day: number;
  channel: Channel;
  cell: CellState;
  onToggle: () => void;
  onExpand: () => void;
  onRegenerate: (refineNote?: string) => void;
  onPreview: () => void;
}

function ChannelCell({ channel, cell, onToggle, onExpand, onRegenerate, onPreview }: ChannelCellProps) {
  const colors = CHANNEL_COLORS[channel] ?? CHANNEL_COLORS["push"];
  const short = CHANNEL_SHORT[channel] ?? channel.toUpperCase();

  // Loading
  if (cell.loading) {
    return (
      <div className="rounded-xl px-3 py-2.5 flex items-center gap-2 border" style={{ background: colors.bg, borderColor: colors.border }}>
        <div className="w-3 h-3 rounded-full border-2 border-t-transparent animate-spin shrink-0"
          style={{ borderColor: colors.text, borderTopColor: "transparent" }} />
        <span className="text-[12px] font-medium truncate" style={{ color: colors.text }}>
          {short} · generating…
        </span>
      </div>
    );
  }

  // Generated
  if (cell.variants.length > 0) {
    const firstCopy = cell.variants[0]?.copy ?? "";
    const previewLine = firstCopy.split("\n")[0];
    const preview = previewLine.length > 60 ? previewLine.slice(0, 60) + "…" : previewLine;

    return (
      <div className="space-y-2">
        <div
          className="w-full rounded-xl px-3 py-2.5 border"
          style={{ background: colors.bg, borderColor: colors.border }}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-semibold" style={{ color: colors.text }}>{short} ✓</span>
            <div className="flex items-center gap-1">
              {/* Eye — preview on mockup */}
              <button
                onClick={(e) => { e.stopPropagation(); onPreview(); }}
                className="w-6 h-6 flex items-center justify-center rounded opacity-50 hover:opacity-100 transition-opacity"
                title="Preview on mockup"
                style={{ color: colors.text }}
              >
                <svg width="14" height="10" viewBox="0 0 20 14" fill="none">
                  <path d="M1 7C1 7 4 1 10 1s9 6 9 6-3 6-9 6S1 7 1 7z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="10" cy="7" r="2.5" stroke="currentColor" strokeWidth="1.6"/>
                </svg>
              </button>
              {/* Expand toggle */}
              <button
                onClick={onExpand}
                className="w-6 h-6 flex items-center justify-center rounded"
                style={{ color: colors.text }}
              >
                <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                  {cell.expanded
                    ? <path d="M1 6l3-4 3 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                    : <path d="M1 2l3 4 3-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                  }
                </svg>
              </button>
            </div>
          </div>
          <button onClick={onExpand} className="w-full text-left">
            <p className="text-[11px] text-[#605F63] leading-snug">{preview}</p>
          </button>
        </div>
        {cell.expanded && (
          <ExpandedCell cell={cell} channel={channel} colors={colors} onRegenerate={onRegenerate} />
        )}
      </div>
    );
  }

  // Not enabled
  if (!cell.enabled) {
    return (
      <button
        onClick={onToggle}
        className="w-full rounded-xl px-3 py-2.5 border border-dashed border-[#E0E0E1] bg-white text-[#B7B7B8] flex items-center gap-2 hover:border-[#6841E6] hover:text-[#6841E6] transition-all duration-150 active:scale-[0.97]"
      >
        <span className="text-[14px] leading-none">+</span>
        <span className="text-[12px] font-medium">{short}</span>
      </button>
    );
  }

  // Enabled / queued
  return (
    <button
      onClick={onToggle}
      className="w-full rounded-xl px-3 py-2.5 border flex items-center gap-2 transition-all duration-150 active:scale-[0.97]"
      style={{ background: colors.bg, borderColor: colors.border }}
    >
      <span className="w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0" style={{ background: colors.text }}>
        <svg width="7" height="7" viewBox="0 0 6 6" fill="none">
          <path d="M1.5 3h3M3 1.5v3" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      </span>
      <span className="text-[12px] font-medium" style={{ color: colors.text }}>{short} · queued</span>
      <span className="ml-auto text-[10px]" style={{ color: colors.text }}>✕</span>
    </button>
  );
}

// ─── ExpandedCell ─────────────────────────────────────────────────────────────

interface ExpandedCellProps {
  cell: CellState;
  channel: Channel;
  colors: { bg: string; text: string; border: string };
  onRegenerate: (refineNote?: string) => void;
}

function CharCount({ value, limit }: { value: string; limit: number }) {
  const over = value.length > limit;
  return (
    <span className="text-[10px] font-medium tabular-nums" style={{ color: over ? "#DC2626" : "#B7B7B8" }}>
      {value.length}/{limit}
    </span>
  );
}

function ExpandedCell({ cell, channel, colors, onRegenerate }: ExpandedCellProps) {
  const [selectedVariant, setSelectedVariant] = useState(0);
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedCopy, setEditedCopy] = useState<string | null>(null);
  const [refineNote, setRefineNote] = useState("");
  const [refining, setRefining] = useState(false);

  const variant = cell.variants[selectedVariant];
  const isPush = channel === "push";
  // editedCopy is per-variant; reset when switching variants
  const displayCopy = editedCopy ?? variant?.copy ?? "";
  const lines = displayCopy.split("\n").filter(Boolean);
  const headline = isPush ? (lines[0] ?? "") : null;
  const body = isPush ? lines.slice(1).join(" ") : null;

  const handleVariantSwitch = (i: number) => {
    setSelectedVariant(i);
    setEditedCopy(null);
    setIsEditing(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(displayCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRefine = async () => {
    if (!refineNote.trim()) return;
    setRefining(true);
    await onRegenerate(refineNote.trim());
    setRefineNote("");
    setRefining(false);
  };

  if (!variant) return null;

  return (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: "#E0E0E1", background: "#FFFFFF" }}>
      {/* Variant tabs */}
      {cell.variants.length > 1 && (
        <div className="flex gap-1.5 px-3 pt-3">
          {cell.variants.map((_, i) => (
            <button
              key={i}
              onClick={() => handleVariantSwitch(i)}
              className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full border transition-colors ${
                selectedVariant === i
                  ? "border-[#6841E6] bg-[#6841E6] text-white"
                  : "border-[#E0E0E1] text-[#605F63] hover:border-[#6841E6]"
              }`}
            >
              V{i + 1}
            </button>
          ))}
        </div>
      )}

      {/* Copy content */}
      <div className="px-3 py-3 space-y-3">
        {isEditing ? (
          <textarea
            value={editedCopy ?? displayCopy}
            onChange={(e) => setEditedCopy(e.target.value)}
            rows={isPush ? 3 : 6}
            className="w-full text-[13px] text-[#141414] border border-[#6841E6] bg-white rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#D9D8FC] resize-none transition-colors"
            autoFocus
          />
        ) : isPush ? (
          <>
            <div>
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[10px] font-semibold text-[#605F63] uppercase tracking-[0.4px]">Headline</span>
                <CharCount value={headline!} limit={PN_HEADLINE_LIMIT} />
              </div>
              <p className="text-[13px] font-semibold leading-snug break-words"
                style={{ color: headline!.length > PN_HEADLINE_LIMIT ? "#DC2626" : "#141414" }}>
                {headline}
              </p>
            </div>
            <div>
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[10px] font-semibold text-[#605F63] uppercase tracking-[0.4px]">Body</span>
                <CharCount value={body ?? ""} limit={PN_BODY_LIMIT} />
              </div>
              <p className="text-[13px] leading-relaxed break-words"
                style={{ color: (body ?? "").length > PN_BODY_LIMIT ? "#DC2626" : "#141414" }}>
                {body}
              </p>
            </div>
          </>
        ) : (
          <p className="text-[13px] text-[#141414] leading-relaxed whitespace-pre-wrap break-words">
            {displayCopy}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 px-3 pb-3">
        <button
          onClick={handleCopy}
          className="text-[12px] font-medium text-white rounded-full px-3 py-1.5 transition-all active:scale-[0.97]"
          style={{ background: colors.text }}
        >
          {copied ? "Copied!" : "Copy"}
        </button>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className={`text-[12px] font-medium border rounded-full px-3 py-1.5 transition-colors ${
            isEditing
              ? "border-[#6841E6] text-[#6841E6] bg-[#EAEAFD]"
              : "border-[#E0E0E1] text-[#605F63] hover:border-[#B7B7B8]"
          }`}
        >
          {isEditing ? "Done" : "Edit"}
        </button>
        <button
          onClick={() => onRegenerate()}
          className="text-[12px] font-medium text-[#605F63] border border-[#E0E0E1] rounded-full px-3 py-1.5 hover:border-[#B7B7B8] transition-colors"
        >
          Regenerate
        </button>
      </div>

      {/* Refine input */}
      <div className="border-t border-[#F0F0F1] px-3 py-3">
        <p className="text-[10px] text-[#B7B7B8] mb-1.5 font-medium uppercase tracking-[0.4px]">Improve this copy</p>
        <div className="flex gap-2 items-end">
          <textarea
            value={refineNote}
            onChange={(e) => setRefineNote(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleRefine(); }}
            placeholder="e.g. make it shorter, add more urgency…"
            rows={2}
            className="flex-1 text-[12px] text-[#141414] placeholder-[#B7B7B8] border border-[#E0E0E1] rounded-xl px-2.5 py-2 resize-none focus:outline-none focus:border-[#6841E6] focus:ring-1 focus:ring-[#D9D8FC] transition-colors leading-snug"
          />
          <button
            onClick={handleRefine}
            disabled={!refineNote.trim() || refining}
            className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-[0.95] disabled:opacity-40"
            style={{ background: colors.text }}
            title="Refine (⌘↵)"
          >
            {refining ? (
              <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <path d="M2 6.5h9M7.5 3l3.5 3.5L7.5 10" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {cell.error && (
        <div className="px-3 pb-3">
          <p className="text-[11px] text-[#DC2626]">{cell.error}</p>
        </div>
      )}
    </div>
  );
}
