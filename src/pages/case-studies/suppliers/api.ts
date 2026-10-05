// Shared by the Suppliers (PostGIS) case study: base URL, response types and a small GET helper.

export const BASE_URL =
  (import.meta.env.VITE_WEBSTORE_BASE as string | undefined)?.trim() ?? 'http://localhost:8080/webstore';

// ─── Response types (webstore-api-java, /api/report) ──────────────────────────

export interface CityResponse {
  id: string;
  name: string;
  state: string | null;
  country: string;
  latitude: number;
  longitude: number;
}

export interface SupplierResponse {
  id: string;
  name: string;
  email: string;
  addressCity: CityResponse | null;
  productCount: number;
}

export interface CityDistanceResponse extends CityResponse {
  distanceKm: number;
}

// ─── URLs ─────────────────────────────────────────────────────────────────────

export const suppliersUrl = () => `${BASE_URL}/api/report/suppliers`;
export const citiesUrl = () => `${BASE_URL}/api/report/cities`;

export function nearbyUrl(city: CityResponse, radiusKm: number) {
  const params = new URLSearchParams({ city: city.name });
  if (city.country) params.set('country', city.country);
  params.set('radiusKm', String(radiusKm));
  return `${BASE_URL}/api/report/cities/nearby?${params.toString()}`;
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

export function loadingState<T>(): RequestState<T> {
  return { data: null, error: null, loading: true, status: null };
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

/** GETs JSON and returns the request state the UI renders. */
export async function getJson<T>(url: string): Promise<RequestState<T>> {
  try {
    const res = await fetch(url);
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      return { data: null, error: errorMessage(res.status, text), loading: false, status: res.status };
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
