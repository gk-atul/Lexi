"use client";

import { useState } from "react";
import { exportToDoc } from "@/lib/export-doc";

interface CrmScores {
  key_hook: number;
  contextualisation: number;
  personalisation: number;
  user_first: number;
  cta_clarity: number;
  positive_tone: number;
  emotional_appeal: number;
  trust_building: number;
}

export interface Variant {
  copy: string;
  formula: string;
  tov_note: string;
  crm_scores: CrmScores;
  crm_total: number;
}

const CRM_LABELS: Record<keyof CrmScores, string> = {
  key_hook: "Key hook",
  contextualisation: "Contextualisation",
  personalisation: "Personalisation",
  user_first: "User-first",
  cta_clarity: "CTA clarity",
  positive_tone: "Positive tone",
  emotional_appeal: "Emotional appeal",
  trust_building: "Trust building",
};

// Weights must sum to 1.0 — computed here, never trusted from the model
const CRM_WEIGHTS: Record<keyof CrmScores, number> = {
  key_hook: 0.20,
  contextualisation: 0.15,
  personalisation: 0.15,
  user_first: 0.10,
  cta_clarity: 0.10,
  positive_tone: 0.10,
  emotional_appeal: 0.10,
  trust_building: 0.10,
};

function computeCrmTotal(scores: CrmScores): number {
  const total = (Object.keys(CRM_WEIGHTS) as (keyof CrmScores)[]).reduce(
    (sum, key) => sum + scores[key] * CRM_WEIGHTS[key],
    0
  );
  return Math.round(total * 10) / 10;
}

// ─── Shared status bar icons ─────────────────────────────────────────────────

function StatusIcons({ dark = false }: { dark?: boolean }) {
  const c = dark ? "#1a1a1a" : "white";
  return (
    <div className="flex items-center gap-1">
      <svg width="14" height="10" viewBox="0 0 14 10">
        <rect x="0" y="6" width="2" height="4" rx="0.5" fill={c} />
        <rect x="3" y="4" width="2" height="6" rx="0.5" fill={c} />
        <rect x="6" y="2" width="2" height="8" rx="0.5" fill={c} />
        <rect x="9" y="0" width="2" height="10" rx="0.5" fill={c} />
      </svg>
      <svg width="13" height="10" viewBox="0 0 13 10">
        <circle cx="6.5" cy="8" r="1" fill={c} />
        <path d="M3.5 6a4.5 4.5 0 015 0" stroke={c} strokeWidth="1.2" fill="none" strokeLinecap="round" />
        <path d="M1 3.5a8 8 0 0111 0" stroke={c} strokeWidth="1.2" fill="none" strokeLinecap="round" />
      </svg>
      <svg width="22" height="11" viewBox="0 0 22 11">
        <rect x="0.5" y="0.5" width="18" height="10" rx="2.5" stroke={c} strokeWidth="1" fill="none" />
        <rect x="1.5" y="1.5" width="15" height="8" rx="1.5" fill={c} />
        <path d="M19.5 3.5v4a2 2 0 000-4z" fill={c} />
      </svg>
    </div>
  );
}

// ─── Push notification phone preview ────────────────────────────────────────

