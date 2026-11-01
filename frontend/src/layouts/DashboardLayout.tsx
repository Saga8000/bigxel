import {
  BarChart3,
  CalendarCheck,
  CreditCard,
  IndianRupee,
  LayoutDashboard,
  Megaphone,
  MessageSquare,
  Monitor,
  PlusCircle,
  Search,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { roleLabel } from "../lib/format";
import type { Role } from "../lib/types";

type Item = { to: string; label: string; icon: LucideIcon; end?: boolean };

const MENUS: Record<Role, Item[]> = {
  advertiser: [
    { to: "/advertiser", label: "Dashboard", icon: LayoutDashboard, end: true },
    { to: "/advertiser/screens", label: "Browse Screens", icon: Search },
    { to: "/advertiser/campaigns/new", label: "New Campaign", icon: PlusCircle },
    { to: "/advertiser/campaigns", label: "Campaigns", icon: Megaphone, end: true },
    { to: "/advertiser/analytics", label: "Analytics", icon: BarChart3 },
    { to: "/advertiser/wallet", label: "Wallet & Payments", icon: Wallet },
  ],
  screen_owner: [
    { to: "/owner", label: "Dashboard", icon: LayoutDashboard, end: true },
    { to: "/owner/screens", label: "My Screens", icon: Monitor, end: true },
    { to: "/owner/screens/new", label: "Add Screen", icon: PlusCircle },
    { to: "/owner/bookings", label: "Bookings", icon: CalendarCheck },
    { to: "/owner/earnings", label: "Earnings & Analytics", icon: IndianRupee },
  ],
  admin: [
    { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
    { to: "/admin/users", label: "Users", icon: Users },
    { to: "/admin/screens", label: "Screens", icon: Monitor },
    { to: "/admin/campaigns", label: "Campaigns", icon: Megaphone },
    { to: "/admin/bookings", label: "Bookings", icon: CalendarCheck },
    { to: "/admin/payments", label: "Payments", icon: CreditCard },
    { to: "/admin/messages", label: "Messages", icon: MessageSquare },
  ],
};

export default function DashboardLayout() {
  const { user } = useAuth();
  if (!user) return null;
  const items = MENUS[user.role];
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Navbar />
      <div className="container-page flex flex-1 flex-col gap-6 py-6 lg:flex-row">
        <aside className="lg:w-60 lg:shrink-0" aria-label="Dashboard navigation">
          <div className="card p-3 lg:sticky lg:top-24">
            <p className="hidden px-3 pb-2 pt-1 text-xs font-semibold uppercase tracking-wider text-slate-400 lg:block">
              {roleLabel[user.role]} workspace
            </p>
            <nav className="flex gap-1 overflow-x-auto lg:flex-col">
              {items.map(({ to, label, icon: Icon, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    `flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
                      isActive ? "bg-brand-600 text-white" : "text-slate-700 hover:bg-slate-100"
                    }`
                  }
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {label}
                </NavLink>
              ))}
            </nav>
          </div>
        </aside>
        <main id="main" className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-600">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
