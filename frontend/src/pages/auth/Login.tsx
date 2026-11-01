import { Eye, EyeOff, Lock, User } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { Alert, Field, SubmitButton } from "../../components/ui";
import { dashboardPath, useAuth } from "../../context/AuthContext";
import { ApiError } from "../../lib/api";
import AuthShell, { SocialButtons } from "./AuthShell";

function safeNext(next: string | null) {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : null;
}

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const next = safeNext(params.get("next"));

  if (user && !loading) return <Navigate to={next ?? dashboardPath(user.role)} replace />;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    const errs: Record<string, string> = {};
    if (identifier.trim().length < 3) errs.identifier = "Enter your email or phone number";
    if (!password) errs.password = "Enter your password";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setLoading(true);
    try {
      const u = await login(identifier.trim(), password, remember);
      navigate(next ?? dashboardPath(u.role), { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Login failed");
      setLoading(false);
    }
  };

  return (
    <AuthShell>
      <div className="text-center">
        <span className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-brand-100 text-brand-600"><Lock className="h-9 w-9" /></span>
        <h1 className="mt-5 text-2xl font-bold">Welcome Back!</h1>
        <p className="mt-1 text-slate-600">Log in to your BigXel Ads account</p>
      </div>
      <form onSubmit={submit} noValidate className="mt-8 space-y-5">
        {error && <Alert tone="error">{error}</Alert>}
        <Field label="Email or Phone Number" placeholder="Enter your email or phone number" icon={<User className="h-5 w-5" />} value={identifier} onChange={(e) => setIdentifier(e.target.value)} error={errors.identifier} autoComplete="username" autoFocus />
        <div>
          <label htmlFor="password" className="label">Password</label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input id="password" type={show ? "text" : "password"} className={`input pl-10 pr-11 ${errors.password ? "input-error" : ""}`} placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" aria-invalid={!!errors.password} />
            <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700" aria-label={show ? "Hide password" : "Show password"}>
              {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          {errors.password && <p className="mt-1 text-xs text-rose-600">{errors.password}</p>}
        </div>
        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 text-slate-700">
            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
            Remember me
          </label>
          <Link to="/forgot-password" className="font-semibold text-brand-700 hover:underline">Forgot Password?</Link>
        </div>
        <SubmitButton loading={loading} className="btn-primary w-full py-3 text-base">Log In</SubmitButton>
      </form>
      <SocialButtons />
      <p className="mt-6 text-center text-slate-600">
        Don&apos;t have an account? <Link to={`/signup${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-semibold text-brand-700 hover:underline">Sign Up</Link>
      </p>
    </AuthShell>
  );
}
