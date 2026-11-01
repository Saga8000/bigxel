import { Link } from "react-router-dom";

export default function Logo({ light = true, className = "" }: { light?: boolean; className?: string }) {
  return (
    <Link to="/" aria-label="BigXel Ads home" className={`inline-flex flex-col leading-none ${className}`}>
      <span className="text-[28px] font-extrabold tracking-tight">
        <span className={light ? "text-white" : "text-navy-900"}>Big</span>
        <span className="bg-gradient-to-r from-brand-400 to-brand-600 bg-clip-text text-transparent">Xel</span>
      </span>
      <span className={`-mt-0.5 self-end pr-0.5 text-[10px] font-semibold tracking-[0.35em] ${light ? "text-white/80" : "text-navy-900/80"}`}>
        ADS
      </span>
    </Link>
  );
}
