import { Building2, Mail, Megaphone, Monitor, Phone, User, UserPlus } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { Alert, Field, SubmitButton } from "../../components/ui";
import { dashboardPath, useAuth } from "../../context/AuthContext";
import { ApiError } from "../../lib/api";
import AuthShell from "./AuthShell";

type RoleOpt = "advertiser" | "screen_owner";

export function passwordProblems(pw: string) {
  const p: string[] = [];
  if (pw.length < 8) p.push("at least 8 characters");
  if (!/[A-Za-z]/.test(pw) || !/[0-9]/.test(pw)) p.push("letters and numbers");
  return p;
}

export default function Signup() {
  const { user, signup } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [role, setRole] = useState<RoleOpt>(params.get("role") === "screen_owner" ? "screen_owner" : "advertiser");
  const [form, setForm] = useState({ full_name: "", email: "", phone: "", company_name: "", password: "", confirm: "" });
  const [agree, setAgree] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (user && !loading) return <Navigate to={dashboardPath(user.role)} replace />;

  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    const errs: Record<string, string> = {};
    if (form.full_name.trim().length < 2) errs.full_name = "Enter your full name";
    if (!/^\S+@\S+\.\S+$/.test(form.email)) errs.email = "Enter a valid email address";
    if (form.phone && !/^\+?[0-9\s-]{10,16}$/.test(form.phone)) errs.phone = "Enter a valid phone number";
    const pw = passwordProblems(form.password);
    if (pw.length) errs.password = `Password needs ${pw.join(" and ")}`;
    if (form.password !== form.confirm) errs.confirm = "Passwords do not match";
    if (!agree) errs.agree = "Please accept the terms to continue";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setLoading(true);
    try {
      const u = await signup({
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || null,
        company_name: form.company_name.trim() || null,
        password: form.password,
        role,
      });
      const next = params.get("next");
      navigate(next && next.startsWith("/") && !next.startsWith("//") ? next : dashboardPath(u.role), { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        setErrors(err.fieldErrors);
        setError(err.message);
      }
      setLoading(false);
    }
  };

  return (
    <AuthShell>
      <div className="text-center">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-brand-100 text-brand-600"><UserPlus className="h-8 w-8" /></span>
        <h1 className="mt-4 text-2xl font-bold">Create your account</h1>
        <p className="mt-1 text-slate-600">Start advertising or earning with BigXel Ads</p>
      </div>
      <form onSubmit={submit} noValidate className="mt-6 space-y-4">
        <fieldset>
          <legend className="label">I want to</legend>
          <div className="grid grid-cols-2 gap-3">
            {([
              { v: "advertiser", t: "Advertise", d: "Book ads on screens", icon: Megaphone },
              { v: "screen_owner", t: "List screens", d: "Earn from my screens", icon: Monitor },
            ] as const).map(({ v, t, d, icon: Icon }) => (
              <label key={v} className={`flex cursor-pointer items-start gap-2.5 rounded-xl border p-3 transition ${role === v ? "border-brand-500 bg-brand-50 ring-2 ring-brand-500/20" : "border-slate-200 hover:border-brand-300"}`}>
                <input type="radio" name="role" value={v} checked={role === v} onChange={() => setRole(v)} className="sr-only" />
                <Icon className="mt-0.5 h-5 w-5 text-brand-600" />
                <span><span className="block text-sm font-semibold text-slate-900">{t}</span><span className="block text-xs text-slate-500">{d}</span></span>
              </label>
            ))}
          </div>
        </fieldset>
        {error && <Alert tone="error">{error}</Alert>}
        <Field label="Full Name" icon={<User className="h-4 w-4" />} value={form.full_name} onChange={set("full_name")} error={errors.full_name} autoComplete="name" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Email" type="email" icon={<Mail className="h-4 w-4" />} value={form.email} onChange={set("email")} error={errors.email} autoComplete="email" />
          <Field label="Phone (optional)" type="tel" icon={<Phone className="h-4 w-4" />} value={form.phone} onChange={set("phone")} error={errors.phone} autoComplete="tel" />
        </div>
        <Field label={role === "advertiser" ? "Company / Brand (optional)" : "Business Name (optional)"} icon={<Building2 className="h-4 w-4" />} value={form.company_name} onChange={set("company_name")} error={errors.company_name} autoComplete="organization" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Password" type="password" value={form.password} onChange={set("password")} error={errors.password} hint="8+ characters, letters and numbers" autoComplete="new-password" />
          <Field label="Confirm Password" type="password" value={form.confirm} onChange={set("confirm")} error={errors.confirm} autoComplete="new-password" />
        </div>
        <div>
          <label className="flex items-start gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
            <span>I agree to the <Link to="/legal/terms" className="font-medium text-brand-700 hover:underline">Terms</Link> and <Link to="/legal/privacy" className="font-medium text-brand-700 hover:underline">Privacy Policy</Link></span>
          </label>
          {errors.agree && <p className="mt-1 text-xs text-rose-600">{errors.agree}</p>}
        </div>
        <SubmitButton loading={loading} className="btn-primary w-full py-3 text-base">Create Account</SubmitButton>
      </form>
      <p className="mt-6 text-center text-slate-600">
        Already have an account? <Link to="/login" className="font-semibold text-brand-700 hover:underline">Log In</Link>
      </p>
    </AuthShell>
  );
}
