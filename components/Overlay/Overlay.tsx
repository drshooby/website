"use client";

// A modal on <dialog>/showModal(): the browser supplies the focus trap, the
// inert page behind it and the top layer. Esc and a click on the backdrop
// ask the parent to close (via onClose); the parent owns `open`. On close,
// every video inside is paused and focus goes back to whatever had it
// before the overlay opened.

import { useEffect, useRef, type ReactNode } from "react";
import styles from "./Overlay.module.css";

type OverlayProps = {
  open: boolean;
  onClose: () => void;
  label: string;
  children: ReactNode;
};

export function Overlay({ open, onClose, label, children }: OverlayProps) {
  const ref = useRef<HTMLDialogElement | null>(null);
  const returnTo = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  const openRef = useRef(open);
  const downOnBackdrop = useRef(false);

  useEffect(() => {
    onCloseRef.current = onClose;
    openRef.current = open;
  });

  // Runs once per close, however it happened: stop media, give focus back.
  const settle = useRef(() => {
    ref.current?.querySelectorAll("video").forEach((v) => v.pause());
    const el = returnTo.current;
    returnTo.current = null;
    if (el && el.isConnected) el.focus();
  });

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      const active = document.activeElement;
      returnTo.current = active instanceof HTMLElement ? active : null;
      d.showModal();
    } else if (!open && d.open) {
      d.close();
    }
  }, [open]);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    const onCancel = (e: Event) => {
      // Esc: keep the dialog under React's control and let the parent decide.
      e.preventDefault();
      onCloseRef.current();
    };
    const onDialogClose = () => {
      settle.current();
      // Closed by something other than the parent (e.g. a form method=dialog).
      if (openRef.current) onCloseRef.current();
    };
    d.addEventListener("cancel", onCancel);
    d.addEventListener("close", onDialogClose);
    const settleNow = settle.current;
    return () => {
      d.removeEventListener("cancel", onCancel);
      d.removeEventListener("close", onDialogClose);
      if (d.open) {
        d.close();
        settleNow();
      }
    };
  }, []);

  return (
    <dialog
      ref={ref}
      className={styles.overlay}
      aria-label={label}
      // The dialog box itself has no padding, so a press whose target is the
      // dialog element landed on the ::backdrop. Both ends must be there, so
      // a text selection dragged out of the content doesn't close it.
      onPointerDown={(e) => {
        downOnBackdrop.current = e.target === e.currentTarget;
      }}
      onClick={(e) => {
        if (downOnBackdrop.current && e.target === e.currentTarget) onClose();
        downOnBackdrop.current = false;
      }}
    >
      <div className={styles.body} data-sheet>
        {children}
      </div>
    </dialog>
  );
}
