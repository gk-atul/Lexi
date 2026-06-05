"use client";

import React from "react";

// ─── PhoneMockup ────

// ─── Shared status bar icons ─────────────────────────────────────────────────

export function StatusIcons({ dark = false }: { dark?: boolean }) {
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

export function PushPreview({ copy }: { copy: string }) {
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
    <div style={{ display: "flex", justifyContent: "center" }}>
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

export function WhatsAppPreview({ copy }: { copy: string }) {
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
    <div style={{ display: "flex", justifyContent: "center" }}>
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

// ─── Email preview (Gmail-in-phone) ──────────────────────────────────────────

export function EmailPreview({ copy }: { copy: string }) {
  const allLines = copy.split("\n");
  // First non-empty line is subject
  const subjectRaw = allLines.find((l) => l.trim()) ?? "";
  const subject = subjectRaw.replace(/^subject:\s*/i, "").trim();
  // Remaining lines (after subject) form the body
  const subjectIdx = allLines.indexOf(subjectRaw);
  const bodyLines = allLines.slice(subjectIdx + 1);

  const SCREEN_W = 375;
  const SCREEN_H = 812;
  const HEADER_H = 44;
  const TOOLBAR_H = 48;
  const CHROME_H = HEADER_H + TOOLBAR_H; // 92px fixed chrome

  // Render body: groups of blank-line-separated paragraphs
  const renderBody = () => {
    // Collapse consecutive blank lines into a single paragraph gap
    const nodes: React.ReactNode[] = [];
    let firstContentSeen = false;

    bodyLines.forEach((line, i) => {
      const trimmed = line.trim();
      if (!trimmed) return; // blank lines = spacing handled by margin-bottom

      const isBullet = /^[-•*]\s/.test(trimmed);
      // CTA: text wrapped in [square brackets]
      const ctaMatch = trimmed.match(/^\[(.+)\]$/);

      if (ctaMatch) {
        nodes.push(
          <div key={i} style={{ marginTop: 20, marginBottom: 4 }}>
            <span style={{
              display: "inline-block",
              background: "#1a73e8",
              color: "#fff",
              fontFamily: "Helvetica, Arial, sans-serif",
              fontSize: 13,
              fontWeight: 600,
              padding: "9px 20px",
              borderRadius: 4,
              letterSpacing: 0.2,
            }}>
              {ctaMatch[1]}
            </span>
          </div>
        );
      } else if (isBullet) {
        const bulletText = trimmed.replace(/^[-•*]\s*/, "");
        nodes.push(
          <div key={i} style={{
            display: "flex",
            gap: 8,
            marginBottom: 6,
            fontFamily: "Helvetica, Arial, sans-serif",
            fontSize: 14,
            color: "#3c4043",
            lineHeight: "20px",
          }}>
            <span style={{ flexShrink: 0, color: "#5f6368" }}>•</span>
            <span>{bulletText}</span>
          </div>
        );
      } else {
        // Regular paragraph — first body paragraph is bold (opener)
        const isOpener = !firstContentSeen;
        firstContentSeen = true;
        // Check if previous output was also a bullet — add top spacing after bullet groups
        const prevNode = nodes[nodes.length - 1] as React.ReactElement<{ style?: React.CSSProperties }> | undefined;
        const prevWasBullet = prevNode?.props?.style?.display === "flex";
        nodes.push(
          <p key={i} style={{
            margin: `${prevWasBullet ? 12 : 0}px 0 12px`,
            fontFamily: "Helvetica, Arial, sans-serif",
            fontSize: 14,
            fontWeight: isOpener ? 700 : 400,
            color: isOpener ? "#202124" : "#3c4043",
            lineHeight: "20px",
          }}>
            {trimmed}
          </p>
        );
      }
    });

    return nodes;
  };

  return (
    <div style={{ display: "flex", justifyContent: "center" }}>
      {/* Phone shell */}
      <div style={{
        width: SCREEN_W + 20,
        height: SCREEN_H + 20,
        borderRadius: 58,
        background: "#1a1a1e",
        padding: 10,
        boxShadow: "0 32px 80px rgba(0,0,0,0.45), inset 0 0 0 1px rgba(255,255,255,0.08)",
        flexShrink: 0,
      }}>
        {/* Screen */}
        <div style={{
          width: SCREEN_W,
          height: SCREEN_H,
          borderRadius: 48,
          overflow: "hidden",
          background: "#fff",
          position: "relative",
          display: "flex",
          flexDirection: "column",
        }}>

          {/* ── Fixed chrome: status bar + toolbar ── */}
          <div style={{ flexShrink: 0 }}>
            {/* Status bar */}
            <div style={{
              height: HEADER_H,
              background: "#fff",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              paddingLeft: 16, paddingRight: 16,
              position: "relative",
            }}>
              <div style={{
                position: "absolute", top: 8, left: "50%",
                transform: "translateX(-50%)",
                width: 120, height: 34, background: "#0a0a0a", borderRadius: 20,
              }} />
              <span style={{ fontFamily: "Helvetica, Arial, sans-serif", fontSize: 14, fontWeight: 600, color: "#000", zIndex: 11 }}>9:41</span>
              <div style={{ zIndex: 11 }}><StatusIcons dark /></div>
            </div>

            {/* Gmail toolbar */}
            <div style={{
              height: TOOLBAR_H,
              background: "#fff",
              borderBottom: "1px solid #e8eaed",
              display: "flex", alignItems: "center",
              paddingLeft: 8, paddingRight: 16, gap: 4,
            }}>
              {/* Back — more padding so it's easy to hit */}
              <div style={{ padding: "8px 10px", display: "flex", alignItems: "center" }}>
                <svg width="10" height="17" viewBox="0 0 10 17" fill="none">
                  <path d="M8.5 1.5L1.5 8.5l7 7" stroke="#444" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div style={{ flex: 1 }} />
              {/* Archive */}
              <div style={{ padding: "8px 10px" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <rect x="2" y="4" width="20" height="4" rx="1" stroke="#5f6368" strokeWidth="1.5"/>
                  <path d="M4 8v11a1 1 0 001 1h14a1 1 0 001-1V8" stroke="#5f6368" strokeWidth="1.5"/>
                  <path d="M9 13h6" stroke="#5f6368" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
              {/* Delete */}
              <div style={{ padding: "8px 10px" }}>
                <svg width="18" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="#5f6368" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              {/* More (3-dot vertical) */}
              <div style={{ padding: "8px 10px" }}>
                <svg width="4" height="18" viewBox="0 0 4 20" fill="none">
                  <circle cx="2" cy="2" r="1.8" fill="#5f6368"/>
                  <circle cx="2" cy="10" r="1.8" fill="#5f6368"/>
                  <circle cx="2" cy="18" r="1.8" fill="#5f6368"/>
                </svg>
              </div>
            </div>
          </div>

          {/* ── Scrollable email content ── */}
          <div style={{ flex: 1, overflowY: "auto", background: "#fff" }}>
            {/* Subject + sender header — flows naturally, not fixed height */}
            <div style={{ padding: "16px 16px 12px", borderBottom: "1px solid #e8eaed" }}>
              {/* Subject */}
              <p style={{
                margin: "0 0 12px",
                fontSize: 20,
                fontWeight: 700,
                color: "#202124",
                fontFamily: "Helvetica, Arial, sans-serif",
                lineHeight: 1.25,
              }}>{subject}</p>

              {/* Sender row */}
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 16, background: "#E8192C",
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  <span style={{ color: "white", fontWeight: 700, fontSize: 13 }}>A</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: "0 0 1px", fontSize: 13, fontWeight: 600, color: "#202124", fontFamily: "Helvetica, Arial, sans-serif" }}>ACKO Insurance</p>
                  <p style={{ margin: 0, fontSize: 12, color: "#5f6368", fontFamily: "Helvetica, Arial, sans-serif" }}>
                    to me
                    <span style={{ color: "#bbb", marginLeft: 4 }}>›</span>
                  </p>
                </div>
                <span style={{ fontSize: 12, color: "#5f6368", fontFamily: "Helvetica, Arial, sans-serif", flexShrink: 0 }}>now</span>
              </div>
            </div>

            {/* Body */}
            <div style={{ padding: "20px 16px 32px" }}>
              {renderBody()}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

// ─── ScaledMockup ────────────────────────────────────────────────────────────

interface ScaledMockupProps {
  channel: "push" | "whatsapp" | string;
  copy: string;
  containerWidth?: number; // default 380
  maxHeight?: number;       // default 480 — keeps it within one viewport
}

export function ScaledMockup({ channel, copy, containerWidth = 380, maxHeight = 480 }: ScaledMockupProps) {
  // Exact phone shell dimensions (SCREEN + 20px padding each side, no extra margin)
  const phoneW = channel === "whatsapp" ? 395 : channel === "email" ? 395 : 328;
  const phoneH = channel === "whatsapp" ? 832 : channel === "email" ? 832 : 699;
  const scaleByW = (containerWidth - 16) / phoneW;
  const scaleByH = maxHeight / phoneH;
  const scale = Math.min(1, scaleByW, scaleByH);
  return (
    <div
      style={{
        width: "100%",
        height: phoneH * scale,
        overflow: "hidden",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: phoneW,
          height: phoneH,
          transform: `scale(${scale})`,
          transformOrigin: "top center",
          flexShrink: 0,
        }}
      >
        {channel === "whatsapp" ? (
          <WhatsAppPreview copy={copy} />
        ) : channel === "email" ? (
          <EmailPreview copy={copy} />
        ) : (
          <PushPreview copy={copy} />
        )}
      </div>
    </div>
  );
}
