"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { X } from "lucide-react";

type FormDialogProps = {
  triggerLabel: string;
  triggerIcon?: ReactNode;
  title: string;
  description?: string;
  children: ReactNode;
  onSubmit: (formData: FormData) => Promise<void> | void;
  submitLabel?: string;
};

export function FormDialog({ triggerLabel, triggerIcon, title, description, children, onSubmit, submitLabel = "Save" }: FormDialogProps) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const handleClose = () => { setSubmitting(false); setError(null); };
    dialog.addEventListener("close", handleClose);
    return () => dialog.removeEventListener("close", handleClose);
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className="inline-flex h-11 items-center gap-2 rounded-full bg-slate-950 px-5 text-sm font-semibold text-white shadow-[0_8px_24px_-8px_rgba(15,23,42,0.4)] transition-all hover:bg-slate-800 hover:shadow-[0_12px_28px_-8px_rgba(15,23,42,0.5)] active:scale-[0.98]"
      >
        {triggerIcon}
        {triggerLabel}
      </button>
      <dialog
        ref={dialogRef}
        className="w-full max-w-lg rounded-3xl border border-slate-200/80 bg-white p-0 shadow-[0_32px_80px_-20px_rgba(15,23,42,0.35)] backdrop:bg-slate-950/60 backdrop:backdrop-blur-sm"
        onClick={(e) => { if (e.target === e.currentTarget) dialogRef.current?.close(); }}
      >
        <form
          className="p-6"
          action={async (formData) => {
            setSubmitting(true);
            setError(null);
            try {
              await onSubmit(formData);
              dialogRef.current?.close();
            } catch (err) {
              setError(err instanceof Error ? err.message : "Something went wrong");
              setSubmitting(false);
            }
          }}
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-slate-950">{title}</h2>
              {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
            </div>
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              className="shrink-0 rounded-xl p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="space-y-4">{children}</div>

          {/* Error */}
          {error && (
            <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          )}

          {/* Footer */}
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              className="inline-flex h-10 items-center justify-center rounded-full border border-slate-200 bg-white px-5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex h-10 items-center justify-center rounded-full bg-slate-950 px-5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-50"
            >
              {submitting ? "Saving…" : submitLabel}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}

/* ── Shared input/label helpers ─────────────────────────────── */
export function FieldLabel({ children }: { children: ReactNode }) {
  return <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">{children}</p>;
}

export function FieldInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-950 placeholder:text-slate-400 outline-none transition focus:border-slate-950 focus:bg-white focus:ring-2 focus:ring-slate-950/10 ${props.className ?? ""}`}
    />
  );
}

export function FieldSelect({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { children: ReactNode }) {
  return (
    <select
      {...props}
      className={`w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-slate-950 focus:bg-white focus:ring-2 focus:ring-slate-950/10 ${props.className ?? ""}`}
    >
      {children}
    </select>
  );
}

export function FieldTextarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-950 placeholder:text-slate-400 outline-none transition focus:border-slate-950 focus:bg-white focus:ring-2 focus:ring-slate-950/10 resize-none ${props.className ?? ""}`}
    />
  );
}