"use client";

import { useRef, type ReactNode } from "react";
import { useFormStatus } from "react-dom";

/* ------------------------------ EntityDialog ----------------------------- */

/**
 * Modal form shell. `children` are the server-rendered fields, `action` is a
 * server action used directly as the <form action>. The dialog closes when the
 * action redirects and the page re-renders.
 */
export function EntityDialog({
  title,
  action,
  trigger,
  openLabel,
  children,
  wide = false,
}: {
  title: string;
  action: (formData: FormData) => Promise<void>;
  /** Content of the button that opens the dialog (e.g. "＋ Add"). */
  trigger?: ReactNode;
  /** Title/row label that opens the dialog in edit mode. */
  openLabel?: ReactNode;
  children: ReactNode;
  wide?: boolean;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  const open = () => dialogRef.current?.showModal();
  const close = () => dialogRef.current?.close();

  return (
    <>
      <button
        type="button"
        onClick={open}
        className={
          openLabel === undefined
            ? "rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-700"
            : "font-medium text-teal-700 hover:underline"
        }
      >
        {openLabel ?? trigger}
      </button>

      <dialog
        ref={dialogRef}
        onClick={(event) => {
          if (event.target === dialogRef.current) close(); // backdrop click
        }}
        className="m-auto w-[min(92vw,640px)] rounded-2xl bg-white p-0 backdrop:bg-black/40"
      >
        <div className="max-h-[85vh] overflow-y-auto p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">{title}</h2>
            <button
              type="button"
              onClick={close}
              className="rounded-lg px-2 py-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
          <form action={action} className="space-y-4">
            {children}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={close}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <SubmitButton />
            </div>
          </form>
        </div>
      </dialog>
    </>
  );
}

/* ------------------------------ DeleteButton ----------------------------- */

export function DeleteButton({
  action,
  id,
  confirmMessage = "Delete this record? This cannot be undone.",
}: {
  action: (formData: FormData) => Promise<void>;
  id: string;
  confirmMessage?: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (!confirm(confirmMessage)) event.preventDefault();
      }}
      className="inline"
    >
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        className="font-medium text-rose-600 hover:underline"
      >
        Delete
      </button>
    </form>
  );
}

/* ------------------------------ SubmitButton ----------------------------- */

export function SubmitButton({ label = "Save" }: { label?: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:opacity-60"
    >
      {pending ? "Saving…" : label}
    </button>
  );
}
