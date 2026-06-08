"use client";

import { useState, useRef } from "react";
import { Channel, Product, UseCase, ToneDial } from "@/lib/prompts";

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

const TONE_OPTIONS: { value: ToneDial; label: string; hint: string }[] = [
  { value: "warm",     label: "Warm",     hint: "Empathetic, reassuring, slightly softer" },
  { value: "balanced", label: "Balanced", hint: "ACKO's default voice" },
  { value: "direct",   label: "Direct",   hint: "Sharper, fewer softeners, gets to the point" },
];

const COMM_TYPE_OPTIONS = [
  {
    value: "informational",
    label: "Informational",
    hint: "Explaining a benefit, policy detail, or process",
  },
  {
    value: "feature",
    label: "Feature",
    hint: "Introducing a new product, plan, or capability",
  },
  {
    value: "incentive",
    label: "Incentive",
    hint: "Discount, offer, or a reason to act now",
  },
] as const;

export type CommType = "informational" | "feature" | "incentive" | "";

export interface GeneratorFormParams {
  lob: Product;
  isDrip: boolean;
  useCase: UseCase;
  dripDays: number;
  channels: Channel[];
  userDescription: string;
  commType: CommType;
  context: string;
  desiredAction: string;
  nonNegotiables: string;
  referenceText: string;
  tone: ToneDial;
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
  const [userDescription, setUserDescription] = useState("");
  const [commType, setCommType] = useState<CommType>("");
  const [context, setContext] = useState("");
  const [desiredAction, setDesiredAction] = useState("");
  const [nonNegotiables, setNonNegotiables] = useState("");
  const [referenceText, setReferenceText] = useState("");
  const [tone, setTone] = useState<ToneDial>("balanced");
  const [variantCount, setVariantCount] = useState(3);
  const [showUserTip, setShowUserTip] = useState(false);
  const [refFileName, setRefFileName] = useState<string | null>(null);
  const [refExtracting, setRefExtracting] = useState(false);
  const [refError, setRefError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleChannel = (ch: Channel) => {
    setChannels((prev) =>
      prev.includes(ch) ? prev.filter((c) => c !== ch) : [...prev, ch]
    );
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setRefError(null);
    setRefFileName(file.name);

    // .txt and .md: read client-side
    if (file.name.endsWith(".txt") || file.name.endsWith(".md")) {
      const text = await file.text();
      setReferenceText(text.trim());
      return;
    }

    // .docx: extract server-side via mammoth
    if (file.name.endsWith(".docx")) {
      setRefExtracting(true);
      try {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/extract-reference", { method: "POST", body: fd });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Extraction failed");
        setReferenceText(data.text);
      } catch (err) {
        setRefError((err as Error).message);
        setRefFileName(null);
      } finally {
        setRefExtracting(false);
      }
      return;
    }

    // PDF and others: guide user to paste
    setRefFileName(null);
    setRefError("PDF files can't be read automatically. Please open the PDF and paste the relevant text below.");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const clearFile = () => {
    setRefFileName(null);
    setRefError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const canSubmit =
    channels.length > 0 &&
    userDescription.trim().length > 0 &&
    context.trim().length > 0 &&
    !loading;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    onGenerate({
      lob,
      isDrip,
      useCase,
      dripDays,
      channels,
      userDescription,
      commType,
      context,
      desiredAction,
      nonNegotiables,
      referenceText,
      tone,
      variantCount,
    });
  };

  const pillClass = (active: boolean) =>
    `px-4 py-1.5 rounded-full text-[13px] font-medium border transition-all duration-150 active:scale-[0.97] ${
      active
        ? "bg-[#6841E6] text-white border-[#6841E6]"
        : "bg-white text-[#605F63] border-[#E0E0E1] hover:border-[#6841E6] hover:text-[#6841E6]"
    }`;

  const textareaClass =
    "w-full border border-[#E0E0E1] bg-white rounded-xl px-3 py-2.5 text-sm text-[#141414] placeholder-[#B7B7B8] focus:outline-none focus:border-[#6841E6] focus:ring-2 focus:ring-[#D9D8FC] transition-colors resize-none";

  const labelClass =
    "text-[11px] font-semibold text-[#605F63] uppercase tracking-[0.5px]";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* ── Section 1: Line of Business ─────────────────────────────── */}
      <div>
        <p className={`${labelClass} mb-2`}>Line of business</p>
        <div className="flex flex-wrap gap-2">
          {LOB_OPTIONS.map(({ value, label }) => (
            <button key={value} type="button" onClick={() => setLob(value)} className={pillClass(lob === value)}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Section 2: Drip journey ──────────────────────────────────── */}
      <div>
        <p className={`${labelClass} mb-0.5`}>Build a drip journey?</p>
        <p className="text-[12px] text-[#B7B7B8] mb-2">Drip journeys are comms sent at regular intervals</p>
        <div className="flex gap-2">
          {([{ v: false, label: "No" }, { v: true, label: "Yes" }] as const).map(({ v, label }) => (
            <button key={String(v)} type="button" onClick={() => setIsDrip(v)} className={`px-5 py-1.5 rounded-full text-[13px] font-medium border transition-all duration-150 active:scale-[0.97] ${isDrip === v ? "bg-[#6841E6] text-white border-[#6841E6]" : "bg-white text-[#605F63] border-[#E0E0E1] hover:border-[#6841E6] hover:text-[#6841E6]"}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Section 3: Use-case ──────────────────────────────────────── */}
      <div>
        <p className={`${labelClass} mb-2`}>Use-case</p>
        <div className="flex gap-2 mb-3">
          {(["promotional", "utility"] as UseCase[]).map((uc) => (
            <button key={uc} type="button" onClick={() => setUseCase(uc)} className={pillClass(useCase === uc)}>
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
              <div key={uc} className={`rounded-xl p-3 border transition-colors ${useCase === uc ? "border-[#D9D8FC] bg-[#F5F3FF]" : "border-[#E0E0E1] bg-white"}`}>
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
          <p className={`${labelClass} mb-2`}>Journey duration</p>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min={2}
              max={90}
              value={dripDays}
              onChange={(e) => setDripDays(Math.max(2, Math.min(90, Number(e.target.value) || 2)))}
              className="w-20 border border-[#E0E0E1] bg-white rounded-xl px-3 py-2 text-sm font-semibold text-[#141414] text-center focus:outline-none focus:border-[#6841E6] focus:ring-2 focus:ring-[#D9D8FC] transition-colors"
            />
            <span className="text-[13px] text-[#605F63]">days</span>
            <span className="text-[11px] text-[#B7B7B8]">(2–90)</span>
          </div>
        </div>
      )}

      {/* ── Section 5: Channels ──────────────────────────────────────── */}
      <div>
        <p className={`${labelClass} mb-2`}>Channels</p>
        <div className="flex flex-wrap gap-2">
          {CHANNEL_OPTIONS.map(({ value, label, wip }) => {
            const isSelected = channels.includes(value);
            if (wip) {
              return (
                <div key={value} title="Coming soon" className="px-4 py-1.5 rounded-full text-[13px] font-medium border border-[#E0E0E1] bg-[#F5F5F5] text-[#B7B7B8] cursor-not-allowed select-none flex items-center gap-1.5">
                  {label}
                  <span className="text-[9px] font-semibold uppercase tracking-wide bg-[#E0E0E1] text-[#B7B7B8] rounded-full px-1.5 py-0.5 leading-none">Soon</span>
                </div>
              );
            }
            return (
              <button key={value} type="button" onClick={() => toggleChannel(value)} className={pillClass(isSelected)}>
                {label}
              </button>
            );
          })}
        </div>
        {channels.length === 0 && (
          <p className="mt-1.5 text-[11px] text-[#DC2626]">Select at least one channel</p>
        )}
      </div>

      {/* ── Section 6: Describe the user ────────────────────────────── */}
      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <label className={labelClass}>Describe the user</label>
          <div
            className="relative"
            onMouseEnter={() => setShowUserTip(true)}
            onMouseLeave={() => setShowUserTip(false)}
          >
            <button
              type="button"
              className="w-[18px] h-[18px] rounded-full border border-[#B7B7B8] text-[#B7B7B8] text-[10px] font-bold flex items-center justify-center leading-none hover:border-[#605F63] hover:text-[#605F63] transition-colors"
            >
              i
            </button>
            {showUserTip && (
              <div className="absolute left-6 top-0 z-20 w-72 bg-[#141414] text-white text-[12px] leading-[1.5] rounded-xl px-3.5 py-2.5 shadow-xl">
                <span className="text-[#B7B7B8]">&lsquo;Users due for renewal&rsquo;</span> produces generic output.{" "}
                <span className="font-semibold">&lsquo;Users with PPED-30 who haven&rsquo;t responded to the first renewal nudge&rsquo;</span>{" "}
                produces something usable.
              </div>
            )}
          </div>
        </div>
        <textarea
          value={userDescription}
          onChange={(e) => setUserDescription(e.target.value)}
          rows={2}
          placeholder="e.g. Existing health customers, PPED-30, haven't responded to the first renewal nudge. Name available, premium amount known."
          className={textareaClass}
          required
        />
      </div>

      {/* ── Section 7: Comm type ─────────────────────────────────────── */}
      <div>
        <p className={`${labelClass} mb-2`}>What is this comm for?</p>
        <div className="flex flex-wrap gap-2 mb-2">
          {COMM_TYPE_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setCommType(commType === value ? "" : value)}
              className={pillClass(commType === value)}
            >
              {label}
            </button>
          ))}
        </div>
        {commType && (
          <p className="text-[12px] text-[#605F63] italic">
            {COMM_TYPE_OPTIONS.find((o) => o.value === commType)?.hint}
          </p>
        )}
      </div>

      {/* ── Section 8: Problem statement ─────────────────────────────── */}
      <div>
        <label className={`block ${labelClass} mb-2`}>Why you&apos;re saying it</label>
        <textarea
          value={context}
          onChange={(e) => setContext(e.target.value)}
          rows={3}
          placeholder="The business objective and the user pain point. e.g. User's auto policy expires in 3 days, 25% NCB at risk. Goal: renewal conversion."
          className={textareaClass}
          required
        />
      </div>

      {/* ── Section 9: Desired action ────────────────────────────────── */}
      <div>
        <label className={`block ${labelClass} mb-2`}>What do you want the user to do?</label>
        <textarea
          value={desiredAction}
          onChange={(e) => setDesiredAction(e.target.value)}
          rows={2}
          placeholder="e.g. Tap to renew their policy. CTA: 'Renew now / Pay ₹4,200 / Continue renewal — pick whichever fits best.'"
          className={textareaClass}
        />
      </div>

      {/* ── Section 10: Non-negotiables ──────────────────────────────── */}
      <div>
        <label className={`block ${labelClass} mb-2`}>What&apos;s non-negotiable?</label>
        <textarea
          value={nonNegotiables}
          onChange={(e) => setNonNegotiables(e.target.value)}
          rows={2}
          placeholder="Mandatory elements (disclosures, specific numbers) or things to avoid (superlatives, emoji-free for claims, specific words to exclude)."
          className={textareaClass}
        />
      </div>

      {/* ── Section 11: Reference material ───────────────────────────── */}
      <div>
        <label className={`block ${labelClass} mb-2`}>Reference material</label>

        {/* File upload zone */}
        <div className="mb-2">
          {refFileName ? (
            <div className="flex items-center gap-2 px-3 py-2 bg-[#F5F3FF] border border-[#D9D8FC] rounded-xl text-[13px] text-[#6841E6] font-medium">
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="flex-1 truncate">{refFileName}</span>
              {refExtracting ? (
                <span className="text-[11px] text-[#605F63] font-normal">Extracting…</span>
              ) : (
                <button type="button" onClick={clearFile} className="text-[#B7B7B8] hover:text-[#DC2626] transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-3 py-2 border border-dashed border-[#E0E0E1] rounded-xl text-[13px] text-[#605F63] hover:border-[#6841E6] hover:text-[#6841E6] transition-colors w-full"
            >
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
              Attach a file (.docx or .txt)
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept=".docx,.txt,.md"
            className="hidden"
            onChange={handleFileUpload}
          />
        </div>

        {refError && (
          <p className="text-[11px] text-[#DC2626] mb-2">{refError}</p>
        )}

        <textarea
          value={referenceText}
          onChange={(e) => setReferenceText(e.target.value)}
          rows={3}
          placeholder="Paste reference text — past comms that worked, feature specs, USP wording, product notes…"
          className={textareaClass}
        />
      </div>

      {/* ── Section 12: Tone dial ────────────────────────────────────── */}
      <div>
        <p className={`${labelClass} mb-2`}>Tone</p>
        <div className="flex gap-2">
          {TONE_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setTone(value)}
              className={pillClass(tone === value)}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="mt-1.5 text-[12px] text-[#B7B7B8] italic">
          {TONE_OPTIONS.find((o) => o.value === tone)?.hint}
        </p>
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
            onChange={(e) => setVariantCount(Math.max(1, Math.min(5, Number(e.target.value) || 1)))}
            className="w-10 border border-[#E0E0E1] bg-white rounded-lg px-1.5 py-1.5 text-sm font-semibold text-[#141414] text-center focus:outline-none focus:border-[#6841E6] transition-colors"
            title="Variants to generate"
          />
        </div>
      </div>

    </form>
  );
}
