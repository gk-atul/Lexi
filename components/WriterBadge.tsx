"use client";

import { useSession, signOut } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

function ProfilePanel({ onClose }: { onClose: () => void }) {
  const { data: session } = useSession();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const isWriter = (session?.user as { isWriter?: boolean })?.isWriter;

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full mt-2 z-50 w-64 bg-white border border-[#E0E0E1] rounded-2xl overflow-hidden"
      style={{ boxShadow: "0px 8px 32px rgba(0,0,0,0.12)" }}
    >
      {/* User info */}
      <div className="px-4 py-4 border-b border-[#F0F0F1]">
        <div className="flex items-center gap-3">
          {session?.user?.image ? (
            <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0">
              <Image src={session.user.image} alt={session.user.name ?? ""} width={36} height={36} className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="w-9 h-9 rounded-full bg-[#6841E6] flex items-center justify-center text-white text-[13px] font-bold flex-shrink-0">
              {session?.user?.name?.[0] ?? "?"}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-[#141414] truncate">{session?.user?.name}</p>
            <p className="text-[11px] text-[#B7B7B8] truncate">{session?.user?.email}</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="px-2 py-2 space-y-0.5">
        <Link
          href="/history"
          onClick={onClose}
          className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-[#F7F7F8] transition-colors w-full"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="text-[#605F63]">
            <path d="M2 8a6 6 0 1 0 12 0A6 6 0 0 0 2 8z" stroke="currentColor" strokeWidth="1.4"/>
            <path d="M8 5v3.5l2 1.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
          <span className="text-[13px] text-[#141414]">History</span>
        </Link>

        {isWriter && (
          <Link
            href="/analytics"
            onClick={onClose}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-[#F7F7F8] transition-colors w-full"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="text-[#605F63]">
              <path d="M2 12l4-4 3 3 5-6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="text-[13px] text-[#141414]">Analytics</span>
          </Link>
        )}

        {isWriter && (
          <Link
            href="/learnings"
            onClick={onClose}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-[#F7F7F8] transition-colors w-full"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="text-[#605F63]">
              <path d="M8 1l1.5 4.5L14 7l-4.5 1.5L8 13l-1.5-4.5L2 7l4.5-1.5L8 1z" fill="currentColor"/>
            </svg>
            <span className="text-[13px] text-[#141414]">Learnings</span>
          </Link>
        )}
      </div>

      {/* Sign out */}
      <div className="px-2 py-2 border-t border-[#F0F0F1]">
        <button
          onClick={() => signOut()}
          className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-red-50 transition-colors w-full group"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="text-[#B7B7B8] group-hover:text-red-400">
            <path d="M6 2H3a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3M11 11l3-3-3-3M14 8H6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="text-[13px] text-[#605F63] group-hover:text-red-500 transition-colors">Sign out</span>
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
