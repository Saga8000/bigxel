import { Bell, ChevronDown, LayoutDashboard, LogOut, Menu, Wallet, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { dashboardPath, useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import { formatINR, roleLabel } from "../lib/format";
import type { Wallet as WalletT } from "../lib/types";
import Logo from "./Logo";

export const NAV_LINKS = [
  { to: "/", label: "Home" },
  { to: "/advertise", label: "Advertise" },
  { to: "/screen-owners", label: "For Screen Owners" },
  { to: "/how-it-works", label: "How It Works" },
  { to: "/pricing", label: "Pricing" },
  { to: "/about", label: "About Us" },
  { to: "/contact", label: "Contact" },
];

const linkCls = ({ isActive }: { isActive: boolean }) =>
  `relative py-2 text-sm font-medium transition hover:text-brand-300 ${
    isActive ? "text-brand-400 after:absolute after:-bottom-1 after:left-0 after:right-0 after:h-0.5 after:rounded after:bg-brand-500" : "text-white"
  }`;

function UserMenu() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user?.role !== "advertiser") return;
    api.get<WalletT>("/api/advertiser/wallet").then((w) => setBalance(w.balance)).catch(() => setBalance(null));
  }, [user]);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  if (!user) return null;
  return (
    <div className="flex items-center gap-3">
      {user.role === "advertiser" && balance !== null && (
        <Link
          to="/advertiser/wallet"
          className="hidden items-center gap-2.5 rounded-xl border border-white/15 px-3 py-1.5 text-white hover:border-brand-400 xl:flex"
        >
          <Wallet className="h-5 w-5" aria-hidden="true" />
          <span className="leading-tight">
            <span className="block text-sm font-semibold">{formatINR(balance)}</span>
            <span className="block text-[10px] text-white/70">Wallet Balance</span>
          </span>
        </Link>
      )}
      <Link to={`${dashboardPath(user.role)}`} className="hidden text-white/80 hover:text-white sm:block" aria-label="Dashboard notifications">
        <Bell className="h-5 w-5" />
      </Link>
      <div className="relative" ref={ref}>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-haspopup="menu"
          className="flex items-center gap-2 rounded-full text-left text-white"
        >
          <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-600 font-semibold">
            {user.full_name.charAt(0).toUpperCase()}
          </span>
          <span className="hidden leading-tight lg:block">
            <span className="block max-w-[120px] truncate text-sm font-semibold">{user.full_name.split(" ")[0]}</span>
            <span className="block text-[11px] text-white/70">{roleLabel[user.role]}</span>
          </span>
          <ChevronDown className="h-4 w-4" aria-hidden="true" />
        </button>
        {open && (
          <div role="menu" className="absolute right-0 z-50 mt-2 w-52 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 text-sm shadow-xl">
            <Link role="menuitem" to={dashboardPath(user.role)} onClick={() => setOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-slate-700 hover:bg-slate-50">
              <LayoutDashboard className="h-4 w-4" /> Dashboard
            </Link>
            <button
              role="menuitem"
              type="button"
              onClick={async () => {
                setOpen(false);
                await logout();
                navigate("/");
              }}
              className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-slate-700 hover:bg-slate-50"
            >
              <LogOut className="h-4 w-4" /> Log out
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Navbar() {
  const { user, loading } = useAuth();
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => setOpen(false), [location.pathname]);

  return (
    <header className="sticky top-0 z-40 bg-navy-900/95 backdrop-blur supports-[backdrop-filter]:bg-navy-900/90">
      <nav className="container-page flex h-[68px] items-center justify-between gap-4" aria-label="Main">
        <Logo />
        <ul className="hidden items-center gap-7 lg:flex">
          {NAV_LINKS.map((l) => (
            <li key={l.to}>
              <NavLink to={l.to} end={l.to === "/"} className={linkCls}>
                {l.label}
              </NavLink>
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-3">
          {!loading && !user && (
            <div className="hidden items-center gap-3 sm:flex">
              <Link to="/login" className="btn border border-white/30 px-5 text-white hover:border-white hover:bg-white/5">
                Log In
              </Link>
              <Link to="/signup" className="btn-primary px-5">
                Sign Up
              </Link>
            </div>
          )}
          {user && <UserMenu />}
          <button
            type="button"
            className="rounded-lg p-2 text-white hover:bg-white/10 lg:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </nav>
      {open && (
        <div id="mobile-menu" className="border-t border-white/10 bg-navy-900 lg:hidden">
          <ul className="container-page flex flex-col py-3">
            {NAV_LINKS.map((l) => (
              <li key={l.to}>
                <NavLink
                  to={l.to}
                  end={l.to === "/"}
                  className={({ isActive }) =>
                    `block rounded-lg px-3 py-2.5 text-sm font-medium ${isActive ? "bg-white/10 text-brand-300" : "text-white hover:bg-white/5"}`
                  }
                >
                  {l.label}
                </NavLink>
              </li>
            ))}
            {!user && (
              <li className="mt-2 grid grid-cols-2 gap-3 px-3 pb-2">
                <Link to="/login" className="btn border border-white/30 text-white">
                  Log In
                </Link>
                <Link to="/signup" className="btn-primary">
                  Sign Up
                </Link>
              </li>
            )}
          </ul>
        </div>
      )}
    </header>
  );
}
