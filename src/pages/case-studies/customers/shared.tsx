import type { ReactNode } from 'react';

// Small UI pieces shared by the Customers API case study page and its sections.

export function SectionCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-100 px-6 py-4">
        <h2 className="text-base font-semibold text-gray-800">{title}</h2>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

export function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <label className="text-xs font-semibold tracking-wide text-gray-400 uppercase">
      {children}
    </label>
  );
}

export function StatusBadge({ status }: { status: number }) {
  const ok = status >= 200 && status < 300;
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
        ok ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
      }`}
    >
      HTTP {status}
    </span>
  );
}

export function Spinner({ className = 'h-3.5 w-3.5 border-blue-500' }: { className?: string }) {
  return (
    <span
      className={`inline-block animate-spin rounded-full border-2 border-t-transparent ${className}`}
    />
  );
}

export function ErrorBox({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {children}
    </div>
  );
}

/** "POST <url>" bar shown under a form, with the HTTP status once there is one. */
export function RequestBar({
  method,
  url,
  status,
}: {
  method: 'GET' | 'POST';
  url: string;
  status: number | null;
}) {
  return (
    <div className="mt-4 rounded-lg bg-gray-50 px-3 py-2">
      <div className="flex items-center gap-2">
        <span className="shrink-0 text-xs font-bold text-blue-600">{method}</span>
        <code className="text-xs break-all text-gray-500">{url}</code>
        {status !== null && <StatusBadge status={status} />}
      </div>
    </div>
  );
}
