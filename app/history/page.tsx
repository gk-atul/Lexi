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
const PRODUCT_LABELS: Record<string, string> = {
  auto: "Auto", health: "Health", life: "Life", travel: "Travel",
};

function dayLabel(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  const weekAgo  = new Date(today); weekAgo.setDate(today.getDate() - 7);
  const itemDay  = new Date(d.getFullYear(), d.getMonth(), d.getDate());

  if (itemDay >= today)     return "Today";
  if (itemDay >= yesterday) return "Yesterday";
  if (itemDay >= weekAgo)   return "This week";
  return d.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}

export default function HistoryPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [copies, setCopies] = useState<UserCopy[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filters
  const [channelFilter, setChannelFilter] = useState("all");
  const [productFilter, setProductFilter] = useState("all");

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

  const filtered = copies.filter((c) => {
    if (channelFilter !== "all" && c.channel !== channelFilter) return false;
    if (productFilter !== "all" && c.product !== productFilter) return false;
    return true;
  });

  // Group by day label
  const groups: { label: string; items: UserCopy[] }[] = [];
  for (const copy of filtered) {
    const label = dayLabel(copy.created_at);
    const last = groups[groups.length - 1];
    if (last && last.label === label) {
      last.items.push(copy);
    } else {
      groups.push({ label, items: [copy] });
    }
  }

  // Available filter values from actual data
  const channels = [...new Set(copies.map((c) => c.channel).filter(Boolean))];
  const products = [...new Set(copies.map((c) => c.product).filter(Boolean))];

  if (status === "loading") return null;

  return (
    <div className="min-h-screen bg-[#F7F7F8]">
      {/* Header */}
      <header className="bg-white border-b border-[#F0F0F1] sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-1.5 text-[#B7B7B8] hover:text-[#6841E6] transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="text-[12px]">Back</span>
            </button>
            <span className="text-[#E0E0E1]">/</span>
            <span className="text-[13px] font-semibold text-[#141414]">My History</span>
          </div>
          {session?.user?.image && (
            <div className="w-7 h-7 rounded-full overflow-hidden">
              <Image src={session.user.image} alt={session.user.name ?? ""} width={28} height={28} className="w-full h-full object-cover" />
            </div>
          )}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-6">
        {/* Filters */}
        {!loading && copies.length > 0 && (
          <div className="flex items-center gap-2 mb-6 flex-wrap">
            {/* Channel filter */}
            <div className="flex items-center gap-1.5 bg-white border border-[#E0E0E1] rounded-full px-1 py-1">
              <button
                onClick={() => setChannelFilter("all")}
                className={`text-[11px] font-medium px-2.5 py-1 rounded-full transition-all ${channelFilter === "all" ? "bg-[#6841E6] text-white" : "text-[#605F63] hover:text-[#141414]"}`}
              >
                All channels
              </button>
              {channels.map((ch) => (
                <button
                  key={ch}
                  onClick={() => setChannelFilter(ch)}
                  className={`text-[11px] font-medium px-2.5 py-1 rounded-full transition-all ${channelFilter === ch ? "bg-[#6841E6] text-white" : "text-[#605F63] hover:text-[#141414]"}`}
                >
                  {CHANNEL_LABELS[ch] ?? ch}
                </button>
              ))}
            </div>

            {/* Product filter */}
            {products.length > 1 && (
              <div className="flex items-center gap-1.5 bg-white border border-[#E0E0E1] rounded-full px-1 py-1">
                <button
                  onClick={() => setProductFilter("all")}
                  className={`text-[11px] font-medium px-2.5 py-1 rounded-full transition-all ${productFilter === "all" ? "bg-[#6841E6] text-white" : "text-[#605F63] hover:text-[#141414]"}`}
                >
                  All LoB
                </button>
                {products.map((p) => (
                  <button
                    key={p}
                    onClick={() => setProductFilter(p)}
                    className={`text-[11px] font-medium px-2.5 py-1 rounded-full transition-all ${productFilter === p ? "bg-[#6841E6] text-white" : "text-[#605F63] hover:text-[#141414]"}`}
                  >
                    {PRODUCT_LABELS[p] ?? p}
                  </button>
                ))}
              </div>
            )}

            {/* Result count */}
            <span className="text-[11px] text-[#B7B7B8] ml-auto">
              {filtered.length} cop{filtered.length !== 1 ? "ies" : "y"}
            </span>
          </div>
        )}

        {loading && (
          <div className="flex justify-center py-24">
            <p className="text-[13px] text-[#B7B7B8]">Loading…</p>
          </div>
        )}

        {!loading && copies.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <p className="text-[13px] text-[#B7B7B8]">No copies yet — generate something first.</p>
            <button onClick={() => router.back()} className="text-[12px] text-[#6841E6] hover:underline">
              Go to generator →
            </button>
          </div>
        )}

        {!loading && filtered.length === 0 && copies.length > 0 && (
          <div className="flex justify-center py-16">
            <p className="text-[13px] text-[#B7B7B8]">No copies match the selected filters.</p>
          </div>
        )}

        {/* Grouped list */}
        {!loading && groups.length > 0 && (
          <div className="space-y-6">
            {groups.map(({ label, items }) => (
              <div key={label}>
                <p className="text-[11px] font-semibold text-[#B7B7B8] uppercase tracking-[0.5px] mb-3">{label}</p>
                <div className="space-y-2">
                  {items.map((c) => (
                    <div
                      key={c.id}
                      className="group bg-white rounded-2xl p-4 border border-[#F0F0F1] hover:border-[#C5B8FA] transition-all cursor-pointer"
                      style={{ boxShadow: "0px 1px 4px rgba(0,0,0,0.04)" }}
                      onClick={() => handleCopy(c.copy_text, c.id)}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        {c.channel && (
                          <span className="text-[10px] font-semibold text-[#6841E6] bg-[#EAEAFD] px-2 py-0.5 rounded-full">
                            {CHANNEL_LABELS[c.channel] ?? c.channel}
                          </span>
                        )}
                        {c.product && (
                          <span className="text-[10px] text-[#B7B7B8] font-medium capitalize">
                            {PRODUCT_LABELS[c.product] ?? c.product}
                          </span>
                        )}
                        <span className="text-[10px] text-[#B7B7B8] ml-auto">
                          {new Date(c.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <p className="text-[13px] text-[#141414] leading-relaxed">{c.copy_text}</p>
                      <p className="text-[11px] text-[#6841E6] mt-2 h-4 opacity-0 group-hover:opacity-100 transition-opacity font-medium">
                        {copiedId === c.id ? "✓ Copied to clipboard" : "Click to copy"}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
