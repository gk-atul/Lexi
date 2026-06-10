"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function SignInContent() {
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") ?? "/";

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center">
      <div
        className="bg-white rounded-[24px] p-8 w-full max-w-sm text-center"
        style={{ boxShadow: "0px 4px 32px 8px rgba(0,0,0,0.06)" }}
      >
        {/* Logo */}
        <div className="w-12 h-12 bg-[#6841E6] rounded-2xl flex items-center justify-center mx-auto mb-6">
          <span className="text-white font-bold text-xl">A</span>
        </div>

        <h1 className="text-[18px] font-semibold text-[#141414] mb-1">
          Sign in as Writer
        </h1>
        <p className="text-[13px] text-[#605F63] mb-8">
          Only writers can rate and train the AI.
          <br />
          Sign in with your ACKO Google account.
        </p>

        <button
          onClick={() => signIn("google", { callbackUrl })}
          className="w-full flex items-center justify-center gap-3 border border-[#E0E0E1] rounded-full py-3 px-4 text-[14px] font-medium text-[#141414] hover:bg-[#F5F5F5] transition-colors"
        >
          {/* Google logo */}
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
            <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        <p className="text-[11px] text-[#B7B7B8] mt-6">
          Not a writer? You can still use the generator — just without rating.
        </p>
      </div>

      <div className="flex gap-4 mt-5">
        <a href="/" className="text-[11px] text-[#B7B7B8] hover:text-[#6841E6] transition-colors">← Back to generator</a>
        <span className="text-[#E0E0E1]">·</span>
        <a href="/login" className="text-[11px] text-[#B7B7B8] hover:text-[#6841E6] transition-colors">Admin dashboard</a>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense>
      <SignInContent />
    </Suspense>
  );
}
