import { useState } from 'react';
import { Link } from 'react-router';
import CityTable from './suppliers/CityTable';
import {
  getJson,
  idleState,
  loadingState,
  nearbyUrl,
  suppliersUrl,
  type CityDistanceResponse,
  type CityResponse,
  type RequestState,
  type SupplierResponse,
} from './suppliers/api';
import { ErrorBox, FieldLabel, RequestBar, SectionCard, Spinner } from './customers/shared';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const place = (c: CityResponse) => [c.name, c.state, c.country].filter(Boolean).join(', ');

const TH = 'whitespace-nowrap px-4 py-2.5 text-left text-xs font-semibold text-gray-500';
const inputClass =
  'rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500';

// ─── Tables ──────────────────────────────────────────────────────────────────

function SupplierTable({
  suppliers,
  onNearby,
  busyId,
}: {
  suppliers: SupplierResponse[];
  onNearby: (s: SupplierResponse) => void;
  busyId: string | null;
}) {
  if (suppliers.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 py-10 text-center text-sm text-gray-400">
        No suppliers found for the applied filters.
      </div>
    );
  }

  return (
    <div className="overflow-auto rounded-xl border border-gray-200">
      <table className="w-full text-sm">
        <thead className="sticky top-0 z-10 bg-gray-50">
          <tr>
            {['Actions', 'Name', 'Email', 'City', 'Lat / Lon', 'Products'].map(h => (
              <th key={h} className={TH}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {suppliers.map(s => (
            <tr key={s.id} className="hover:bg-gray-50">
              <td className="px-3 py-2">
                <button
                  onClick={() => { onNearby(s); }}
                  disabled={!s.addressCity || busyId === s.id}
                  className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600 transition hover:bg-blue-100 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {busyId === s.id ? 'Loading…' : 'Nearby cities'}
                </button>
              </td>
              <td className="px-4 py-2.5 font-medium text-gray-800">{s.name}</td>
              <td className="px-4 py-2.5 text-gray-600">{s.email}</td>
              <td className="px-4 py-2.5 text-gray-600">{s.addressCity ? place(s.addressCity) : '—'}</td>
              <td className="px-4 py-2.5 font-mono text-xs text-gray-600">
                {s.addressCity
                  ? `${s.addressCity.latitude.toFixed(4)}, ${s.addressCity.longitude.toFixed(4)}`
                  : '—'}
              </td>
              <td className="px-4 py-2.5 text-gray-600">{s.productCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SuppliersPage() {
  const [nameFilter, setNameFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [radiusKm, setRadiusKm] = useState(500);

  const [suppliers, setSuppliers] = useState<RequestState<SupplierResponse[]>>(idleState());
  const [nearby, setNearby] = useState<RequestState<CityDistanceResponse[]>>(idleState());
  const [nearbyFor, setNearbyFor] = useState<SupplierResponse | null>(null);
  const [lastUrl, setLastUrl] = useState<string | null>(null);
  const [lastStatus, setLastStatus] = useState<number | null>(null);

  async function handleSearch() {
    const url = suppliersUrl();
    setLastUrl(url);
    setLastStatus(null);
    setSuppliers(loadingState());
    const next = await getJson<SupplierResponse[]>(url);
    setSuppliers(next);
    setLastStatus(next.status);
  }

  function handleReset() {
    setNameFilter('');
    setCityFilter('');
    setRadiusKm(500);
    setSuppliers(idleState());
    setNearby(idleState());
    setNearbyFor(null);
    setLastUrl(null);
    setLastStatus(null);
  }

  async function handleNearby(s: SupplierResponse) {
    if (!s.addressCity || radiusKm <= 0) return;
    const url = nearbyUrl(s.addressCity, radiusKm);
    setLastUrl(url);
    setLastStatus(null);
    setNearbyFor(s);
    setNearby(loadingState());
    const next = await getJson<CityDistanceResponse[]>(url);
    setNearby(next);
    setLastStatus(next.status);
  }

  const name = nameFilter.trim().toLowerCase();
  const city = cityFilter.trim().toLowerCase();
  const all = suppliers.data ?? [];
  const filtered = all.filter(
    s =>
      (!name || s.name.toLowerCase().includes(name)) &&
      (!city || (s.addressCity ? place(s.addressCity) : '').toLowerCase().includes(city)),
  );

  return (
    <div className="flex flex-col gap-4">
      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Suppliers — PostGIS</h1>
        <p className="mt-1 text-sm text-gray-500">
          Browse suppliers with their address city and coordinates, list every city, or find the cities
          within a radius of a supplier (distance computed by PostGIS on PostgreSQL). Powered by{' '}
          {[
            'GET /api/report/suppliers',
            'GET /api/report/cities',
            'GET /api/report/cities/nearby',
          ].map((endpoint, i, list) => (
            <span key={endpoint}>
              <code className="rounded bg-gray-100 px-1 py-0.5 text-xs text-gray-700">{endpoint}</code>
              {i < list.length - 1 ? ', ' : '.'}
            </span>
          ))}
        </p>
      </div>

      {/* ── Section 1 – Filters ── */}
      <SectionCard title="1- Filters">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex min-w-[160px] flex-1 flex-col gap-1">
            <FieldLabel>Name (contains)</FieldLabel>
            <input
              id="filter-name"
              type="text"
              value={nameFilter}
              onChange={e => { setNameFilter(e.target.value); }}
              placeholder="e.g. Acme"
              className={inputClass}
            />
          </div>

          <div className="flex min-w-[160px] flex-1 flex-col gap-1">
            <FieldLabel>City / country (contains)</FieldLabel>
            <input
              id="filter-city"
              type="text"
              value={cityFilter}
              onChange={e => { setCityFilter(e.target.value); }}
              placeholder="e.g. Brazil"
              className={inputClass}
            />
          </div>

          <div className="flex min-w-[140px] flex-1 flex-col gap-1">
            <FieldLabel>Nearby radius (km)</FieldLabel>
            <input
              id="filter-radius"
              type="number"
              min={1}
              value={radiusKm}
              onChange={e => { setRadiusKm(Number(e.target.value)); }}
              className={inputClass}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => void handleSearch()}
              disabled={suppliers.loading}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {suppliers.loading ? (
                <>
                  <Spinner className="h-3.5 w-3.5 border-white" />
                  Searching…
                </>
              ) : (
                'Search'
              )}
            </button>

            <Link
              to="/case-studies/suppliers/cities"
              className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
            >
              Show all cities
            </Link>

            <button
              onClick={handleReset}
              disabled={suppliers.loading}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Reset
            </button>
          </div>
        </div>

        {lastUrl && <RequestBar method="GET" url={lastUrl} status={lastStatus} />}
      </SectionCard>

      {/* ── Section 2 – Suppliers ── */}
      <SectionCard title="2- Suppliers">
        {suppliers.loading && (
          <div className="flex items-center gap-2 py-4 text-sm text-gray-500">
            <Spinner className="h-4 w-4 border-blue-500" />
            Fetching suppliers…
          </div>
        )}

        {suppliers.error && !suppliers.loading && <ErrorBox>{suppliers.error}</ErrorBox>}

        {suppliers.data && !suppliers.loading && (
          <>
            <p className="mb-4 text-sm text-gray-600">
              Showing <span className="font-semibold text-gray-800">{filtered.length}</span> of{' '}
              <span className="font-semibold text-gray-800">{all.length}</span> supplier
              {all.length !== 1 ? 's' : ''}
            </p>
            <SupplierTable
              suppliers={filtered}
              onNearby={s => void handleNearby(s)}
              busyId={nearby.loading ? (nearbyFor?.id ?? null) : null}
            />
          </>
        )}

        {!suppliers.data && !suppliers.loading && !suppliers.error && (
          <p className="text-sm text-gray-400">
            Hit <strong>Search</strong> to load suppliers.
          </p>
        )}
      </SectionCard>

      {/* ── Section 3 – Nearby cities (PostGIS) ── */}
      {nearbyFor?.addressCity && (
        <SectionCard
          title={`3- Cities within ${String(radiusKm)} km of ${place(nearbyFor.addressCity)} (${nearbyFor.name})`}
        >
          {nearby.loading && (
            <div className="flex items-center gap-2 py-4 text-sm text-gray-500">
              <Spinner className="h-4 w-4 border-blue-500" />
              Running the PostGIS query…
            </div>
          )}
          {nearby.error && !nearby.loading && <ErrorBox>{nearby.error}</ErrorBox>}
          {nearby.data && !nearby.loading && (
            <>
              <p className="mb-4 text-sm text-gray-600">
                <span className="font-semibold text-gray-800">{nearby.data.length}</span>{' '}
                {nearby.data.length === 1 ? 'city' : 'cities'}, nearest first
              </p>
              <CityTable cities={nearby.data} />
            </>
          )}
        </SectionCard>
      )}
    </div>
  );
}
