import { AlertCircle, CheckCircle2, Info, Loader2, X } from "lucide-react";
import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { useId } from "react";

export function Spinner({ className = "h-5 w-5" }: { className?: string }) {
  return <Loader2 className={`animate-spin ${className}`} aria-hidden="true" />;
}

export function PageLoader({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex min-h-[40vh] items-center justify-center gap-3 text-slate-500" role="status">
      <Spinner className="h-6 w-6 text-brand-600" />
      <span>{label}</span>
    </div>
  );
}

type AlertTone = "error" | "success" | "info" | "warning";
const toneStyles: Record<AlertTone, string> = {
  error: "border-rose-200 bg-rose-50 text-rose-800",
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  info: "border-brand-200 bg-brand-50 text-brand-800",
  warning: "border-amber-200 bg-amber-50 text-amber-900",
};

export function Alert({
  tone = "info",
  children,
  onClose,
  className = "",
}: {
  tone?: AlertTone;
  children: ReactNode;
  onClose?: () => void;
  className?: string;
}) {
  const Icon = tone === "success" ? CheckCircle2 : tone === "error" ? AlertCircle : Info;
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={`flex items-start gap-2.5 rounded-lg border px-3.5 py-3 text-sm ${toneStyles[tone]} ${className}`}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <div className="flex-1">{children}</div>
      {onClose && (
        <button type="button" onClick={onClose} aria-label="Dismiss" className="opacity-70 hover:opacity-100">
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

export function DemoNote({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <p className={`inline-flex items-center gap-1.5 text-xs text-slate-500 ${className}`}>
      <Info className="h-3.5 w-3.5" aria-hidden="true" />
      {children}
    </p>
  );
}

export function DemoBadge({ label = "Demo" }: { label?: string }) {
  return (
    <span className="inline-flex items-center rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-800">
      {label}
    </span>
  );
}

interface FieldProps {
  label: string;
  error?: string;
  hint?: string;
  icon?: ReactNode;
  srOnlyLabel?: boolean;
}

export function Field({
  label,
  error,
  hint,
  icon,
  srOnlyLabel,
  className = "",
  ...props
}: FieldProps & InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  return (
    <div className={className}>
      <label htmlFor={id} className={srOnlyLabel ? "sr-only" : "label"}>
        {label}
      </label>
      <div className="relative">
        {icon && <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">{icon}</span>}
        <input
          id={id}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-err` : hint ? `${id}-hint` : undefined}
          className={`input ${icon ? "pl-10" : ""} ${error ? "input-error" : ""}`}
          placeholder={srOnlyLabel ? label : props.placeholder}
          {...props}
        />
      </div>
      {error ? (
        <p id={`${id}-err`} className="mt-1 text-xs text-rose-600">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1 text-xs text-slate-500">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function SelectField({
  label,
  error,
  srOnlyLabel,
  children,
  className = "",
  ...props
}: FieldProps & SelectHTMLAttributes<HTMLSelectElement>) {
  const id = useId();
  return (
    <div className={className}>
      <label htmlFor={id} className={srOnlyLabel ? "sr-only" : "label"}>
        {label}
      </label>
      <select id={id} aria-invalid={!!error} className={`input ${error ? "input-error" : ""}`} {...props}>
        {children}
      </select>
      {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
    </div>
  );
}

export function TextAreaField({
  label,
  error,
  srOnlyLabel,
  className = "",
  ...props
}: FieldProps & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const id = useId();
  return (
    <div className={className}>
      <label htmlFor={id} className={srOnlyLabel ? "sr-only" : "label"}>
        {label}
      </label>
      <textarea
        id={id}
        aria-invalid={!!error}
        className={`input min-h-[110px] ${error ? "input-error" : ""}`}
        placeholder={srOnlyLabel ? label : props.placeholder}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
    </div>
  );
}

export function SubmitButton({
  loading,
  children,
  className = "btn-primary",
  disabled,
}: {
  loading: boolean;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <button type="submit" className={className} disabled={loading || disabled} aria-busy={loading}>
      {loading && <Spinner className="h-4 w-4" />}
      {children}
    </button>
  );
}

const statusTones: Record<string, string> = {
  approved: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  active: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  scheduled: "bg-sky-50 text-sky-700 ring-sky-600/20",
  completed: "bg-slate-100 text-slate-700 ring-slate-500/20",
  pending: "bg-amber-50 text-amber-800 ring-amber-600/20",
  pending_approval: "bg-amber-50 text-amber-800 ring-amber-600/20",
  rejected: "bg-rose-50 text-rose-700 ring-rose-600/20",
  cancelled: "bg-slate-100 text-slate-600 ring-slate-500/20",
  inactive: "bg-slate-100 text-slate-600 ring-slate-500/20",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ring-1 ring-inset ${statusTones[status] ?? "bg-slate-100 text-slate-700 ring-slate-500/20"}`}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}

export function EmptyState({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="card flex flex-col items-center gap-2 px-6 py-12 text-center">
      <h3 className="text-base font-semibold">{title}</h3>
      {children && <p className="max-w-md text-sm text-slate-500">{children}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
