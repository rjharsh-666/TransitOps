"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

type FormDialogProps = {
  triggerLabel: string;
  title: string;
  description?: string;
  children: ReactNode;
  onSubmit: (formData: FormData) => Promise<void> | void;
  submitLabel?: string;
};

export function FormDialog({ triggerLabel, title, description, children, onSubmit, submitLabel = "Save" }: FormDialogProps) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleClose = () => setSubmitting(false);
    dialog.addEventListener("close", handleClose);
    return () => dialog.removeEventListener("close", handleClose);
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className="inline-flex h-10 items-center justify-center rounded-full bg-slate-950 px-4 text-sm font-medium text-white transition-colors hover:bg-slate-800"
      >
        {triggerLabel}
      </button>
      <dialog ref={dialogRef} className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-0 shadow-2xl backdrop:bg-slate-950/50">
        <form
          className="space-y-5 p-6"
          action={async (formData) => {
            setSubmitting(true);
            await onSubmit(formData);
            dialogRef.current?.close();
          }}
        >
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-slate-950">{title}</h2>
            {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
          </div>
          {children}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              className="inline-flex h-10 items-center justify-center rounded-full border border-slate-200 px-4 text-sm font-medium text-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex h-10 items-center justify-center rounded-full bg-slate-950 px-4 text-sm font-medium text-white disabled:opacity-60"
            >
              {submitLabel}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}