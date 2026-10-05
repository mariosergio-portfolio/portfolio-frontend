import { useMemo, useState } from 'react';
import type { CityDistanceResponse, CityResponse } from './api';

type Row = CityResponse | CityDistanceResponse;
type SortKey = 'name' | 'state' | 'country' | 'latitude' | 'longitude' | 'distanceKm';
type SortDir = 'asc' | 'desc';

const TH = 'whitespace-nowrap px-4 py-2.5 text-left text-xs font-semibold text-gray-500';

function compare(a: Row, b: Row, key: SortKey): number {
  const x = key === 'distanceKm' ? ('distanceKm' in a ? a.distanceKm : null) : a[key];
  const y = key === 'distanceKm' ? ('distanceKm' in b ? b.distanceKm : null) : b[key];
  if (x === y) return 0;
  if (x === null) return 1; // empty values always last
  if (y === null) return -1;
  return typeof x === 'number' && typeof y === 'number'
    ? x - y
    : String(x).localeCompare(String(y), undefined, { sensitivity: 'base' });
}

/**
 * Cities table with click-to-sort headers (asc → desc → original order).
 * Shows a Distance column when the rows come from the PostGIS "nearby" query.
 */
export default function CityTable({
  cities,
  onSelect,
  selectedId,
}: {
  cities: Row[];
  /** When set, rows are clickable and call it with the clicked city. */
  onSelect?: (city: CityResponse) => void;
  selectedId?: string | null;
}) {
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir } | null>(null);

  const rows = useMemo(() => {
    if (!sort) return cities;
    const sign = sort.dir === 'asc' ? 1 : -1;
    return [...cities].sort((a, b) => sign * compare(a, b, sort.key));
  }, [cities, sort]);

  if (cities.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 py-10 text-center text-sm text-gray-400">
        No cities found.
      </div>
    );
  }

  const withDistance = 'distanceKm' in cities[0];
  const columns: { key: SortKey; label: string }[] = [
    { key: 'name', label: 'City' },
    { key: 'state', label: 'State' },
    { key: 'country', label: 'Country' },
    { key: 'latitude', label: 'Latitude' },
    { key: 'longitude', label: 'Longitude' },
    ...(withDistance ? [{ key: 'distanceKm' as const, label: 'Distance (km)' }] : []),
  ];

  function toggleSort(key: SortKey) {
    setSort(prev => {
      if (prev?.key !== key) return { key, dir: 'asc' };
      return prev.dir === 'asc' ? { key, dir: 'desc' } : null;
    });
  }

  return (
    <div className="max-h-[32rem] overflow-auto rounded-xl border border-gray-200">
      <table className="w-full text-sm">
        <thead className="sticky top-0 z-10 bg-gray-50">
          <tr>
            {columns.map(col => {
              const active = sort?.key === col.key;
              return (
                <th
                  key={col.key}
                  className={TH}
                  aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}
                >
                  <button
                    onClick={() => {
                      toggleSort(col.key);
                    }}
                    className={`flex items-center gap-1 font-semibold hover:text-gray-800 ${
                      active ? 'text-blue-700' : ''
                    }`}
                  >
                    {col.label}
                    <span aria-hidden className={active ? '' : 'opacity-30'}>
                      {active ? (sort.dir === 'asc' ? '▲' : '▼') : '↕'}
                    </span>
                  </button>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map(c => (
            <tr
              key={c.id}
              onClick={
                onSelect &&
                (() => {
                  onSelect(c);
                })
              }
              onKeyDown={
                onSelect &&
                (e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelect(c);
                  }
                })
              }
              tabIndex={onSelect ? 0 : undefined}
              aria-selected={onSelect ? c.id === selectedId : undefined}
              className={`${onSelect ? 'cursor-pointer' : ''} ${
                c.id === selectedId ? 'bg-blue-50' : 'hover:bg-gray-50'
              }`}
            >
              <td className="px-4 py-2 font-medium text-gray-800">{c.name}</td>
              <td className="px-4 py-2 text-gray-600">{c.state ?? '—'}</td>
              <td className="px-4 py-2 text-gray-600">{c.country}</td>
              <td className="px-4 py-2 font-mono text-xs text-gray-600">{c.latitude.toFixed(4)}</td>
              <td className="px-4 py-2 font-mono text-xs text-gray-600">{c.longitude.toFixed(4)}</td>
              {'distanceKm' in c && (
                <td className="px-4 py-2 font-mono text-xs text-gray-700">{c.distanceKm}</td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
