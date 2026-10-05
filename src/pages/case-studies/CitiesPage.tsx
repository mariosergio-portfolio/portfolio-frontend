import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import {
  citiesUrl,
  getJson,
  idleState,
  loadingState,
  nearbyUrl,
  type CityDistanceResponse,
  type CityResponse,
  type RequestState,
} from './suppliers/api';
import CityMap from './suppliers/CityMap';
import CityTable from './suppliers/CityTable';
import { ErrorBox, FieldLabel, RequestBar, Spinner } from './customers/shared';

type Tab = 'all' | 'nearby';

export default function CitiesPage() {
  const [tab, setTab] = useState<Tab>('all');
  const [cities, setCities] = useState<RequestState<CityResponse[]>>(loadingState());
  const [selected, setSelected] = useState<CityResponse | null>(null);
  const [radiusKm, setRadiusKm] = useState(500);
  const [nearby, setNearby] = useState<RequestState<CityDistanceResponse[]>>(idleState());
  const [origin, setOrigin] = useState<{ city: CityResponse; radiusKm: number; url: string } | null>(null);
  const url = citiesUrl();

  async function handleNearby() {
    if (!selected || radiusKm <= 0) return;
    const nearbyRequestUrl = nearbyUrl(selected, radiusKm);
    setOrigin({ city: selected, radiusKm, url: nearbyRequestUrl });
    setNearby(loadingState());
    setNearby(await getJson<CityDistanceResponse[]>(nearbyRequestUrl));
  }

  useEffect(() => {
    let cancelled = false;
    void getJson<CityResponse[]>(citiesUrl()).then(next => {
      if (!cancelled) setCities(next);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const tabs: { id: Tab; label: string }[] = [
    { id: 'all', label: 'All cities' },
    { id: 'nearby', label: origin ? `Cities within ${String(origin.radiusKm)} km of ${origin.city.name}` : 'Nearby cities' },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Link to="/case-studies/suppliers" className="text-sm text-blue-600 hover:underline">
          ← Back to Suppliers
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">Cities</h1>
        <p className="mt-1 text-sm text-gray-500">
          Every city with its coordinates, and the cities nearest to a selected one. Powered by{' '}
          {['GET /api/report/cities', 'GET /api/report/cities/nearby'].map((endpoint, i, list) => (
            <span key={endpoint}>
              <code className="rounded bg-gray-100 px-1 py-0.5 text-xs text-gray-700">{endpoint}</code>
              {i < list.length - 1 ? ', ' : '.'}
            </span>
          ))}
        </p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        {/* ── Top tabs ── */}
        <div role="tablist" className="flex gap-1 border-b border-gray-200 px-4 pt-2">
          {tabs.map(t => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => {
                setTab(t.id);
              }}
              className={`-mb-px rounded-t-lg border-b-2 px-4 py-2 text-sm font-medium transition ${
                tab === t.id
                  ? 'border-blue-600 text-blue-700'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="px-6 py-5">
          {cities.loading && (
            <div className="flex items-center gap-2 py-4 text-sm text-gray-500">
              <Spinner className="h-4 w-4 border-blue-500" />
              Fetching cities…
            </div>
          )}
          {cities.error && !cities.loading && <ErrorBox>{cities.error}</ErrorBox>}

          {cities.data && !cities.loading && (
            <div className="flex flex-col gap-4 lg:flex-row">
              {/* Tab content */}
              <div className="min-w-0 lg:w-3/5">
                {tab === 'all' && (
                  <>
                    <p className="mb-4 text-sm text-gray-600">
                      <span className="font-semibold text-gray-800">{cities.data.length}</span>{' '}
                      {cities.data.length === 1 ? 'city' : 'cities'}. Click a row to see it on the map.
                    </p>
                    <CityTable cities={cities.data} onSelect={setSelected} selectedId={selected?.id} />
                    <RequestBar method="GET" url={url} status={cities.status} />
                  </>
                )}

                {tab === 'nearby' && (
                  <>
                    <div className="mb-4 flex flex-wrap items-end gap-3 rounded-lg bg-gray-50 px-4 py-3">
                      <div className="min-w-48 flex-1 text-sm text-gray-600">
                        {selected ? (
                          <>
                            Selected: <span className="font-semibold text-gray-800">{selected.name}</span>
                            {selected.state ? `, ${selected.state}` : ''}, {selected.country}
                          </>
                        ) : (
                          'Select a city in the “All cities” tab to find the ones near it.'
                        )}
                      </div>
                      <div className="flex flex-col gap-1">
                        <FieldLabel>Radius (km)</FieldLabel>
                        <input
                          type="number"
                          min={1}
                          value={radiusKm}
                          onChange={e => {
                            setRadiusKm(Number(e.target.value));
                          }}
                          className="w-32 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <button
                        onClick={() => void handleNearby()}
                        disabled={!selected || radiusKm <= 0 || nearby.loading}
                        className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {nearby.loading ? (
                          <>
                            <Spinner className="h-3.5 w-3.5 border-white" />
                            Searching…
                          </>
                        ) : (
                          'Find nearby cities'
                        )}
                      </button>
                    </div>

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
                          {nearby.data.length === 1 ? 'city' : 'cities'}, nearest first. Click a row to see it
                          on the map.
                        </p>
                        <CityTable cities={nearby.data} onSelect={setSelected} selectedId={selected?.id} />
                      </>
                    )}
                    {!nearby.loading && origin && (
                      <RequestBar method="GET" url={origin.url} status={nearby.status} />
                    )}
                  </>
                )}
              </div>

              {/* Map — shared by both tabs */}
              <div className="lg:w-2/5">
                <div className="lg:sticky lg:top-4 lg:h-[32rem]">
                  <CityMap city={selected} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
