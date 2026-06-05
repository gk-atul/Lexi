"use client";

import { useState } from "react";
import { Channel, Product, UseCase } from "@/lib/prompts";

const LOB_OPTIONS: { value: Product; label: string }[] = [
  { value: "auto", label: "Auto" },
  { value: "health", label: "Health" },
  { value: "travel", label: "Travel" },
  { value: "life", label: "Life" },
];

const CHANNEL_OPTIONS: { value: Channel; label: string; wip?: boolean }[] = [
  { value: "push", label: "PN" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "sms" as Channel, label: "SMS", wip: true },
  { value: "email", label: "Email" },
];

export interface GeneratorFormParams {
  lob: Product;
  isDrip: boolean;
  useCase: UseCase;
  dripDays: number;
  channels: Channel[];
  context: string;
  variantCount: number;
}

interface Props {
  onGenerate: (params: GeneratorFormParams) => void;
  loading: boolean;
}

export default function GeneratorForm({ onGenerate, loading }: Props) {
  const [lob, setLob] = useState<Product>("auto");
  const [isDrip, setIsDrip] = useState(false);
  const [useCase, setUseCase] = useState<UseCase>("promotional");
  const [dripDays, setDripDays] = useState(7);
  const [channels, setChannels] = useState<Channel[]>(["push"]);
  const [context, setContext] = useState("");
  const [variantCount, setVariantCount] = useState(3);

  const toggleChannel = (ch: Channel) => {
    setChannels((prev) =>
      prev.includes(ch) ? prev.filter((c) => c !== ch) : [...prev, ch]
    );
  };

  const canSubmit = channels.length > 0 && context.trim().length > 0 && !loading;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    onGenerate({ lob, isDrip, useCase, dripDays, channels, context, variantCount });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* ── Section 1: Line of Business ─────────────────────────────── */}
      <div>
        <p className="text-[11px] font-semibold text-[#605F63] uppercase tracking-[0.5px] mb-2">
          Line of business
        </p>
        <div className="flex flex-wrap gap-2">
          {LOB_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setLob(value)}
              className={`px-4 py-1.5 rounded-full text-[13px] font-medium border transition-all duration-150 active:scale-[0.97] ${
                lob === value
                  ? "bg-[#6841E6] text-white border-[#6841E6]"
                  : "bg-white text-[#605F63] border-[#E0E0E1] hover:border-[#6841E6] hover:text-[#6841E6]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Section 2: Drip journey ──────────────────────────────────── */}
      <div>
        <p className="text-[11px] font-semibold text-[#605F63] uppercase tracking-[0.5px] mb-0.5">
          Build a drip journey?
        </p>
        <p className="text-[12px] text-[#B7B7B8] mb-2">
          Drip journeys are comms sent at regular intervals
        </p>
        <div className="flex gap-2">
          {([{ v: false, label: "No" }, { v: true, label: "Yes" }] as const).map(({ v, label }) => (
            <button
              key={String(v)}
              type="button"
              onClick={() => setIsDrip(v)}
              className={`px-5 py-1.5 rounded-full text-[13px] font-medium border transition-all duration-150 active:scale-[0.97] ${
                isDrip === v
                  ? "bg-[#6841E6] text-white border-[#6841E6]"
                  : "bg-white text-[#605F63] border-[#E0E0E1] hover:border-[#6841E6] hover:text-[#6841E6]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Section 3: Use-case ──────────────────────────────────────── */}
      <div>
        <p className="text-[11px] font-semibold text-[#605F63] uppercase tracking-[0.5px] mb-2">
          Use-case
        </p>
        <div className="flex gap-2 mb-3">
          {(["promotional", "utility"] as UseCase[]).map((uc) => (
            <button
              key={uc}
              type="button"
              onClick={() => setUseCase(uc)}
              className={`px-4 py-1.5 rounded-full text-[13px] font-medium border transition-all duration-150 active:scale-[0.97] ${
                useCase === uc
                  ? "bg-[#6841E6] text-white border-[#6841E6]"
                  : "bg-white text-[#605F63] border-[#E0E0E1] hover:border-[#6841E6] hover:text-[#6841E6]"
              }`}
            >
              {uc.charAt(0).toUpperCase() + uc.slice(1)}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2">
          {(["promotional", "utility"] as UseCase[]).map((uc) => {
            const items =
              uc === "promotional"
                ? ["Drop-off re-engagement", "New campaigns & launches", "Engagement comms", "Offers & discounts"]
                : ["Renewals", "Service messages", "VAS messages", "Reward statements"];
            return (
              <div
                key={uc}
                className={`rounded-xl p-3 border transition-colors ${
                  useCase === uc
                    ? "border-[#D9D8FC] bg-[#F5F3FF]"
                    : "border-[#E0E0E1] bg-white"
                }`}
              >
                <p className="text-[11px] font-semibold text-[#6841E6] mb-1.5 capitalize">{uc}</p>
                <ul className="space-y-0.5">
                  {items.map((t) => (
                    <li key={t} className="text-[11px] text-[#605F63] flex gap-1.5">
                      <span className="text-[#B7B7B8] shrink-0">·</span>
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Section 4: Drip duration (conditional) ───────────────────── */}
      {isDrip && (
        <div>
          <p className="text-[11px] font-semibold text-[#605F63] uppercase tracking-[0.5px] mb-2">
            Journey duration
          </p>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min={2}
              max={90}
              value={dripDays}
              onChange={(e) =>
                setDripDays(Math.max(2, Math.min(90, Number(e.target.value) || 2)))
              }
              className="w-20 border border-[#E0E0E1] bg-white rounded-xl px-3 py-2 text-sm font-semibold text-[#141414] text-center focus:outline-none focus:border-[#6841E6] focus:ring-2 focus:ring-[#D9D8FC] transition-colors"
            />
            <span className="text-[13px] text-[#605F63]">days</span>
            <span className="text-[11px] text-[#B7B7B8]">(2–90)</span>
          </div>
        </div>
      )}

      {/* ── Section 5: Channels ──────────────────────────────────────── */}
      <div>
        <p className="text-[11px] font-semibold text-[#605F63] uppercase tracking-[0.5px] mb-2">
          Channels
        </p>
        <div className="flex flex-wrap gap-2">
          {CHANNEL_OPTIONS.map(({ value, label, wip }) => {
            const isSelected = channels.includes(value);
            if (wip) {
              return (
                <div
                  key={value}
                  title="Coming soon"
                  className="px-4 py-1.5 rounded-full text-[13px] font-medium border border-[#E0E0E1] bg-[#F5F5F5] text-[#B7B7B8] cursor-not-allowed select-none flex items-center gap-1.5"
                >
                  {label}
                  <span className="text-[9px] font-semibold uppercase tracking-wide bg-[#E0E0E1] text-[#B7B7B8] rounded-full px-1.5 py-0.5 leading-none">
                    Soon
                  </span>
                </div>
              );
            }
            return (
              <button
                key={value}
                type="button"
                onClick={() => toggleChannel(value)}
                className={`px-4 py-1.5 rounded-full text-[13px] font-medium border transition-all duration-150 active:scale-[0.97] ${
                  isSelected
                    ? "bg-[#6841E6] text-white border-[#6841E6]"
                    : "bg-white text-[#605F63] border-[#E0E0E1] hover:border-[#6841E6] hover:text-[#6841E6]"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
        {channels.length === 0 && (
          <p className="mt-1.5 text-[11px] text-[#DC2626]">Select at least one channel</p>
        )}
      </div>

      {/* ── Context / Problem statement ───────────────────────────────── */}
      <div>
        <label className="block text-[11px] font-semibold text-[#605F63] uppercase tracking-[0.5px] mb-2">
          Problem statement
        </label>
        <textarea
          value={context}
          onChange={(e) => setContext(e.target.value)}
          rows={3}
          placeholder="Describe the problem statement — e.g. user's auto policy expires in 3 days, 25% NCB at risk."
          className="w-full border border-[#E0E0E1] bg-white rounded-xl px-3 py-2.5 text-sm text-[#141414] placeholder-[#B7B7B8] focus:outline-none focus:border-[#6841E6] focus:ring-2 focus:ring-[#D9D8FC] transition-colors resize-none"
        />
      </div>

      {/* ── Submit + variant count ────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={!canSubmit}
          className="flex-1 bg-[#6841E6] text-white py-3 rounded-full font-semibold text-[15px] hover:bg-[#582FD2] active:bg-[#4E29BB] active:scale-[0.97] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Generating…" : isDrip ? "Build journey" : "Generate copy"}
        </button>
        <div className="flex items-center gap-1.5 shrink-0" title="Variants per cell">
          <span className="text-[12px] text-[#605F63]">×</span>
          <input
            type="number"
            min={1}
            max={5}
            value={variantCount}
            onChange={(e) =>
              setVariantCount(Math.max(1, Math.min(5, Number(e.target.value) || 1)))
            }
            className="w-10 border border-[#E0E0E1] bg-white rounded-lg px-1.5 py-1.5 text-sm font-semibold text-[#141414] text-center focus:outline-none focus:border-[#6841E6] transition-colors"
            title="Variants to generate"
          />
        </div>
      </div>

    </form>
  );
}
