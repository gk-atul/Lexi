"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import Image from "next/image";

export default function WriterBadge() {
  const { data: session, status } = useSession();
  const isWriter = (session?.user as { isWriter?: boolean })?.isWriter;

  if (status === "loading") return null;

  if (!session) {
    return (
      <button
        onClick={() => signIn("google")}
        className="flex items-center gap-2 text-[12px] font-medium text-[#605F63] border border-[#E0E0E1] hover:border-[#6841E6] hover:text-[#6841E6] rounded-full px-3 py-1.5 transition-all"
      >
        <svg width="13" height="13" viewBox="0 0 18 18" fill="none">
          <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
          <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
          <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
          <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
        </svg>
        Sign in as Writer
      </button>
    );
  }

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
