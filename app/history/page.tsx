"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface UserCopy {
  id: string;
  channel: string;
  product: string;
  use_case: string;
  copy_text: string;
  created_at: string;
}

const CHANNEL_LABELS: Record<string, string> = {
  push: "Push", whatsapp: "WhatsApp", email: "Email", "in-app": "In-App",
};

export default function HistoryPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [copies, setCopies] = useState<UserCopy[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/signin");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/user-copies")
      .then((r) => r.json())
      .then((d) => setCopies(d.copies ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [status]);

  function handleCopy(text: string, id: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    });
  }

  if (status === "loading") return null;

  return (
    <div className="min-h-screen bg-[#F7F7F8]">
      {/* Header */}
      <header className="bg-white border-b border-[#F0F0F1] sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/" className="flex items-center gap-2 text-[#B7B7B8] hover:text-[#6841E6] transition-colors">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="text-[12px]">Generator</span>
            </a>
            <span className="text-[#E0E0E1]">/</span>
            <span className="text-[13px] font-semibold text-[#141414]">My History</span>
          </div>
          {session?.user?.image && (
            <div className="w-7 h-7 rounded-full overflow-hidden">
              <Image
                src={session.user.image}
                alt={session.user.name ?? ""}
                width={28}
                height={28}
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8">
        {loading && (
          <div className="flex justify-center py-24">
            <p className="text-[13px] text-[#B7B7B8]">Loading…</p>
          </div>
        )}

        {!loading && copies.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <p className="text-[13px] text-[#B7B7B8]">No copies yet — generate something first.</p>
            <a href="/" className="text-[12px] text-[#6841E6] hover:underline">Go to generator →</a>
          </div>
        )}

        {!loading && copies.length > 0 && (
          <div className="space-y-3">
            {copies.map((c) => (
              <div
                key={c.id}
                className="group bg-white rounded-2xl p-4 border border-[#F0F0F1] hover:border-[#C5B8FA] transition-all cursor-pointer"
                style={{ boxShadow: "0px 2px 8px rgba(0,0,0,0.04)" }}
                onClick={() => handleCopy(c.copy_text, c.id)}
              >
                <div className="flex items-center gap-2 mb-2">
                  {c.channel && (
                    <span className="text-[10px] font-semibold text-[#6841E6] bg-[#EAEAFD] px-2 py-0.5 rounded-full">
                      {CHANNEL_LABELS[c.channel] ?? c.channel}
                    </span>
                  )}
                  {c.product && (
                    <span className="text-[10px] text-[#B7B7B8] font-medium capitalize">{c.product}</span>
                  )}
                  <span className="text-[10px] text-[#B7B7B8] ml-auto">
                    {new Date(c.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                <p className="text-[13px] text-[#141414] leading-relaxed">{c.copy_text}</p>
                <p className="text-[11px] text-[#6841E6] mt-2 opacity-0 group-hover:opacity-100 transition-opacity font-medium">
                  {copiedId === c.id ? "✓ Copied" : "Click to copy"}
                </p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
