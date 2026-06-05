"use client";

import { useEffect, useRef, useState } from "react";

interface TovMeta {
  version: string;
  updatedAt: string;
}

export default function TovManager() {
  const [meta, setMeta] = useState<TovMeta | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchMeta = async () => {
    const res = await fetch("/api/tov-meta");
    if (res.ok) setMeta(await res.json());
  };

  useEffect(() => {
    fetchMeta();
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
      setMessage({ type: "success", text: `ToV updated — ${data.charCount.toLocaleString()} characters loaded` });
      fetchMeta();
    } else {
      setMessage({ type: "error", text: data.error || "Upload failed" });
    }

    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const formattedDate = meta?.updatedAt && meta.updatedAt !== "Bundled with app"
    ? new Date(meta.updatedAt).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : meta?.updatedAt;

  return (
    <div
      className="bg-[#FBFBFB] border border-white rounded-[20px] p-4"
      style={{ boxShadow: '0px 2px 16px 4px rgba(0,0,0,0.04)' }}
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
