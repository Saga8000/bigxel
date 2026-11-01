import { KeyRound, Mail } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Alert, Field, SubmitButton } from "../../components/ui";
import { api, ApiError } from "../../lib/api";
import AuthShell from "./AuthShell";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState<{ detail: string; dev_reset_url: string | null } | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError("Enter a valid email address");
      return;
    }
    setLoading(true);
    try {
      setDone(await api.post("/api/auth/forgot-password", { email: email.trim() }));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Request failed");
    } finally {
      setLoading(false);
    }
  };

  const devPath = done?.dev_reset_url ? new URL(done.dev_reset_url).pathname + new URL(done.dev_reset_url).search : null;

  return (
    <AuthShell>
      <div className="text-center">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-brand-100 text-brand-600"><KeyRound className="h-8 w-8" /></span>
        <h1 className="mt-4 text-2xl font-bold">Forgot your password?</h1>
        <p className="mt-1 text-slate-600">Enter your account email and we&apos;ll generate a reset link.</p>
      </div>
      {done ? (
        <div className="mt-8 space-y-4">
          <Alert tone="success">{done.detail}</Alert>
          <Alert tone="warning">
            Email delivery is not configured yet, so no email was sent.
            {devPath && (
              <>
                {" "}Development mode reset link:{" "}
                <Link to={devPath} className="break-all font-semibold underline">Reset password</Link>
              </>
            )}
          </Alert>
          <Link to="/login" className="btn-outline w-full">Back to Log In</Link>
        </div>
      ) : (
        <form onSubmit={submit} noValidate className="mt-8 space-y-5">
          {error && <Alert tone="error">{error}</Alert>}
          <Field label="Email Address" type="email" icon={<Mail className="h-5 w-5" />} value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" autoFocus />
          <SubmitButton loading={loading} className="btn-primary w-full py-3 text-base">Send Reset Link</SubmitButton>
          <p className="text-center text-sm text-slate-600">Remembered it? <Link to="/login" className="font-semibold text-brand-700 hover:underline">Log In</Link></p>
        </form>
      )}
    </AuthShell>
  );
}
