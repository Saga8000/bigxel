import { BarChart3, CheckCircle2, Crosshair, PlayCircle, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import ScreenBrowser from "./ScreenBrowser";

const perks = [
  { icon: ShieldCheck, title: "Verified Screens", text: "Every screen is reviewed before it is listed." },
  { icon: Crosshair, title: "Targeted Advertising", text: "Reach your ideal audience at the right place and time." },
  { icon: BarChart3, title: "Campaign Tracking", text: "Follow bookings, approvals and spend in your dashboard." },
  { icon: CheckCircle2, title: "100% Transparent", text: "No hidden charges. What you see is what you pay." },
];

export default function Advertise() {
  const { user } = useAuth();
  const bookPath = user?.role === "advertiser" ? (id: number) => `/advertiser/campaigns/new?screen=${id}` : undefined;
  return (
    <div className="bg-white">
      <div className="container-page py-10">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold sm:text-4xl">
              Advertise on <span className="text-gradient">Premium Screens</span>
            </h1>
            <p className="mt-2 text-slate-600">Reach thousands of potential customers at high-traffic locations.</p>
          </div>
          <Link to="/how-it-works" className="btn-outline self-start px-5 py-3">
            <PlayCircle className="h-5 w-5" /> How It Works
          </Link>
        </div>
        <ScreenBrowser bookPath={bookPath ? (s) => bookPath(s.id) : undefined} />
        <div className="mt-12 grid gap-6 rounded-2xl bg-slate-50 p-6 sm:grid-cols-2 lg:grid-cols-4 lg:divide-x lg:divide-slate-200">
          {perks.map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex gap-4 lg:px-4">
              <span className="icon-badge h-14 w-14">
                <Icon className="h-7 w-7" aria-hidden="true" />
              </span>
              <div>
                <h3 className="font-semibold">{title}</h3>
                <p className="mt-1 text-sm text-slate-600">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
