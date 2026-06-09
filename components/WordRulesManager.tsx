"use client";

import { useEffect, useState } from "react";

interface WordRules {
  replacements: Record<string, string>;
  forbidden: string[];
}

export default function WordRulesManager() {
  const [open, setOpen] = useState(false);
  const [rules, setRules] = useState<WordRules>({ replacements: {}, forbidden: [] });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // New-row state
  const [newJargon, setNewJargon] = useState("");
  const [newPlain, setNewPlain] = useState("");
  const [newForbidden, setNewForbidden] = useState("");

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch("/api/word-rules")
      .then((r) => r.json())
      .then((d) => setRules(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open]);

  const save = async (updated: WordRules) => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/word-rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
      if (res.ok) {
        setMessage({ type: "success", text: "Saved" });
        setTimeout(() => setMessage(null), 2000);
      } else {
        setMessage({ type: "error", text: "Save failed" });
      }
    } finally {
      setSaving(false);
    }
  };

  const addReplacement = () => {
    const key = newJargon.trim().toLowerCase();
    const val = newPlain.trim().toLowerCase();
    if (!key || !val) return;
    const updated = { ...rules, replacements: { ...rules.replacements, [key]: val } };
    setRules(updated);
    save(updated);
    setNewJargon("");
    setNewPlain("");
  };

  const removeReplacement = (key: string) => {
    const { [key]: _, ...rest } = rules.replacements;
    const updated = { ...rules, replacements: rest };
    setRules(updated);
    save(updated);
  };

  const addForbidden = () => {
    const val = newForbidden.trim().toLowerCase();
    if (!val || rules.forbidden.includes(val)) return;
    const updated = { ...rules, forbidden: [...rules.forbidden, val] };
    setRules(updated);
    save(updated);
    setNewForbidden("");
  };

  const removeForbidden = (phrase: string) => {
    const updated = { ...rules, forbidden: rules.forbidden.filter((f) => f !== phrase) };
    setRules(updated);
    save(updated);
  };

  const replacementCount = Object.keys(rules.replacements).length;
  const forbiddenCount = rules.forbidden.length;

  return (
    <div
      className="bg-[#FBFBFB] border border-white rounded-[20px] p-5"
      style={{ boxShadow: "0px 2px 16px 4px rgba(0,0,0,0.04)" }}
    >
      {/* Header row */}
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full text-left"
      >
        <div>
          <h2 className="text-sm font-semibold text-[#141414]">Word rules</h2>
          {!open && (
            <p className="text-[11px] text-[#605F63] mt-0.5">
              {replacementCount} replacements · {forbiddenCount} forbidden phrases
            </p>
          )}
        </div>
        <svg
          width="14" height="14" viewBox="0 0 14 14" fill="none"
          className={`text-[#B7B7B8] transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path d="M2 4.5l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="mt-4 space-y-5">
          {loading ? (
            <p className="text-[12px] text-[#B7B7B8]">Loading…</p>
          ) : (
            <>
              {/* ── Replacements ───────────────────────────────────────────── */}
              <div>
                <p className="text-[11px] font-semibold text-[#605F63] uppercase tracking-[0.4px] mb-2">
                  Jargon → Plain English
                </p>
                <p className="text-[11px] text-[#B7B7B8] mb-3">
                  Applied in the prompt <em>and</em> post-processed in code — the model can&apos;t bypass these.
                </p>

                {/* Existing rows */}
                <div className="space-y-1.5 mb-3">
                  {Object.entries(rules.replacements)
                    .sort((a, b) => a[0].localeCompare(b[0]))
                    .map(([jargon, plain]) => (
                      <div key={jargon} className="flex items-center gap-2 group">
                        <span className="text-[12px] text-[#DC2626] bg-[#FEF2F2] rounded px-2 py-0.5 font-mono min-w-0 truncate">
                          {jargon}
                        </span>
                        <svg width="10" height="10" viewBox="0 0 12 12" fill="none" className="flex-shrink-0 text-[#B7B7B8]">
                          <path d="M2 6h8M7 3l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <span className="text-[12px] text-[#16A34A] bg-[#F0FDF4] rounded px-2 py-0.5 font-mono min-w-0 truncate flex-1">
                          {plain}
                        </span>
                        <button
                          onClick={() => removeReplacement(jargon)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-[#B7B7B8] hover:text-[#DC2626] flex-shrink-0"
                          title="Remove"
                        >
                          <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                            <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                          </svg>
                        </button>
                      </div>
                    ))}
                </div>

                {/* Add row */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newJargon}
                    onChange={(e) => setNewJargon(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addReplacement()}
                    placeholder="jargon word"
                    className="flex-1 min-w-0 text-[12px] border border-[#E0E0E1] rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#6841E6] bg-white placeholder-[#D0D0D1]"
                  />
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none" className="flex-shrink-0 text-[#B7B7B8]">
                    <path d="M2 6h8M7 3l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <input
                    type="text"
                    value={newPlain}
                    onChange={(e) => setNewPlain(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addReplacement()}
                    placeholder="plain English"
                    className="flex-1 min-w-0 text-[12px] border border-[#E0E0E1] rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#6841E6] bg-white placeholder-[#D0D0D1]"
                  />
                  <button
                    onClick={addReplacement}
                    disabled={!newJargon.trim() || !newPlain.trim()}
                    className="flex-shrink-0 w-7 h-7 rounded-lg bg-[#6841E6] disabled:bg-[#E0E0E1] flex items-center justify-center transition-colors"
                    title="Add replacement"
                  >
                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                      <path d="M6 1v10M1 6h10" stroke="white" strokeWidth="1.6" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* ── Forbidden phrases ──────────────────────────────────────── */}
              <div>
                <p className="text-[11px] font-semibold text-[#605F63] uppercase tracking-[0.4px] mb-2">
                  Forbidden phrases
                </p>
                <p className="text-[11px] text-[#B7B7B8] mb-3">
                  No automatic replacement — the model is told to rephrase the entire sentence.
                </p>

                <div className="flex flex-wrap gap-1.5 mb-3">
                  {rules.forbidden.map((phrase) => (
                    <span
                      key={phrase}
                      className="flex items-center gap-1 text-[11px] bg-[#FEF2F2] text-[#DC2626] rounded-full px-2.5 py-1 font-mono"
                    >
                      {phrase}
                      <button
                        onClick={() => removeForbidden(phrase)}
                        className="text-[#FECACA] hover:text-[#DC2626] transition-colors"
                        title="Remove"
                      >
                        <svg width="10" height="10" viewBox="0 0 14 14" fill="none">
                          <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                      </button>
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newForbidden}
                    onChange={(e) => setNewForbidden(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addForbidden()}
                    placeholder="phrase to ban"
                    className="flex-1 text-[12px] border border-[#E0E0E1] rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#6841E6] bg-white placeholder-[#D0D0D1]"
                  />
                  <button
                    onClick={addForbidden}
                    disabled={!newForbidden.trim()}
                    className="flex-shrink-0 w-7 h-7 rounded-lg bg-[#6841E6] disabled:bg-[#E0E0E1] flex items-center justify-center transition-colors"
                    title="Add phrase"
                  >
                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                      <path d="M6 1v10M1 6h10" stroke="white" strokeWidth="1.6" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Status */}
              {(saving || message) && (
                <p className={`text-[11px] ${message?.type === "error" ? "text-[#DC2626]" : "text-[#16A34A]"}`}>
                  {saving ? "Saving…" : message?.text}
                </p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
