"use client";

import { useSession, signOut } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";

export default function WriterBadge() {
  const { data: session, status } = useSession();

  if (status === "loading") return null;

  // Not signed in via Google — show Log in link to admin dashboard
  if (!session) {
    return (
      <Link
        href="/login"
        className="flex items-center gap-1.5 text-[12px] font-medium text-[#605F63] border border-[#E0E0E1] hover:border-[#6841E6] hover:text-[#6841E6] rounded-full px-3 py-1.5 transition-all"
      >
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
          <path d="M8 2a3 3 0 100 6 3 3 0 000-6zM3 13c0-2.761 2.239-5 5-5s5 2.239 5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        Log in
      </Link>
    );
  }

  // Signed in via Google
  const isWriter = (session?.user as { isWriter?: boolean })?.isWriter;
  return (
    <div className="flex items-center gap-2">
      {/* Writer badge or viewer label */}
      {isWriter ? (
        <span className="text-[11px] font-semibold text-[#6841E6] bg-[#EAEAFD] px-2 py-0.5 rounded-full">
          ✦ Writer
        </span>
      ) : (
        <span className="text-[11px] text-[#B7B7B8] bg-[#F5F5F5] px-2 py-0.5 rounded-full">
          Viewer
        </span>
      )}

      {/* Avatar + sign out */}
      <div className="relative group">
        {session.user?.image ? (
          <Image
            src={session.user.image}
            alt={session.user.name ?? "User"}
            width={28}
            height={28}
            className="rounded-full cursor-pointer ring-2 ring-transparent group-hover:ring-[#6841E6] transition-all"
          />
        ) : (
          <div className="w-7 h-7 rounded-full bg-[#6841E6] flex items-center justify-center cursor-pointer text-white text-[11px] font-bold">
            {session.user?.name?.[0] ?? "?"}
          </div>
        )}
        {/* Tooltip on hover */}
        <div className="absolute right-0 top-full mt-2 hidden group-hover:flex flex-col items-end z-50">
          <div className="bg-white border border-[#E0E0E1] rounded-[12px] p-3 shadow-lg min-w-[160px]"
               style={{ boxShadow: "0px 4px 20px rgba(0,0,0,0.1)" }}>
            <p className="text-[12px] font-medium text-[#141414] truncate">{session.user?.name}</p>
            <p className="text-[11px] text-[#B7B7B8] truncate mb-2">{session.user?.email}</p>
            <button
              onClick={() => signOut()}
              className="w-full text-[11px] font-medium text-[#605F63] hover:text-[#DC2626] text-left transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
