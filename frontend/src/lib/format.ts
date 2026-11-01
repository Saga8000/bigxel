const inr = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });

export const formatINR = (n: number) => `${n < 0 ? "-" : ""}₹${inr.format(Math.abs(n))}`;
export const formatNumber = (n: number) => inr.format(n);

export function formatDate(iso: string) {
  const d = new Date(iso.length === 10 ? `${iso}T00:00:00` : iso);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function formatMonth(ym: string) {
  const [y, m] = ym.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
}

export function daysBetween(start: string, end: string) {
  const s = new Date(`${start}T00:00:00`).getTime();
  const e = new Date(`${end}T00:00:00`).getTime();
  return Math.round((e - s) / 86_400_000) + 1;
}

export function isoDate(d: Date) {
  const tz = d.getTimezoneOffset() * 60_000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 10);
}

export function addDays(d: Date, days: number) {
  const n = new Date(d);
  n.setDate(n.getDate() + days);
  return n;
}

export const roleLabel: Record<string, string> = {
  advertiser: "Advertiser",
  screen_owner: "Screen Owner",
  admin: "Admin",
};

export const statusLabel = (s: string) =>
  s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
