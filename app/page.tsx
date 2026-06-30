"use client";

import { useState, useEffect } from "react";
import GeneratorForm, { GeneratorFormParams } from "@/components/GeneratorForm";
import OutputCards, { Variant } from "@/components/OutputCards";
import TovManager from "@/components/TovManager";
import PnFrameworkPicker from "@/components/PnFrameworkPicker";
import DripCalendar from "@/components/DripCalendar";
import { ScaledMockup } from "@/components/PhoneMockup";
import { Channel, PnFramework, CHANNEL_LABELS, PRODUCT_LABELS, USE_CASE_LABELS } from "@/lib/prompts";
import { GenerateParams } from "@/components/OutputCards";
import LearningPanel from "@/components/LearningPanel";
import WordRulesManager from "@/components/WordRulesManager";
import AnalyticsPanel from "@/components/AnalyticsPanel";
import WriterBadge from "@/components/WriterBadge";
import { useSession } from "next-auth/react";

interface ChannelResult {
  variants: Variant[];
  loading: boolean;
  error: string | null;
}

type Mode = "idle" | "drip" | "results";

const SESSION_KEY = "acko-gen-state";

export default function Home() {
  const { data: session } = useSession();
  const isWriter = (session?.user as { isWriter?: boolean })?.isWriter ?? false;

  const [mode, setMode] = useState<Mode>("idle");

  // Non-drip state
  const [channelResults, setChannelResults] = useState<Record<string, ChannelResult>>({});
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null);
  const [activeFramework, setActiveFramework] = useState<PnFramework | null>(null);
  const [lastParams, setLastParams] = useState<GeneratorFormParams | null>(null);

  // Drip state
  const [dripParams, setDripParams] = useState<GeneratorFormParams | null>(null);

  // Phone preview — what's shown in the left panel after generation
  const [preview, setPreview] = useState<{ channel: Channel; copy: string } | null>(null);

  // ── Restore state from sessionStorage on mount (survives sign-in redirect) ──
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(SESSION_KEY);
      if (saved) {
        const s = JSON.parse(saved);
        if (s.mode && s.mode !== "idle") {
          setMode(s.mode);
          setChannelResults(s.channelResults ?? {});
          setActiveChannel(s.activeChannel ?? null);
          setLastParams(s.lastParams ?? null);
          setPreview(s.preview ?? null);
          setDripParams(s.dripParams ?? null);
        }
      }
    } catch {
      // ignore malformed storage
    }
  }, []);

  // ── Persist state to sessionStorage whenever it changes ─────────────────────
  useEffect(() => {
    if (mode === "idle") {
      sessionStorage.removeItem(SESSION_KEY);
    } else {
      try {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify({
          mode, channelResults, activeChannel, lastParams, preview, dripParams,
        }));
      } catch {
        // storage full or unavailable — ignore
      }
    }
  }, [mode, channelResults, activeChannel, lastParams, preview, dripParams]);

  // ── Non-drip: generate for one channel ──────────────────────────────────────
  const generateChannel = async (
    params: GeneratorFormParams,
    ch: Channel,
    pnFramework?: PnFramework | null
  ) => {
    setChannelResults((prev) => ({
      ...prev,
      [ch]: { variants: [], loading: true, error: null },
    }));
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel: ch,
          product: params.lob,
          useCase: params.useCase,
          context: params.context,
          variantCount: params.variantCount,
          pnFramework: pnFramework ?? undefined,
          userDescription: params.userDescription || undefined,
          commType: params.commType || undefined,
          desiredAction: params.desiredAction || undefined,
          nonNegotiables: params.nonNegotiables || undefined,
          referenceText: params.referenceText || undefined,
          tone: params.tone !== "balanced" ? params.tone : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");
      setChannelResults((prev) => ({
        ...prev,
        [ch]: { variants: data.variants, loading: false, error: null },
      }));
      // Auto-set preview to first result that lands
      setPreview((prev) => prev ?? { channel: ch, copy: data.variants[0]?.copy ?? "" });
    } catch (err) {
      setChannelResults((prev) => ({
        ...prev,
        [ch]: { variants: [], loading: false, error: String(err) },
      }));
    }
  };

  // ── Form submit ────────────────────────────────────────────────────────────
  const handleFormGenerate = (params: GeneratorFormParams) => {
    setLastParams(params);
    setActiveFramework(null);
    setPreview(null);

    if (params.isDrip) {
      setDripParams(params);
      setMode("drip");
      return;
    }

    setMode("results");
    setChannelResults({});
    setActiveChannel(params.channels[0] ?? null);
    params.channels.forEach((ch) => generateChannel(params, ch, null));
  };

  const handleGoBack = () => {
    sessionStorage.removeItem(SESSION_KEY);
    setMode("idle");
    setPreview(null);
    setChannelResults({});
    setActiveChannel(null);
  };

  // ── PN framework re-generate ───────────────────────────────────────────────
  const handleFrameworkSelect = (framework: PnFramework) => {
    if (!lastParams || !activeChannel) return;
    setActiveFramework(framework);
    generateChannel(lastParams, activeChannel, framework);
  };

  // Update preview when switching channel tabs
  const handleChannelSwitch = (ch: Channel) => {
    setActiveChannel(ch);
    setActiveFramework(null);
    const copy = channelResults[ch]?.variants[0]?.copy;
    if (copy) setPreview({ channel: ch, copy });
  };

  const anyLoading = Object.values(channelResults).some((r) => r.loading);
  const shownResult = activeChannel ? channelResults[activeChannel] : null;
  const hasGenerated = mode !== "idle";

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex flex-col">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-[#E0E0E1] px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center gap-3">
          <div className="w-8 h-8 bg-[#6841E6] rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xs">A</span>
          </div>
          <div className="flex-1">
            <h1 className="text-[15px] font-semibold text-[#0A0A0A] leading-tight">
              ACKO Copy Generator
            </h1>
            <p className="text-xs text-[#605F63]">Tone of voice — powered</p>
          </div>
          <WriterBadge />
        </div>
      </header>

      {/* ── Main ─────────────────────────────────────────────────────────────── */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-8 items-start">

          {/* ── Left panel ──────────────────────────────────────────────────── */}
          <div className={`space-y-4 ${hasGenerated ? "sticky top-6 self-start" : ""}`}>
            {!hasGenerated ? (
              /* ── Idle: full form ─────────────────────────────────────────── */
              <>
                {isWriter && <TovManager />}
                {isWriter && <WordRulesManager />}
                {isWriter && <AnalyticsPanel />}
                <LearningPanel />
                <div
                  className="bg-[#FBFBFB] border border-white rounded-[20px] p-5"
                  style={{ boxShadow: "0px 2px 16px 4px rgba(0,0,0,0.04)" }}
                >
                  <h2 className="text-sm font-semibold text-[#141414] mb-4">Generate copy</h2>
                  <GeneratorForm onGenerate={handleFormGenerate} loading={anyLoading} />
                </div>
              </>
            ) : (
              /* ── Post-generation: Go back + phone mockup ─────────────────── */
              <>
                <button
                  onClick={handleGoBack}
                  className="flex items-center gap-2 text-[13px] font-medium text-[#605F63] hover:text-[#141414] transition-colors group"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="group-hover:-translate-x-0.5 transition-transform">
                    <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  New generation
                </button>

                {/* Phone mockup */}
                {preview ? (
                  <div
                    className="bg-[#FBFBFB] border border-white rounded-[20px] p-4 overflow-hidden"
                    style={{ boxShadow: "0px 2px 16px 4px rgba(0,0,0,0.04)" }}
                  >
                    <p className="text-[10px] font-semibold text-[#B7B7B8] uppercase tracking-[0.5px] mb-3">
                      Preview — {CHANNEL_LABELS[preview.channel] ?? preview.channel}
                    </p>
                    <ScaledMockup
                      channel={preview.channel}
                      copy={preview.copy}
                      containerWidth={368}
                    />
                  </div>
                ) : (
                  /* Empty state */
                  <div
                    className="bg-[#FBFBFB] border border-white rounded-[20px] p-6 flex flex-col items-center justify-center text-center"
                    style={{ minHeight: 220, boxShadow: "0px 2px 16px 4px rgba(0,0,0,0.04)" }}
                  >
                    <div className="w-10 h-10 rounded-full bg-[#EAEAFD] flex items-center justify-center mb-3">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <rect x="5" y="2" width="14" height="20" rx="3" stroke="#6841E6" strokeWidth="1.5" />
                        <circle cx="12" cy="18" r="1" fill="#6841E6" />
                      </svg>
                    </div>
                    <p className="text-[13px] font-medium text-[#605F63]">No preview yet</p>
                    <p className="text-[12px] text-[#B7B7B8] mt-1">Generate a PN or WA to preview it here</p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* ── Right panel ─────────────────────────────────────────────────── */}
          <div className="min-w-0">

            {/* Idle */}
            {mode === "idle" && (
              <div className="flex flex-col items-center justify-center h-64 text-[#B7B7B8] text-center">
                <svg className="w-12 h-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-sm">Fill in the form and hit generate</p>
              </div>
            )}

            {/* Drip calendar */}
            {mode === "drip" && dripParams && (
              <div
                className="bg-[#FBFBFB] border border-white rounded-[20px] p-5 overflow-hidden"
                style={{ boxShadow: "0px 2px 16px 4px rgba(0,0,0,0.04)" }}
              >
                <DripCalendar
                  totalDays={dripParams.dripDays}
                  channels={dripParams.channels}
                  lob={dripParams.lob}
                  useCase={dripParams.useCase}
                  context={dripParams.context}
                  variantCount={dripParams.variantCount}
                  onCellPreview={(ch, copy) => setPreview({ channel: ch, copy })}
                  userDescription={dripParams.userDescription || undefined}
                  commType={dripParams.commType || undefined}
                  desiredAction={dripParams.desiredAction || undefined}
                  nonNegotiables={dripParams.nonNegotiables || undefined}
                  referenceText={dripParams.referenceText || undefined}
                />
              </div>
            )}

            {/* Non-drip results */}
            {mode === "results" && lastParams && (
              <div className="space-y-4">
                {/* Channel tabs */}
                {lastParams.channels.length > 1 && (
                  <div className="flex gap-2 flex-wrap">
                    {lastParams.channels.map((ch) => {
                      const r = channelResults[ch];
                      const isActive = ch === activeChannel;
                      return (
                        <button
                          key={ch}
                          onClick={() => handleChannelSwitch(ch)}
                          className={`px-4 py-1.5 rounded-full text-[13px] font-medium border transition-all duration-150 active:scale-[0.97] flex items-center gap-1.5 ${
                            isActive
                              ? "bg-[#6841E6] text-white border-[#6841E6]"
                              : "bg-white text-[#605F63] border-[#E0E0E1] hover:border-[#6841E6] hover:text-[#6841E6]"
                          }`}
                        >
                          {CHANNEL_LABELS[ch]}
                          {r?.loading && (
                            <span className="w-2.5 h-2.5 border border-current border-t-transparent rounded-full animate-spin inline-block" />
                          )}
                          {!r?.loading && r?.variants.length ? (
                            <span className={`text-[10px] rounded-full px-1.5 py-0.5 ${isActive ? "bg-white/20 text-white" : "bg-[#EAEAFD] text-[#6841E6]"}`}>
                              {r.variants.length}
                            </span>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                )}

                {shownResult?.loading && (
                  <div className="flex flex-col items-center justify-center h-48 text-[#B7B7B8]">
                    <div className="w-8 h-8 border-2 border-[#6841E6] border-t-transparent rounded-full animate-spin mb-3" />
                    <p className="text-sm">Generating variants…</p>
                  </div>
                )}

                {shownResult?.error && !shownResult.loading && (
                  <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-[20px] p-4 text-sm text-[#DC2626]">
                    {shownResult.error}
                  </div>
                )}

                {activeChannel === "push" && shownResult?.variants.length && !shownResult.loading ? (
                  <PnFrameworkPicker
                    active={activeFramework}
                    loading={shownResult.loading}
                    onSelect={handleFrameworkSelect}
                  />
                ) : null}

                {shownResult?.variants.length && !shownResult.loading && activeChannel ? (
                  <OutputCards
                    variants={shownResult.variants}
                    channelKey={activeChannel}
                    channel={CHANNEL_LABELS[activeChannel]}
                    product={PRODUCT_LABELS[lastParams.lob]}
                    userState={USE_CASE_LABELS[lastParams.useCase]}
                    context={lastParams.context}
                    generateParams={{
                      product: lastParams.lob,
                      useCase: lastParams.useCase,
                      context: lastParams.context,
                      userDescription: lastParams.userDescription || undefined,
                      commType: lastParams.commType || undefined,
                      desiredAction: lastParams.desiredAction || undefined,
                      nonNegotiables: lastParams.nonNegotiables || undefined,
                      referenceText: lastParams.referenceText || undefined,
                      tone: lastParams.tone !== "balanced" ? lastParams.tone : undefined,
                      pnFramework: activeFramework,
                    } satisfies GenerateParams}
                    onPreview={(copy) => setPreview({ channel: activeChannel, copy })}
                  />
                ) : null}
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="text-center py-5 text-[12px] text-[#B7B7B8]">
        Made with ❤️ by the content team
      </footer>
    </div>
  );
}
