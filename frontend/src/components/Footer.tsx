import { Facebook, Instagram, Linkedin, Youtube } from "lucide-react";
import { Link } from "react-router-dom";
import Logo from "./Logo";

const cols = [
  {
    title: "Company",
    links: [
      { to: "/about", label: "About Us" },
      { to: "/how-it-works", label: "How It Works" },
      { to: "/pricing", label: "Pricing" },
      { to: "/contact", label: "Contact" },
    ],
  },
  {
    title: "Platform",
    links: [
      { to: "/advertise", label: "Advertise" },
      { to: "/screen-owners", label: "For Screen Owners" },
      { to: "/signup", label: "Create Account" },
      { to: "/contact", label: "Help Center" },
    ],
  },
  {
    title: "Legal",
    links: [
      { to: "/legal/terms", label: "Terms & Conditions" },
      { to: "/legal/privacy", label: "Privacy Policy" },
      { to: "/legal/refund", label: "Refund Policy" },
    ],
  },
];

const socials = [
  { icon: Facebook, label: "Facebook" },
  { icon: Instagram, label: "Instagram" },
  { icon: Linkedin, label: "LinkedIn" },
  { icon: Youtube, label: "YouTube" },
];

export default function Footer() {
  return (
    <footer className="bg-navy-900 text-white">
      <div className="container-page grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-1">
          <Logo />
          <p className="mt-4 max-w-xs text-sm text-white/70">Connecting brands with premium digital screens in high-traffic locations.</p>
        </div>
        {cols.map((c) => (
          <div key={c.title}>
            <h3 className="text-sm font-semibold text-white">{c.title}</h3>
            <ul className="mt-4 space-y-2.5">
              {c.links.map((l) => (
                <li key={l.label}>
                  <Link to={l.to} className="text-sm text-white/70 transition hover:text-white">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
        <div>
          <h3 className="text-sm font-semibold text-white">Follow Us</h3>
          <ul className="mt-4 flex gap-3">
            {socials.map(({ icon: Icon, label }) => (
              <li key={label}>
                <span
                  title={`${label} link not configured yet`}
                  aria-label={`${label} (link not configured yet)`}
                  className="grid h-9 w-9 cursor-not-allowed place-items-center rounded-full bg-white/10 text-white/80"
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-white/50">Social profiles not configured yet.</p>
        </div>
      </div>
      <div className="border-t border-white/10 py-5 text-center text-xs text-white/60">
        © {new Date().getFullYear()} BigXel Ads Pvt. Ltd. All rights reserved.
      </div>
    </footer>
  );
}
