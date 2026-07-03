"use client";

import LearningPanel from "@/components/LearningPanel";
import Link from "next/link";

export default function LearningsPage() {
  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <header className="bg-white border-b border-[#E0E0E1] px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-2 text-[13px] font-medium text-[#605F63] hover:text-[#141414] transition-colors group"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="group-hover:-translate-x-0.5 transition-transform">
              <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back
          </Link>
          <span className="text-[#E0E0E1]">/</span>
          <h1 className="text-[15px] font-semibold text-[#0A0A0A]">Learnings</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8">
        <LearningPanel showEmpty />
      </main>
    </div>
  );
}
