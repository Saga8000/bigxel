import { ChevronDown } from "lucide-react";
import { useId, useState } from "react";

export default function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left text-sm font-medium text-slate-900 hover:text-brand-700"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((o) => !o)}
      >
        {q}
        <ChevronDown className={`h-4 w-4 shrink-0 text-slate-500 transition ${open ? "rotate-180" : ""}`} aria-hidden="true" />
      </button>
      <div id={id} hidden={!open} className="px-4 pb-4 text-sm leading-relaxed text-slate-600">
        {a}
      </div>
    </div>
  );
}
