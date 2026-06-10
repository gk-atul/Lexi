"use client";

import { useSession, signOut } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

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

function ProfilePanel({ onClose }: { onClose: () => void }) {
  const { data: session } = useSession();
  const [copies, setCopies] = useState<UserCopy[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/user-copies")
      .then((r) => r.json())
      .then((d) => setCopies(d.copies ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  function handleCopy(text: string, id: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    });
  }

  const isWriter = (session?.user as { isWriter?: boolean })?.isWriter;

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full mt-2 z-50 w-80 bg-white border border-[#E0E0E1] rounded-2xl overflow-hidden"
      style={{ boxShadow: "0px 8px 32px rgba(0,0,0,0.12)" }}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-[#F0F0F1] flex items-center gap-3">
        {session?.user?.image ? (
          <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0">
            <Image
              src={session.user.image}
              alt={session.user.name ?? "User"}
              width={36}
              height={36}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="w-9 h-9 rounded-full bg-[#6841E6] flex items-center justify-center text-white text-[13px] font-bold flex-shrink-0">
            {session?.user?.name?.[0] ?? "?"}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold text-[#141414] truncate">{session?.user?.name}</p>
          <p className="text-[11px] text-[#B7B7B8] truncate">{session?.user?.email}</p>
        </div>
        {isWriter && (
          <Link
            href="/analytics"
            onClick={onClose}
            className="text-[11px] font-semibold text-[#6841E6] bg-[#EAEAFD] hover:bg-[#DDD9FC] px-2 py-1 rounded-full transition-colors flex-shrink-0"
          >
            Analytics
          </Link>
        )}
      </div>

      {/* Copy history */}
      <div className="px-4 py-2.5">
        <p className="text-[10px] font-semibold text-[#B7B7B8] uppercase tracking-[0.5px] mb-2">Recent copies</p>
        {loading && <p className="text-[12px] text-[#B7B7B8] py-4 text-center">Loading…</p>}
        {!loading && copies.length === 0 && (
          <p className="text-[12px] text-[#B7B7B8] py-4 text-center">No copies yet — generate something!</p>
        )}
        {!loading && copies.length > 0 && (
          <div className="space-y-2 max-h-72 overflow-y-auto -mx-1 px-1">
            {copies.map((c) => (
              <div
                key={c.id}
                className="group relative bg-[#F7F7F8] hover:bg-[#F0EEFE] rounded-xl p-3 transition-colors cursor-pointer"
                onClick={() => handleCopy(c.copy_text, c.id)}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  {c.channel && (
                    <span className="text-[10px] font-medium text-[#6841E6] bg-[#EAEAFD] px-1.5 py-0.5 rounded-full">
                      {CHANNEL_LABELS[c.channel] ?? c.channel}
                    </span>
                  )}
                  {c.product && (
                    <span className="text-[10px] text-[#B7B7B8]">{c.product}</span>
                  )}
                  <span className="text-[10px] text-[#B7B7B8] ml-auto">
                    {new Date(c.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                  </span>
                </div>
                <p className="text-[12px] text-[#141414] leading-relaxed line-clamp-2">{c.copy_text}</p>
                <span className="absolute top-2 right-2 text-[10px] text-[#6841E6] opacity-0 group-hover:opacity-100 transition-opacity font-medium">
                  {copiedId === c.id ? "Copied!" : "Copy"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-[#F0F0F1]">
        <button
          onClick={() => signOut()}
          className="text-[12px] text-[#605F63] hover:text-red-500 transition-colors"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}

export default function WriterBadge() {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);

  if (status === "loading") return null;

  if (!session) {
    return (
      <Link
        href="/auth/signin"
        className="flex items-center gap-1.5 text-[12px] font-medium text-[#605F63] border border-[#E0E0E1] hover:border-[#6841E6] hover:text-[#6841E6] rounded-full px-3 py-1.5 transition-all"
      >
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
          <path d="M8 2a3 3 0 100 6 3 3 0 000-6zM3 13c0-2.761 2.239-5 5-5s5 2.239 5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        Log in
      </Link>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-8 h-8 rounded-full overflow-hidden ring-2 ring-transparent hover:ring-[#6841E6] transition-all flex-shrink-0 block"
      >
        {session.user?.image ? (
          <Image
            src={session.user.image}
            alt={session.user.name ?? "User"}
            width={32}
            height={32}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-[#6841E6] flex items-center justify-center text-white text-[12px] font-bold">
            {session.user?.name?.[0] ?? "?"}
          </div>
        )}
      </button>

      {open && <ProfilePanel onClose={() => setOpen(false)} />}
    </div>
  );
}