function PushPreview({ copy }: { copy: string }) {
  const lines = copy.split("\n").filter(Boolean);
  const headline = lines[0] ?? "";
  const body = lines.slice(1).join(" ");

  // Figma spec: screen is 308×679. Outer shell adds 10px padding on each side → 328×699 shell.
  const SCREEN_W = 308;
  const SCREEN_H = 679;

  // Notification frame metrics (Figma)
  const FRAME_W = 287.23;
  const FRAME_LEFT = (SCREEN_W - FRAME_W) / 2 - 0.38; // ≈ 10.0

  return (
    <div className="flex justify-center my-4">
      {/* Outer phone shell — 328×699 so inner screen is exactly 308×679 */}
      <div
        style={{
          width: SCREEN_W + 20,
          height: SCREEN_H + 20,
          borderRadius: 56,
          background: "#1a1a1e",
          padding: 10,
          boxShadow: "0 32px 80px rgba(0,0,0,0.45), inset 0 0 0 1px rgba(255,255,255,0.08)",
          flexShrink: 0,
        }}
      >
        {/* Screen — exactly 308×679 per Figma */}
        <div
          style={{
            width: SCREEN_W,
            height: SCREEN_H,
            borderRadius: 46,
            overflow: "hidden",
            background: "linear-gradient(170deg, #8fb8cc 0%, #6899ae 35%, #4a7a90 65%, #3a6070 100%)",
            position: "relative",
          }}
        >
          {/* Dynamic Island */}
          <div
            style={{
              position: "absolute",
              top: 12,
              left: "50%",
              transform: "translateX(-50%)",
              width: 120,
              height: 34,
              background: "#0a0a0a",
              borderRadius: 20,
              zIndex: 10,
            }}
          />

          {/* Status bar — 287.2×25.6px at left:0 top:0; time at left:14.31 */}
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: 287.2,
              height: 25.6,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              paddingLeft: 14.31,
              paddingRight: 12,
            }}
          >
            <span
              style={{
                fontFamily: "Helvetica, Arial, sans-serif",
                fontSize: 12,
                fontWeight: 600,
                color: "white",
              }}
            >
              9:41
            </span>
            <StatusIcons />
          </div>

          {/* Lock icon — 29.6×31.2 at left:130 top:83.2 */}
          <div
            style={{
              position: "absolute",
              left: 130,
              top: 83.2,
              width: 29.6,
              height: 31.2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="22" height="26" viewBox="0 0 22 26" fill="none">
              <rect x="3" y="11" width="16" height="13" rx="3" fill="rgba(255,255,255,0.7)" />
              <path d="M7 11V8a4 4 0 018 0v3" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>

          {/* Large time — left:77.6 top:120, Helvetica 64px, white, letterSpacing:-0.0056px */}
          <div
            style={{
              position: "absolute",
              left: 77.6,
              top: 120,
              width: 125,
              height: 74,
              fontFamily: "Helvetica, Arial, sans-serif",
              fontSize: 64,
              fontWeight: 300,
              color: "white",
              letterSpacing: -0.0056,
              lineHeight: 1,
              display: "flex",
              alignItems: "center",
            }}
          >
            9:41
          </div>

          {/* Date — left:73.6 top:193.6, Helvetica 16.8px, white, letterSpacing:-1.83px */}
          <div
            style={{
              position: "absolute",
              left: 73.6,
              top: 193.6,
              width: 133,
              fontFamily: "Helvetica, Arial, sans-serif",
              fontSize: 16.8,
              fontWeight: 400,
              color: "white",
              letterSpacing: -1.83,
            }}
          >
            Tuesday, 23 June
          </div>

          {/* Notification frame — centered, top:253.6, width:287.23, height auto (expands to fit copy) */}
          <div
            style={{
              position: "absolute",
              left: FRAME_LEFT,
              top: 253.6,
              width: FRAME_W,
              padding: 6.13,
            }}
          >
            {/* Bubble — rgba(223,223,223,0.8), blur(11.49px), radius:12.26px */}
            <div
              style={{
                width: "100%",
                background: "rgba(223,223,223,0.8)",
                backdropFilter: "blur(11.49px)",
                WebkitBackdropFilter: "blur(11.49px)",
                borderRadius: 12.26,
                padding: "9.19px 10.72px 9.19px 6.89px",
                display: "flex",
                alignItems: "flex-start",
                gap: 8,
                boxSizing: "border-box",
              }}
            >
              {/* App icon — 40.98×40.31px */}
              <div
                style={{
                  width: 40.98,
                  height: 40.31,
                  borderRadius: 9,
                  background: "#E8192C",
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 2px 6px rgba(232,25,44,0.3)",
                  marginTop: 1,
                }}
              >
                <span style={{ color: "white", fontWeight: 700, fontSize: 14 }}>A</span>
              </div>

              {/* Text content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                {/* App name + timestamp row */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    marginBottom: 2,
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'Euclid Circular B', Helvetica, Arial, sans-serif",
                      fontSize: 10,
                      fontWeight: 600,
                      color: "#555555",
                      letterSpacing: "0.01em",
                      textTransform: "uppercase",
                    }}
                  >
                    ACKO
                  </span>
                  <span style={{ fontSize: 9, color: "#777", flexShrink: 0, marginLeft: 4 }}>now</span>
                </div>

                {/* Headline — Euclid Circular B 12px/500/#222222, full text, no truncation */}
                <p
                  style={{
                    fontFamily: "'Euclid Circular B', Helvetica, Arial, sans-serif",
                    fontSize: 12,
                    fontWeight: 500,
                    color: "#222222",
                    letterSpacing: "-0.02em",
                    lineHeight: "15px",
                    margin: "0 0 2px",
                  }}
                >
                  {headline}
                </p>

                {/* Body — Euclid Circular B 10px/400/#3F3F3F/line-height 13px */}
                {body && (
                  <p
                    style={{
                      fontFamily: "'Euclid Circular B', Helvetica, Arial, sans-serif",
                      fontSize: 10,
                      fontWeight: 400,
                      color: "#3F3F3F",
                      lineHeight: "13px",
                      margin: 0,
                    }}
                  >
                    {body}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Torch button — left:31.2 bottom:48, 40×40, semi-transparent rounded */}
          <div
            style={{
              position: "absolute",
              left: 31.2,
              bottom: 48,
              width: 40,
              height: 40,
              borderRadius: 20,
              background: "rgba(255,255,255,0.22)",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M9 3h6l1 6-3 2v10H11V11L8 9l1-6z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          {/* Camera button — left:217.6 bottom:48, 40×40, semi-transparent rounded */}
          <div
            style={{
              position: "absolute",
              left: 217.6,
              bottom: 48,
              width: 40,
              height: 40,
              borderRadius: 20,
              background: "rgba(255,255,255,0.22)",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <rect x="2" y="7" width="20" height="14" rx="3" stroke="white" strokeWidth="1.5" />
              <circle cx="12" cy="14" r="3.5" stroke="white" strokeWidth="1.5" />
              <path d="M8 7l1.5-3h5L16 7" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>

          {/* Home bar — width:108 height:4 left:90.4 bottom:14.4, white, radius:2 */}
          <div
            style={{
              position: "absolute",
              width: 108,
              height: 4,
              left: 90.4,
              bottom: 14.4,
              background: "white",
              borderRadius: 2,
            }}
          />
        </div>
      </div>
    </div>
  );
}

// ─── WhatsApp preview ────────────────────────────────────────────────────────

function WhatsAppPreview({ copy }: { copy: string }) {
  // Split by blank lines to get sections; each section may have internal \n for bullets
  const sections = copy.split(/\n\n+/).map((s) => s.trim()).filter(Boolean);

  // Last section is the CTA button if it's short and a single line
  const lastSection = sections[sections.length - 1] ?? "";
  const hasCtaButton = sections.length > 1 && lastSection.length < 50 && !lastSection.includes("\n");
  const cta = hasCtaButton ? lastSection : null;
  const contentSections = hasCtaButton ? sections.slice(0, -1) : sections;

  // Figma spec: screen 375×812. Outer shell adds 10px padding → 395×832 shell.
  const SCREEN_W = 375;
  const SCREEN_H = 812;
  const HEADER_H = 90;   // status bar 44 + nav 46
  const FOOTER_H = 71;   // input field 35.5 + home indicator 35.5

  // Frame 38292: left:9, bottom:104 from screen, width:314, height:604
  // Relative to chat area (which starts at HEADER_H, ends at SCREEN_H - FOOTER_H):
  const FRAME_BOTTOM_IN_CHAT = 104 - FOOTER_H; // = 33px from chat area bottom

  return (
    <div className="flex justify-center my-4">
      {/* Outer phone shell — 395×832 so inner screen is exactly 375×812 */}
      <div
        style={{
          width: SCREEN_W + 20,
          height: SCREEN_H + 20,
          borderRadius: 58,
          background: "#1a1a1e",
          padding: 10,
          boxShadow: "0 32px 80px rgba(0,0,0,0.45), inset 0 0 0 1px rgba(255,255,255,0.08)",
          flexShrink: 0,
        }}
      >
        {/* Screen — exactly 375×812 per Figma */}
        <div
          style={{
            width: SCREEN_W,
            height: SCREEN_H,
            borderRadius: 48,
            overflow: "hidden",
            position: "relative",
            background: "#ECE6DF",
          }}
        >
          {/* ── Top header — height:90, background:#085B53 ── */}
          <div
            style={{
              position: "absolute",
              left: 0, right: 0, top: 0,
              height: HEADER_H,
              background: "#085B53",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Status bar — height:44 */}
            <div style={{ position: "relative", height: 44, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              {/* Dynamic Island */}
              <div
                style={{
                  position: "absolute",
                  top: 8, left: "50%",
                  transform: "translateX(-50%)",
                  width: 120, height: 34,
                  background: "#0a0a0a",
                  borderRadius: 20,
                  zIndex: 10,
                }}
              />
              {/* Time — left:0, Inter 14px/400, white */}
              <span
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: 14,
                  fontWeight: 400,
                  color: "white",
                  letterSpacing: -0.28,
                  marginLeft: 0,
                  paddingLeft: 16,
                  zIndex: 11,
                }}
              >
                9:41
              </span>
              {/* Status icons */}
              <div style={{ paddingRight: 14, zIndex: 11 }}>
                <StatusIcons />
              </div>
            </div>

            {/* Nav bar — height:46, padding:3px 0 4px */}
            <div
              style={{
                height: 46,
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                padding: "3px 0 4px",
              }}
            >
              {/* Back chevron — width:41, padding:0 9.5px 0 12px */}
              <div
                style={{
                  width: 41,
                  height: 18.85,
                  display: "flex",
                  alignItems: "center",
                  padding: "0 9.5px 0 12px",
                  flexShrink: 0,
                }}
              >
                <svg width="11" height="19" viewBox="0 0 11 19" fill="none">
                  <path d="M10 1L2 9.5L10 18" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>

              {/* Business logo — 32×32, circle, #C4C4C4 */}
              <div
                style={{
                  width: 32, height: 32,
                  borderRadius: 16,
                  background: "#C4C4C4",
                  flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                <span style={{ color: "white", fontWeight: 700, fontSize: 13 }}>A</span>
              </div>

              {/* Name + verification — gap:7, margin-left:8 */}
              <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 7, marginLeft: 8 }}>
                {/* ACKO — Inter 500 18px uppercase white */}
                <span
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: 18,
                    fontWeight: 500,
                    color: "white",
                    textTransform: "uppercase",
                    lineHeight: "22px",
                  }}
                >
                  ACKO
                </span>
                {/* Verification badge — 18×18, #25D366, white checkmark */}
                <div
                  style={{
                    width: 18, height: 18,
                    borderRadius: 9,
                    background: "#25D366",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  <svg width="8" height="7" viewBox="0 0 9 8" fill="none">
                    <path d="M1 4L3.5 6.5L8 1.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* ── Chat area — top:90, bottom:71, background:#ECE6DF with pattern ── */}
          <div
            style={{
              position: "absolute",
              left: 0, right: 0,
              top: HEADER_H,
              bottom: FOOTER_H,
              background: "#ECE6DF",
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23c8bfb4' fill-opacity='0.2'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/svg%3E")`,
            }}
          >
            {/* Frame 38292 — left:9, bottom:33 (= 104-71), width:314, height:604 */}
            <div
              style={{
                position: "absolute",
                left: 9,
                bottom: FRAME_BOTTOM_IN_CHAT,
                width: 314,
                height: 604,
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                padding: 8,
                gap: 8,
              }}
            >
              {/* Whatsapp-template — width:298, white, border-radius:11px */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "flex-end",
                  padding: 4,
                  width: 298,
                  background: "#FFFFFF",
                  borderRadius: 11,
                  boxShadow: "0 1px 4px rgba(0,0,0,0.12)",
                }}
              >
                {/* Bubble — flex column, width:290 */}
                <div style={{ display: "flex", flexDirection: "column", width: 290 }}>
                  {/* Message body — section-aware rendering */}
                  <div style={{ padding: "8px 8px 4px", width: 266, maxWidth: 266 }}>
                    {contentSections.map((section, sIdx) => {
                      const isIntro = sIdx === 0;
                      const sectionLines = section.split("\n");
                      const isBulletSection = sectionLines.some((l) => /^[-•]\s/.test(l));

                      return (
                        <div key={sIdx} style={{ marginTop: sIdx > 0 ? 10 : 0 }}>
                          {isBulletSection ? (
                            // Bullet section
                            sectionLines.map((line, lIdx) => {
                              const isBullet = /^[-•]\s/.test(line);
                              const text = isBullet ? line.replace(/^[-•]\s*/, "") : line;
                              return (
                                <div
                                  key={lIdx}
                                  style={{
                                    display: "flex",
                                    gap: 5,
                                    marginTop: lIdx > 0 ? 3 : 0,
                                    fontFamily: "Roboto, sans-serif",
                                    fontSize: 13,
                                    fontWeight: 400,
                                    lineHeight: "17px",
                                    color: "#111",
                                  }}
                                >
                                  {isBullet && (
                                    <span style={{ flexShrink: 0, marginTop: 1 }}>•</span>
                                  )}
                                  <span>{text}</span>
                                </div>
                              );
                            })
                          ) : (
                            // Regular paragraph — intro is bold, rest is normal
                            <p
                              style={{
                                margin: 0,
                                fontFamily: "Roboto, sans-serif",
                                fontSize: isIntro ? 14 : 13,
                                fontWeight: isIntro ? 700 : 400,
                                lineHeight: isIntro ? "18px" : "17px",
                                color: "#111",
                              }}
                            >
                              {section}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Link (CTA) — width:290, height:44, padding:12px 10px */}
                  {cta && (
                    <div
                      style={{
                        position: "relative",
                        display: "flex",
                        flexDirection: "row",
                        justifyContent: "center",
                        alignItems: "center",
                        padding: "12px 10px",
                        gap: 8,
                        width: 290,
                        height: 44,
                      }}
                    >
                      {/* Line 1 separator — border:0.5px solid #DFDFE9 */}
                      <div
                        style={{
                          position: "absolute",
                          width: 298,
                          left: -4.1,
                          top: -0.2,
                          borderTop: "0.5px solid #DFDFE9",
                        }}
                      />
                      {/* External link icon */}
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ zIndex: 1 }}>
                        <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" stroke="#007AFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      {/* CTA text — Inter 500 13px #007AFF letter-spacing:-0.408px */}
                      <span
                        style={{
                          fontFamily: "Inter, sans-serif",
                          fontWeight: 500,
                          fontSize: 13,
                          lineHeight: "16px",
                          letterSpacing: -0.408,
                          color: "#007AFF",
                          zIndex: 1,
                        }}
                      >
                        {cta}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ── Bottom iOS WhatsApp UI — height:71, background:#F2F2F2 ── */}
          <div
            style={{
              position: "absolute",
              left: 0, right: 0, bottom: 0,
              height: FOOTER_H,
              background: "#F2F2F2",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Actions + Field — height:35.5, padding:3px 0 0 10px, gap:11 */}
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                padding: "3px 0 0 10px",
                gap: 11,
                height: 35.5,
              }}
            >
              {/* Plus icon — 22.2×22.2, #468CF7 */}
              <div style={{ width: 22.2, height: 22.2, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                  <circle cx="11" cy="11" r="11" fill="#468CF7" />
                  <path d="M11 6v10M6 11h10" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>

              {/* Message input — height:27, white, border:#C9C4BB, radius:15 */}
              <div
                style={{
                  flex: 1,
                  height: 27,
                  background: "#FFFFFF",
                  border: "0.4px solid #C9C4BB",
                  borderRadius: 15,
                  padding: "2px 6px 2px 12px",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <span style={{ fontSize: 12, color: "#aaa" }}>Message</span>
              </div>

              {/* Actions — camera + microphone, gap:12, padding:0 12px 0 5px */}
              <div style={{ display: "flex", flexDirection: "row", alignItems: "flex-start", padding: "0 12px 0 5px", gap: 12, flexShrink: 0 }}>
                {/* Camera icon — 22.36×22.36 */}
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <rect x="2" y="7" width="20" height="14" rx="3" stroke="#468CF7" strokeWidth="1.4" />
                  <circle cx="12" cy="14" r="3.5" stroke="#468CF7" strokeWidth="1.4" />
                  <path d="M8 7l1.5-3h5L16 7" stroke="#468CF7" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
                {/* Microphone icon — 23.17×23.17 */}
                <svg width="23" height="23" viewBox="0 0 24 24" fill="none">
                  <rect x="9" y="2" width="6" height="11" rx="3" stroke="#468CF7" strokeWidth="1.4" />
                  <path d="M5 12a7 7 0 0014 0" stroke="#468CF7" strokeWidth="1.4" strokeLinecap="round" />
                  <path d="M12 19v3" stroke="#468CF7" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
              </div>
            </div>

            {/* HomeIndicator — height:35.5, center, home bar: 134×5 #171717 radius:100 */}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "flex-end",
                height: 35.5,
                padding: "8px 129px",
              }}
            >
              <div style={{ width: 134, height: 5, background: "#171717", borderRadius: 100 }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── CRM score panel ─────────────────────────────────────────────────────────

function ScoreBar({ score }: { score: number }) {
  const pct = (score / 5) * 100;
  const color =
    score >= 4 ? "bg-[#22C55E]" : score >= 3 ? "bg-[#EAB308]" : "bg-[#EF4444]";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-[#E0E0E1] rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[12px] text-[#605F63] w-6 text-right">{score}</span>
    </div>
  );
}

function CrmPanel({ scores, total }: { scores: CrmScores; total: number }) {
  const [open, setOpen] = useState(false);
  const totalColor =
    total >= 4 ? "text-[#15803D]" : total >= 3 ? "text-[#A76406]" : "text-[#DC2626]";

  return (
    <div className="border-t border-[#E0E0E1] pt-3 mt-3">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full text-left"
      >
        <span className="text-[12px] font-medium text-[#605F63]">CRM score</span>
        <span className={`text-sm font-semibold ${totalColor}`}>
          {total.toFixed(1)} / 5 {open ? "▲" : "▼"}
        </span>
      </button>
      {open && (
        <div className="mt-3 space-y-2">
          {(Object.keys(scores) as (keyof CrmScores)[]).map((key) => (
            <div key={key}>
              <div className="text-[11px] text-[#605F63] mb-0.5">{CRM_LABELS[key]}</div>
              <ScoreBar score={scores[key]} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Output card ─────────────────────────────────────────────────────────────

interface CardProps {
  variant: Variant;
  index: number;
  isPush: boolean;
  isWhatsApp: boolean;
  channelKey: string;
  product: string;
  userState: string;
  context: string;
  onFeedbackChange?: () => void;
  onPreview?: (copy: string) => void;
}

function OutputCard({ variant, index, isPush, isWhatsApp, channelKey, product, userState, context, onFeedbackChange, onPreview }: CardProps) {
  const [edited, setEdited] = useState(variant.copy);
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [instruction, setInstruction] = useState("");
  const [refining, setRefining] = useState(false);
  const [refineError, setRefineError] = useState<string | null>(null);
  const [verdict, setVerdict] = useState<"good" | "bad" | null>(null);
  const [feedbackId, setFeedbackId] = useState<string | null>(null);
  const [feedbackPending, setFeedbackPending] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(edited);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRefine = async () => {
    if (!instruction.trim() || refining) return;
    setRefining(true);
    setRefineError(null);
    try {
      const res = await fetch("/api/refine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          copy: edited,
          instruction: instruction.trim(),
          channel: channelKey,
          product,
          userState,
          context,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setRefineError(data.error || "Refinement failed");
      } else {
        setEdited(data.copy);
        setInstruction("");
      }
    } catch {
      setRefineError("Network error. Please try again.");
    } finally {
      setRefining(false);
    }
  };

  const handleFeedback = async (v: "good" | "bad") => {
    // Toggle off if clicking the active verdict
    if (verdict === v && feedbackId) {
      setFeedbackPending(true);
      try {
        await fetch("/api/feedback", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: feedbackId }),
        });
        setVerdict(null);
        setFeedbackId(null);
        onFeedbackChange?.();
      } finally {
        setFeedbackPending(false);
      }
      return;
    }

    // Remove previous verdict if switching
    if (feedbackId) {
      await fetch("/api/feedback", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: feedbackId }),
      });
    }

    setFeedbackPending(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          verdict: v,
          copy: edited,
          channel: channelKey,
          product,
          userState,
          context,
          formula: variant.formula,
          tov_note: variant.tov_note,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setVerdict(v);
        setFeedbackId(data.entry.id);
        onFeedbackChange?.();
      }
    } finally {
      setFeedbackPending(false);
    }
  };

  return (
    <div
      className={`bg-[#FBFBFB] border rounded-[20px] p-5 transition-colors ${
        verdict === "good" ? "border-[#BBF7D0]" : verdict === "bad" ? "border-[#FECACA]" : "border-white"
      }`}
      style={{ boxShadow: "0px 2px 16px 4px rgba(0,0,0,0.04)" }}
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-[11px] font-semibold text-[#605F63] uppercase tracking-[0.5px]">
          Variant {index + 1}
        </span>
        <div className="flex gap-2 items-center">
          {/* Feedback buttons */}
          <div className="flex gap-1 mr-1">
            <button
              onClick={() => handleFeedback("good")}
              disabled={feedbackPending}
              title={verdict === "good" ? "Remove good rating" : "Mark as good"}
              className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all text-sm ${
                verdict === "good"
                  ? "bg-[#DCFCE7] text-[#16A34A] ring-1 ring-[#BBF7D0]"
                  : "bg-[#F5F5F5] text-[#B7B7B8] hover:bg-[#DCFCE7] hover:text-[#16A34A]"
              } disabled:opacity-40`}
            >
              👍
            </button>
            <button
              onClick={() => handleFeedback("bad")}
              disabled={feedbackPending}
              title={verdict === "bad" ? "Remove bad rating" : "Mark as bad"}
              className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all text-sm ${
                verdict === "bad"
                  ? "bg-[#FEE2E2] text-[#DC2626] ring-1 ring-[#FECACA]"
                  : "bg-[#F5F5F5] text-[#B7B7B8] hover:bg-[#FEE2E2] hover:text-[#DC2626]"
              } disabled:opacity-40`}
            >
              👎
            </button>
          </div>
          {(isPush || isWhatsApp) && onPreview && (
            <button
              onClick={() => onPreview(edited)}
              className="w-7 h-7 rounded-lg flex items-center justify-center bg-[#F5F5F5] text-[#B7B7B8] hover:bg-[#EAEAFD] hover:text-[#6841E6] transition-all"
              title="Preview on mockup"
            >
              <svg width="14" height="10" viewBox="0 0 20 14" fill="none">
                <path d="M1 7C1 7 4 1 10 1s9 6 9 6-3 6-9 6S1 7 1 7z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="10" cy="7" r="2.5" stroke="currentColor" strokeWidth="1.6"/>
              </svg>
            </button>
          )}
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="text-[12px] font-medium text-[#605F63] hover:text-[#0A0A0A] border border-[#E0E0E1] hover:border-[#B7B7B8] rounded-full px-3 py-1 transition-colors"
          >
            {isEditing ? "Done" : "Edit"}
          </button>
          <button
            onClick={handleCopy}
            className="text-[12px] font-medium text-white bg-[#6841E6] hover:bg-[#582FD2] active:bg-[#4E29BB] rounded-full px-3 py-1 transition-all duration-150"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>


      {isEditing ? (
        <textarea
          value={edited}
          onChange={(e) => setEdited(e.target.value)}
          rows={5}
          className="w-full text-[14px] text-[#141414] border border-[#E0E0E1] bg-white rounded-xl p-3 focus:outline-none focus:border-[#6841E6] focus:ring-2 focus:ring-[#D9D8FC] resize-none transition-colors"
        />
      ) : isPush ? (
        /* PN: headline + body with labels */
        <div className="space-y-2">
          {(() => {
            const lines = edited.split("\n").filter(Boolean);
            const hl = lines[0] ?? "";
            const bd = lines.slice(1).join(" ");
            const hlOver = hl.length > 33;
            const bdOver = bd.length > 75;
            return (
              <>
                <div>
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[10px] font-semibold text-[#605F63] uppercase tracking-[0.4px]">Headline</span>
                    <span className={`text-[10px] font-medium tabular-nums ${hlOver ? "text-[#DC2626]" : "text-[#B7B7B8]"}`}>{hl.length}/33</span>
                  </div>
                  <p className={`text-[14px] font-semibold leading-snug ${hlOver ? "text-[#DC2626]" : "text-[#141414]"}`}>{hl}</p>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[10px] font-semibold text-[#605F63] uppercase tracking-[0.4px]">Body</span>
                    <span className={`text-[10px] font-medium tabular-nums ${bdOver ? "text-[#DC2626]" : "text-[#B7B7B8]"}`}>{bd.length}/75</span>
                  </div>
                  <p className={`text-[14px] leading-relaxed ${bdOver ? "text-[#DC2626]" : "text-[#141414]"}`}>{bd}</p>
                </div>
              </>
            );
          })()}
        </div>
      ) : (
        <p className="text-[14px] text-[#141414] leading-relaxed whitespace-pre-wrap">
          {edited}
        </p>
      )}

      <CrmPanel scores={variant.crm_scores} total={computeCrmTotal(variant.crm_scores)} />

      {/* ── AI refine bar ─────────────────────────────────────────────────── */}
      <div className="mt-4 border-t border-[#E0E0E1] pt-3">
        <div
          className={`flex items-center gap-2 rounded-full border px-3 py-2 transition-colors ${
            refining
              ? "border-[#E0E0E1] bg-[#F5F5F5]"
              : "border-[#E0E0E1] bg-white hover:border-[#B7B7B8] focus-within:border-[#6841E6]"
          }`}
        >
          {/* Sparkle icon */}
          <svg
            width="14"
            height="14"
            viewBox="0 0 16 16"
            fill="none"
            className="flex-shrink-0"
            style={{ color: refining ? "#B7B7B8" : "#6841E6" }}
          >
            <path
              d="M8 1l1.5 4.5L14 7l-4.5 1.5L8 13l-1.5-4.5L2 7l4.5-1.5L8 1z"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinejoin="round"
              fill="currentColor"
              fillOpacity="0.15"
            />
          </svg>
          <input
            type="text"
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleRefine()}
            placeholder='Refine with AI… e.g. "make it shorter", "add urgency"'
            disabled={refining}
            className="flex-1 text-[13px] bg-transparent outline-none text-[#141414] placeholder-[#B7B7B8] disabled:text-[#B7B7B8]"
          />
          {refining ? (
            <div className="w-4 h-4 border-2 border-[#6841E6] border-t-transparent rounded-full animate-spin flex-shrink-0" />
          ) : (
            <button
              onClick={handleRefine}
              disabled={!instruction.trim()}
              className="flex-shrink-0 w-6 h-6 rounded-lg bg-[#6841E6] disabled:bg-[#E0E0E1] flex items-center justify-center transition-colors"
              title="Refine"
            >
              <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                <path d="M2 6h8M7 3l3 3-3 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}
        </div>
        {refineError && (
          <p className="mt-1 text-[11px] text-[#DC2626]">{refineError}</p>
        )}
      </div>
    </div>
  );
}

// ─── Output cards list ────────────────────────────────────────────────────────

interface FeedbackStats {
  total: number;
  good: number;
  bad: number;
}

interface Props {
  variants: Variant[];
  channelKey: string;
  channel: string;
  product: string;
  userState: string;
  context: string;
  onPreview?: (copy: string) => void;
}

export default function OutputCards({ variants, channelKey, channel, product, userState, context, onPreview }: Props) {
  const isPush = channelKey === "push";
  const isWhatsApp = channelKey === "whatsapp";
  const [stats, setStats] = useState<FeedbackStats | null>(null);
  const [exporting, setExporting] = useState(false);

  // Load stats once on mount, and refresh whenever a child signals a change
  const refreshStats = () => {
    fetch("/api/feedback")
      .then((r) => r.json())
      .then((d) => setStats(d.stats))
      .catch(() => {});
  };

  useState(() => { refreshStats(); });

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportToDoc({ channel, product, userState, context, variants });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[14px] font-semibold text-[#141414]">
          {variants.length} variant{variants.length !== 1 ? "s" : ""} —{" "}
          <span className="text-[#605F63] font-normal">
            {channel} · {product}
          </span>
        </h2>
        <div className="flex items-center gap-3">
          {stats && stats.total > 0 && (
            <div className="flex items-center gap-2 text-[11px] text-[#605F63]">
              <span title="Good examples in training bank" className="flex items-center gap-0.5">
                👍 <span className="font-semibold text-[#16A34A]">{stats.good}</span>
              </span>
              <span title="Bad examples in training bank" className="flex items-center gap-0.5">
                👎 <span className="font-semibold text-[#DC2626]">{stats.bad}</span>
              </span>
              <span className="text-[#E0E0E1]">·</span>
              <span className="text-[#605F63]">{stats.total} in bank</span>
            </div>
          )}
          {/* Export button */}
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-1.5 text-[12px] font-medium text-[#605F63] hover:text-[#141414] border border-[#E0E0E1] hover:border-[#B7B7B8] rounded-full px-3 py-1.5 transition-all disabled:opacity-50"
          >
            {exporting ? (
              <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                <path d="M8 1v9M5 7l3 3 3-3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 11v2a1 1 0 001 1h10a1 1 0 001-1v-2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
              </svg>
            )}
            {exporting ? "Exporting…" : "Export .doc"}
          </button>
        </div>
      </div>
      <div className="space-y-4">
        {variants.map((v, i) => (
          <OutputCard
            key={i}
            variant={v}
            index={i}
            isPush={isPush}
            isWhatsApp={isWhatsApp}
            channelKey={channelKey}
            product={product}
            userState={userState}
            context={context}
            onFeedbackChange={refreshStats}
            onPreview={onPreview}
          />

        ))}
      </div>
    </div>
  );
}
