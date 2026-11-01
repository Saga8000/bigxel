import { ShieldCheck } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Alert, Field, SubmitButton } from "../../components/ui";
import { api, ApiError } from "../../lib/api";
import AuthShell from "./AuthShell";
import { passwordProblems } from "./Signup";

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [done, setDone] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    const errs: Record<string, string> = {};
    const p = passwordProblems(password);
    if (p.length) errs.password = `Password needs ${p.join(" and ")}`;
    if (password !== confirm) errs.confirm = "Passwords do not match";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setLoading(true);
    try {
      const r = await api.post<{ detail: string }>("/api/auth/reset-password", { token, password });
      setDone(r.detail);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Reset failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell>
      <div className="text-center">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-brand-100 text-brand-600"><ShieldCheck className="h-8 w-8" /></span>
        <h1 className="mt-4 text-2xl font-bold">Set a new password</h1>
      </div>
      {!token ? (
        <Alert tone="error" className="mt-8">This reset link is missing its token. <Link to="/forgot-password" className="font-semibold underline">Request a new link</Link>.</Alert>
      ) : done ? (
        <div className="mt-8 space-y-4">
          <Alert tone="success">{done}</Alert>
          <Link to="/login" className="btn-primary w-full">Go to Log In</Link>
        </div>
      ) : (
        <form onSubmit={submit} noValidate className="mt-8 space-y-5">
          {error && <Alert tone="error">{error} {error.includes("expired") && <Link to="/forgot-password" className="font-semibold underline">Request a new link</Link>}</Alert>}
          <Field label="New Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} error={errors.password} hint="8+ characters, letters and numbers" autoComplete="new-password" />
          <Field label="Confirm New Password" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} error={errors.confirm} autoComplete="new-password" />
          <SubmitButton loading={loading} className="btn-primary w-full py-3 text-base">Reset Password</SubmitButton>
        </form>
      )}
    </AuthShell>
  );
}
