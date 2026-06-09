"use client";

import { useEffect, useRef, useState } from "react";

interface TovMeta {
  version: string;
  updatedAt: string;
}

interface ExtractionStatus {
  forbidden_words: number;
  core_principles: number;
}

export default function TovManager() {
  const [meta, setMeta] = useState<TovMeta | null>(null);
  const [extraction, setExtraction] = useState<ExtractionStatus | null>(null);
  const [uploading, setUploading] = useState(false);
  const [reparsing, setReparsing] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchMeta = async () => {
    const res = await fetch("/api/tov-meta");
    if (res.ok) setMeta(await res.json());
  };

  const fetchExtraction = async () => {
    const res = await fetch("/api/tov-rules");
    if (res.ok) {
      const data = await res.json();
      if (data.forbidden_words !== undefined) {
        setExtraction({
          forbidden_words: data.forbidden_words?.length ?? 0,
          core_principles: data.core_principles?.length ?? 0,
        });
      }
    }
  };

  useEffect(() => {
    fetchMeta();
    fetchExtraction();
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setMessage(null);

    const form = new FormData();
    form.append("file", file);
    form.append("version", file.name.replace(".docx", ""));

    const res = await fetch("/api/parse-tov", { method: "POST", body: form });
    const data = await res.json();

    if (res.ok) {
      setMessage({ type: "success", text: `ToV updated — ${data.charCount.toLocaleString()} characters loaded. Extracting rules…` });
      fetchMeta();
      // Poll for extraction result (it runs in background)
      setTimeout(async () => {
        await fetchExtraction();
        setMessage({ type: "success", text: "ToV updated and rules extracted." });
        setTimeout(() => setMessage(null), 3000);
      }, 8000);
    } else {
      setMessage({ type: "error", text: data.error || "Upload failed" });
    }

    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleReparse = async () => {
    setReparsing(true);
    setMessage(null);
    try {
      const res = await fetch("/api/parse-tov", { method: "PUT" });
      const data = await res.json();
      if (res.ok) {
        setExtraction({ forbidden_words: data.forbidden_words, core_principles: data.core_principles });
        setMessage({ type: "success", text: `Rules extracted — ${data.forbidden_words} forbidden words, ${data.core_principles} principles.` });
        setTimeout(() => setMessage(null), 4000);
      } else {
        setMessage({ type: "error", text: data.error || "Extraction failed" });
      }
    } finally {
      setReparsing(false);
    }
  };

  const formattedDate = meta?.updatedAt && meta.updatedAt !== "Bundled with app"
    ? new Date(meta.updatedAt).toLocaleDateString("en-IN", {
        day: "numeric", month: "short", year: "numeric",
      })
    : meta?.updatedAt;

  return (
    <div
      className="bg-[#FBFBFB] border border-white rounded-[20px] p-4"
      style={{ boxShadow: "0px 2px 16px 4px rgba(0,0,0,0.04)" }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-semibold text-[#605F63] uppercase tracking-wide mb-0.5">
            Active ToV guide
          </p>
          <p className="text-sm font-medium text-[#0A0A0A]">
            {meta?.version ?? "Loading…"}
          </p>
          {formattedDate && (
            <p className="text-xs text-[#605F63] mt-0.5">Updated {formattedDate}</p>
          )}
        </div>
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="text-xs font-medium text-[#6841E6] hover:text-[#582FD2] disabled:opacity-50 transition-colors"
        >
          {uploading ? "Uploading…" : "Replace"}
        </button>
      </div>

      {/* Extraction status row */}
      <div className="mt-3 flex items-center justify-between">
        {extraction ? (
          <p className="text-[11px] text-[#605F63]">
            <span className="text-[#16A34A] font-medium">{extraction.forbidden_words}</span> forbidden words ·{" "}
            <span className="text-[#6841E6] font-medium">{extraction.core_principles}</span> principles extracted
          </p>
        ) : (
          <p className="text-[11px] text-[#B7B7B8]">Rules not yet extracted</p>
        )}
        <button
          onClick={handleReparse}
          disabled={reparsing}
          title="Re-run rule extraction on the current ToV"
          className="text-[11px] font-medium text-[#605F63] hover:text-[#6841E6] disabled:opacity-40 transition-colors flex items-center gap-1"
        >
          {reparsing ? (
            <div className="w-3 h-3 border border-[#6841E6] border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
              <path d="M13.5 2.5A6.5 6.5 0 118 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M13.5 2.5V5.5H10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
          {reparsing ? "Extracting…" : "Re-parse"}
        </button>
      </div>

      {message && (
        <p
          className={`mt-3 text-xs rounded-xl px-3 py-2 ${
            message.type === "success"
              ? "bg-[#F0FDF4] text-[#15803D]"
              : "bg-[#FEF2F2] text-[#DC2626]"
          }`}
        >
          {message.text}
        </p>
      )}

      <input
        ref={fileRef}
        type="file"
        accept=".docx"
        onChange={handleUpload}
        className="hidden"
      />
    </div>
  );
}
