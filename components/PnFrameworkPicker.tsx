"use client";

import { PnFramework, PN_FRAMEWORK_META } from "@/lib/prompts";

interface Props {
  active: PnFramework | null;
  loading: boolean;
  onSelect: (framework: PnFramework) => void;
}

export default function PnFrameworkPicker({ active, loading, onSelect }: Props) {
  const frameworks = Object.entries(PN_FRAMEWORK_META) as [
    PnFramework,
    (typeof PN_FRAMEWORK_META)[PnFramework]
  ][];

  return (
    <div className="mb-5">
      <p className="text-[11px] font-semibold text-[#605F63] uppercase tracking-[0.5px] mb-2">
        Rewrite with framework
      </p>
      <div className="flex flex-wrap gap-2">
        {frameworks.map(([key, meta]) => {
          const isActive = active === key;
          return (
            <button
              key={key}
              onClick={() => onSelect(key)}
              disabled={loading}
              title={meta.bestFor}
              className={`
                group relative flex flex-col items-start px-3 py-2 rounded-lg border text-left
                transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed
                ${
                  isActive
                    ? "border-[#6841E6] bg-[#6841E6] text-white shadow-sm"
                    : "border-[#E0E0E1] bg-white text-[#605F63] hover:border-[#6841E6] hover:text-[#6841E6]"
                }
              `}
            >
              <span className="text-xs font-semibold leading-tight">{meta.label}</span>
              <span
                className={`text-[10px] leading-tight mt-0.5 ${
                  isActive ? "text-[#D9D8FC]" : "text-[#B7B7B8] group-hover:text-[#6841E6]/70"
                }`}
              >
                {meta.bestFor}
              </span>
            </button>
          );
        })}
      </div>
      {active && loading && (
        <p className="mt-2 text-[11px] text-[#605F63] italic">
          Generating{loading ? "…" : ""}
        </p>
      )}
    </div>
  );
}
