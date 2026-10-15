import { X } from "lucide-react";
import { useSyncExternalStore } from "react";
import { t } from "@/i18n";

export type ToastTone = "danger" | "success";

type ToastAction = {
  label: string;
  onClick: () => void;
};

type ToastRecord = {
  id: number;
  message: string;
  tone: ToastTone;
  action?: ToastAction;
};

type ToastOptions = {
  tone?: ToastTone;
  duration?: number;
  action?: ToastAction;
};

let records: ToastRecord[] = [];
const listeners = new Set<() => void>();
let nextId = 1;

function emit() {
  for (const listener of listeners) {
    listener();
  }
}

export function clearToasts() {
  if (records.length === 0) {
    return;
  }
  records = [];
  emit();
}

export function dismissToast(id: number) {
  const next = records.filter((item) => item.id !== id);
  if (next.length === records.length) {
    return;
  }
  records = next;
  emit();
}

export function showToast(message: string, options: ToastOptions = {}) {
  const id = nextId++;
  const tone = options.tone ?? "danger";
  const next: ToastRecord = { id, message, tone };
  if (options.action) {
    next.action = options.action;
  }
  records = [...records, next];
  emit();
  const duration = options.duration ?? 5000;
  if (duration > 0) {
    window.setTimeout(() => dismissToast(id), duration);
  }
  return id;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return records;
}

export function useToasts() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function Toaster() {
  const items = useToasts();
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(var(--mobile-dock,6rem)+env(safe-area-inset-bottom))] z-50 flex flex-col items-center gap-2 px-4 md:bottom-6">
      {items.map((item) => (
        <div
          key={item.id}
          role="status"
          className={`pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-2xl border bg-white px-4 py-3 text-sm shadow-soft ${
            item.tone === "danger" ? "border-danger-600/30 text-danger-600" : "border-brand-200 text-ink-900"
          }`}
        >
          <p className="min-w-0 flex-1">{item.message}</p>
          {item.action ? (
            <button
              type="button"
              className="shrink-0 font-semibold"
              onClick={() => {
                item.action?.onClick();
                dismissToast(item.id);
              }}
            >
              {item.action.label}
            </button>
          ) : null}
          <button
            type="button"
            className="shrink-0 text-ink-500"
            aria-label={t().common.dismiss}
            onClick={() => dismissToast(item.id)}
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      ))}
    </div>
  );
}
