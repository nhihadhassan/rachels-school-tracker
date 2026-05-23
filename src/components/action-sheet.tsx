"use client";

import { useEffect } from "react";

interface Action {
  label: string;
  destructive?: boolean;
  onClick: () => void;
}

interface ActionSheetProps {
  open: boolean;
  onClose: () => void;
  actions: Action[];
}

export function ActionSheet({ open, onClose, actions }: ActionSheetProps) {
  // Close on back gesture / escape
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Sheet */}
      <div className="relative z-10 rounded-t-2xl bg-white px-4 pb-8 pt-3 shadow-xl">
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-zinc-200" />
        <ul className="flex flex-col divide-y divide-zinc-100">
          {actions.map((action) => (
            <li key={action.label}>
              <button
                type="button"
                onClick={() => { action.onClick(); onClose(); }}
                className={`w-full py-4 text-center text-base font-medium ${
                  action.destructive ? "text-red-600" : "text-zinc-800"
                }`}
              >
                {action.label}
              </button>
            </li>
          ))}
          <li>
            <button
              type="button"
              onClick={onClose}
              className="w-full py-4 text-center text-base font-medium text-zinc-500"
            >
              Cancel
            </button>
          </li>
        </ul>
      </div>
    </div>
  );
}
