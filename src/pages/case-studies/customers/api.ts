// Shared by the Customers API case study: base URL, response types and a small POST helper.

export const BASE_URL =
  (import.meta.env.VITE_CUSTOMERS_BASE as string | undefined)?.trim() ?? 'http://localhost:8082/customers';

// ─── Response types (customers-api) ───────────────────────────────────────────

/** POST /api/customers/{customerPk}/birthday-greetings */
export interface BirthdayGreetingResponse {
  message: string;
  tone: string;
}

/** POST /api/companies/{companyId}/ask */
export interface CompanyQueryResponse {
  message: string;
  sql: string;
  rowCount: number;
  rows: Record<string, unknown>[];
}

/** POST /api/bedrock/ask */
export interface AskResponse {
  answer: string;
}

export function greetingUrl(customerPk: string) {
  return `${BASE_URL}/api/customers/${customerPk}/birthday-greetings`;
}

// ─── Request state ────────────────────────────────────────────────────────────

export interface RequestState<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
  status: number | null;
}

export function idleState<T>(): RequestState<T> {
  return { data: null, error: null, loading: false, status: null };
}

/** The API's error body is { status, message, timestamp }; fall back to the raw text. */
function errorMessage(status: number, text: string): string {
  try {
    const body = JSON.parse(text) as { message?: unknown };
    if (typeof body.message === 'string' && body.message) {
      return `HTTP ${String(status)}: ${body.message}`;
    }
  } catch {
    // not JSON
  }
  return `HTTP ${String(status)}: ${text || 'Unknown error'}`;
}

/** POSTs JSON (or no body) and returns the request state the UI renders. */
export async function postJson<T>(url: string, body?: unknown): Promise<RequestState<T>> {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      return {
        data: null,
        error: errorMessage(res.status, text),
        loading: false,
        status: res.status,
      };
    }
    const data = (await res.json()) as T;
    return { data, error: null, loading: false, status: res.status };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : String(err),
      loading: false,
      status: null,
    };
  }
}
