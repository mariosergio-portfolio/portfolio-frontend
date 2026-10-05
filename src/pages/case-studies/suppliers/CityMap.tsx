import type { CityResponse } from './api';

/** OpenStreetMap embed centred on a city, with a marker on its coordinates. */
export default function CityMap({ city }: { city: CityResponse | null }) {
  if (!city) {
    return (
      <div className="flex h-full min-h-64 items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-400">
        Click a city in the table to see it here.
      </div>
    );
  }

  const { latitude: lat, longitude: lon } = city;
  const d = 0.15; // half-size of the visible box, in degrees
  const bbox = [lon - d, lat - d, lon + d, lat + d].join(',');
  const embed = `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${String(lat)}%2C${String(lon)}`;
  const full = `https://www.openstreetmap.org/?mlat=${String(lat)}&mlon=${String(lon)}#map=11/${String(lat)}/${String(lon)}`;

  return (
    <div className="flex h-full flex-col gap-2">
      <div>
        <p className="font-semibold text-gray-800">
          {[city.name, city.state, city.country].filter(Boolean).join(', ')}
        </p>
        <p className="font-mono text-xs text-gray-500">
          {lat.toFixed(4)}, {lon.toFixed(4)}
        </p>
      </div>
      <iframe
        key={city.id}
        title={`Map of ${city.name}`}
        src={embed}
        className="min-h-96 w-full flex-1 rounded-xl border border-gray-200"
        loading="lazy"
      />
      <a href={full} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline">
        View larger map ↗
      </a>
    </div>
  );
}
