import { useState, useRef, useCallback } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CustomerResponse {
  customerPk: string;
  id: number;
  companyId: number;
  name: string;
  email: string;
  age: number | null;
  country: string | null;
  phone: string | null;
  createdAt: string;
}

interface CustomerPageResponse {
  total: number;
  customers: CustomerResponse[];
}

interface FetchState {
  data: CustomerPageResponse | null;
  error: string | null;
  loading: boolean;
  status: number | null;
}

type PlayState = 'idle' | 'loading' | 'playing' | 'error';

// ─── Constants ────────────────────────────────────────────────────────────────

const BASE_URL = (import.meta.env.VITE_CUSTOMERS_BASE as string | undefined)?.trim()
  ?? 'http://localhost:8082';

// All values from software.amazon.awssdk.services.polly.model.LanguageCode
const POLLY_LANGUAGES: { code: string; label: string }[] = [
  { code: 'arb',       label: 'Arabic (Standard)' },
  { code: 'ar-AE',     label: 'Arabic (Gulf)' },
  { code: 'ca-ES',     label: 'Catalan' },
  { code: 'cmn-CN',    label: 'Chinese (Mandarin)' },
  { code: 'yue-CN',    label: 'Chinese (Cantonese)' },
  { code: 'cs-CZ',     label: 'Czech' },
  { code: 'cy-GB',     label: 'Welsh' },
  { code: 'da-DK',     label: 'Danish' },
  { code: 'de-AT',     label: 'German (Austria)' },
  { code: 'de-CH',     label: 'German (Switzerland)' },
  { code: 'de-DE',     label: 'German' },
  { code: 'en-AU',     label: 'English (Australia)' },
  { code: 'en-GB',     label: 'English (UK)' },
  { code: 'en-GB-WLS', label: 'English (Welsh)' },
  { code: 'en-IE',     label: 'English (Ireland)' },
  { code: 'en-IN',     label: 'English (India)' },
  { code: 'en-NZ',     label: 'English (New Zealand)' },
  { code: 'en-SG',     label: 'English (Singapore)' },
  { code: 'en-US',     label: 'English (US)' },
  { code: 'en-ZA',     label: 'English (South Africa)' },
  { code: 'es-ES',     label: 'Spanish (Spain)' },
  { code: 'es-MX',     label: 'Spanish (Mexico)' },
  { code: 'es-US',     label: 'Spanish (US)' },
  { code: 'fi-FI',     label: 'Finnish' },
  { code: 'fr-BE',     label: 'French (Belgium)' },
  { code: 'fr-CA',     label: 'French (Canada)' },
  { code: 'fr-FR',     label: 'French' },
  { code: 'hi-IN',     label: 'Hindi' },
  { code: 'is-IS',     label: 'Icelandic' },
  { code: 'it-IT',     label: 'Italian' },
  { code: 'ja-JP',     label: 'Japanese' },
  { code: 'ko-KR',     label: 'Korean' },
  { code: 'nb-NO',     label: 'Norwegian' },
  { code: 'nl-BE',     label: 'Dutch (Belgium)' },
  { code: 'nl-NL',     label: 'Dutch' },
  { code: 'pl-PL',     label: 'Polish' },
  { code: 'pt-BR',     label: 'Portuguese (Brazil)' },
  { code: 'pt-PT',     label: 'Portuguese (Portugal)' },
  { code: 'ro-RO',     label: 'Romanian' },
  { code: 'ru-RU',     label: 'Russian' },
  { code: 'sv-SE',     label: 'Swedish' },
  { code: 'tr-TR',     label: 'Turkish' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildUrl(companyId: number, name: string, country: string, orderBy: string) {
  const params = new URLSearchParams();
  if (name.trim())    params.set('name',    name.trim());
  if (country.trim()) params.set('country', country.trim());
  params.set('orderBy', orderBy);
  return `${BASE_URL}/api/companies/${companyId}/customers?${params.toString()}`;
}

function buildPronounceUrl(customerPk: string, language: string) {
  return `${BASE_URL}/api/customers/${customerPk}/pronounce?language=${encodeURIComponent(language)}`;
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

// ─── PlayButton ───────────────────────────────────────────────────────────────

/**
 * Fetches audio/wav from the pronounce endpoint, decodes it via the Web Audio
 * API, and plays it. A global AudioContext is reused across all buttons to
 * avoid hitting the browser's context limit.
 */
let sharedAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
    sharedAudioCtx = new AudioContext();
  }
  return sharedAudioCtx;
}

function PlayButton({ customerPk, customerName, language }: {
  customerPk: string;
  customerName: string;
  language: string;
}) {
  const [playState,  setPlayState]  = useState<PlayState>('idle');
  const [errorTip,   setErrorTip]   = useState<string | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);

  const handlePlay = useCallback(async () => {
    // If already playing, stop immediately
    if (playState === 'playing') {
      sourceRef.current?.stop();
      sourceRef.current = null;
      setPlayState('idle');
      return;
    }

    setPlayState('loading');
    setErrorTip(null);

    try {
      const res = await fetch(buildPronounceUrl(customerPk, language));
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const arrayBuffer = await res.arrayBuffer();

      const ctx    = getAudioContext();
      // Resume context if it was suspended (browser autoplay policy)
      if (ctx.state === 'suspended') await ctx.resume();

      const decoded = await ctx.decodeAudioData(arrayBuffer);
      const source  = ctx.createBufferSource();
      source.buffer = decoded;
      source.connect(ctx.destination);

      source.onended = () => {
        setPlayState('idle');
        sourceRef.current = null;
      };

      sourceRef.current = source;
      setPlayState('playing');
      source.start(0);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorTip(msg);
      setPlayState('error');
      // Auto-reset error indicator after 3 s
      setTimeout(() => setPlayState('idle'), 3000);
    }
  }, [customerPk, language, playState]);

  // ── icon SVGs ──────────────────────────────────────────────────────────────
  const IconPlay = () => (
    <svg viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5">
      <path d="M3 2.5l10 5.5-10 5.5V2.5z" />
    </svg>
  );

  const IconStop = () => (
    <svg viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5">
      <rect x="3" y="3" width="10" height="10" rx="1" />
    </svg>
  );

  const IconError = () => (
    <svg viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5">
      <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm.75 4.25a.75.75 0 0 0-1.5 0v3.5a.75.75 0 0 0 1.5 0v-3.5zm-.75 6.5a.875.875 0 1 0 0-1.75.875.875 0 0 0 0 1.75z" />
    </svg>
  );

  const baseClass = 'flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-1';

  if (playState === 'loading') {
    return (
      <button disabled aria-label={`Loading audio for ${customerName}`}
        className={`${baseClass} bg-blue-50 text-blue-500 cursor-wait`}>
        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" />
        Loading
      </button>
    );
  }

  if (playState === 'playing') {
    return (
      <button onClick={handlePlay} aria-label={`Stop audio for ${customerName}`}
        className={`${baseClass} bg-green-100 text-green-700 hover:bg-red-100 hover:text-red-700 focus:ring-green-400`}>
        <IconStop />
        Playing
      </button>
    );
  }

  if (playState === 'error') {
    return (
      <button disabled title={errorTip ?? 'Playback error'} aria-label="Playback error"
        className={`${baseClass} bg-red-50 text-red-500 cursor-default`}>
        <IconError />
        Error
      </button>
    );
  }

  return (
    <button onClick={handlePlay} aria-label={`Play pronunciation of ${customerName}`}
      className={`${baseClass} bg-gray-100 text-gray-600 hover:bg-blue-100 hover:text-blue-700 focus:ring-blue-400`}>
      <IconPlay />
      Pronounce
    </button>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-100 px-6 py-4">
        <h2 className="text-base font-semibold text-gray-800">{title}</h2>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-xs font-semibold uppercase tracking-wide text-gray-400">
      {children}
    </label>
  );
}

function TextInput({
  id,
  value,
  onChange,
  placeholder,
  error,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  error?: string | null;
}) {
  return (
    <div className="flex flex-col gap-1">
      <input
        id={id}
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className={`rounded-lg border px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-1 ${
          error
            ? 'border-red-400 focus:border-red-500 focus:ring-red-500'
            : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
        }`}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

function StatusBadge({ status }: { status: number }) {
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

function CustomerTable({ customers, language }: { customers: CustomerResponse[]; language: string }) {
  if (customers.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 py-10 text-center text-sm text-gray-400">
        No customers found for the applied filters.
      </div>
    );
  }

  return (
    <div className="overflow-auto rounded-xl border border-gray-200">
      <table className="w-full text-sm">
        <thead className="sticky top-0 z-10 bg-gray-50">
          <tr>
            {['', 'ID', 'Name', 'Email', 'Age', 'Country', 'Phone'].map(h => (
              <th
                key={h}
                className="whitespace-nowrap px-4 py-2.5 text-left text-xs font-semibold text-gray-500"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {customers.map(c => (
            <tr key={c.id} className="hover:bg-gray-50">
              <td className="px-3 py-2">
                <PlayButton customerPk={c.customerPk} customerName={c.name} language={language} />
              </td>
              <td className="px-4 py-2.5 font-mono text-xs text-gray-700">{c.id}</td>
              <td className="px-4 py-2.5 font-medium text-gray-800">{c.name}</td>
              <td className="px-4 py-2.5 text-gray-600">{c.email}</td>
              <td className="px-4 py-2.5 text-gray-600">{c.age ?? '—'}</td>
              <td className="px-4 py-2.5 text-gray-600">{c.country ?? '—'}</td>
              <td className="px-4 py-2.5 font-mono text-xs text-gray-600">{c.phone ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const INITIAL_STATE: FetchState = { data: null, error: null, loading: false, status: null };

export default function CustomersPage() {
  const [companyId,      setCompanyId]      = useState<number>(1);
  const [nameFilter,     setNameFilter]     = useState('');
  const [countryFilter,  setCountryFilter]  = useState('');
  const [orderBy,        setOrderBy]        = useState<'id' | 'name'>('id');
  const [language,       setLanguage]       = useState('en-US');
  const [companyIdError, setCompanyIdError] = useState<string | null>(null);

  const [result, setResult] = useState<FetchState>(INITIAL_STATE);
  const [lastUrl, setLastUrl] = useState<string | null>(null);

  async function handleSearch() {
    if (!companyId || companyId <= 0) {
      setCompanyIdError('Company ID must be a positive number');
      return;
    }
    setCompanyIdError(null);

    const url = buildUrl(companyId, nameFilter, countryFilter, orderBy);
    setLastUrl(url);
    setResult({ data: null, error: null, loading: true, status: null });

    try {
      const res    = await fetch(url);
      const status = res.status;
      if (!res.ok) {
        const text = await res.text().catch(() => 'Unknown error');
        setResult({ data: null, error: `HTTP ${status}: ${text}`, loading: false, status });
        return;
      }
      const json: CustomerPageResponse = await res.json();
      setResult({ data: json, error: null, loading: false, status });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setResult({ data: null, error: msg, loading: false, status: null });
    }
  }

  function handleReset() {
    setCompanyId(1);
    setNameFilter('');
    setCountryFilter('');
    setOrderBy('id');
    setLanguage('en-US');
    setCompanyIdError(null);
    setResult(INITIAL_STATE);
    setLastUrl(null);
  }

  const { data, error, loading, status } = result;
  const customers = data?.customers ?? [];

  return (
    <div className="flex flex-col gap-4">

      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Customers API</h1>
        <p className="mt-1 text-sm text-gray-500">
          Browse and filter customers from the Planet Customers API by company, name, and country.
          Click <strong>Play</strong> on any row to hear the customer name pronounced.
          Powered by{' '}
          <code className="rounded bg-gray-100 px-1 py-0.5 text-xs text-gray-700">
            GET /api/companies/&#123;companyId&#125;/customers
          </code>
          {' '}and{' '}
          <code className="rounded bg-gray-100 px-1 py-0.5 text-xs text-gray-700">
            GET /api/customers/&#123;id&#125;/pronounce
          </code>
          .
        </p>
      </div>

      {/* ── Section 1 – Filters ── */}
      <SectionCard title="1- Filters">
        <div className="flex flex-wrap items-end gap-4">

          <div className="flex min-w-[160px] flex-1 flex-col gap-1">
            <FieldLabel>
              Company ID <span className="text-red-400">*</span>
            </FieldLabel>
            <input
              id="filter-company"
              type="number"
              min={1}
              value={companyId}
              onChange={e => { setCompanyId(Number(e.target.value)); setCompanyIdError(null); }}
              className={`rounded-lg border px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-1 ${
                companyIdError
                  ? 'border-red-400 focus:border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
              }`}
            />
            {companyIdError && <p className="text-xs text-red-500">{companyIdError}</p>}
          </div>

          <div className="flex min-w-[160px] flex-1 flex-col gap-1">
            <FieldLabel>Name (contains)</FieldLabel>
            <TextInput
              id="filter-name"
              value={nameFilter}
              onChange={setNameFilter}
              placeholder="e.g. John"
            />
          </div>

          <div className="flex min-w-[160px] flex-1 flex-col gap-1">
            <FieldLabel>Country (contains)</FieldLabel>
            <TextInput
              id="filter-country"
              value={countryFilter}
              onChange={setCountryFilter}
              placeholder="e.g. Brazil"
            />
          </div>

          <div className="flex min-w-[140px] flex-1 flex-col gap-1">
            <FieldLabel>Order by</FieldLabel>
            <select
              id="filter-order"
              value={orderBy}
              onChange={e => setOrderBy(e.target.value as 'id' | 'name')}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="id">ID</option>
              <option value="name">Name</option>
            </select>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleSearch}
              disabled={loading}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Searching…
                </>
              ) : (
                'Search'
              )}
            </button>

            <button
              onClick={handleReset}
              disabled={loading}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Live URL preview */}
        {lastUrl && (
          <div className="mt-4 rounded-lg bg-gray-50 px-3 py-2">
            <div className="flex items-center gap-2">
              <span className="shrink-0 text-xs font-bold text-blue-600">GET</span>
              <code className="break-all text-xs text-gray-500">{lastUrl}</code>
              {status && <StatusBadge status={status} />}
            </div>
          </div>
        )}
      </SectionCard>

      {/* ── Section 2 – Results ── */}
      <SectionCard title="2- Results">

        {/* Loading */}
        {loading && (
          <div className="flex items-center gap-2 py-4 text-sm text-gray-500">
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
            Fetching customers…
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Summary bar + language selector */}
        {data && !loading && (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <span className="text-sm text-gray-600">
              Showing{' '}
              <span className="font-semibold text-gray-800">{customers.length}</span>
              {' '}of{' '}
              <span className="font-semibold text-gray-800">{data.total}</span>
              {' '}customer{data.total !== 1 ? 's' : ''}
            </span>
            <div className="flex items-center gap-2">
              <label htmlFor="pronounce-lang" className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                Pronounce language
              </label>
              <select
                id="pronounce-lang"
                value={language}
                onChange={e => setLanguage(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {POLLY_LANGUAGES.map(l => (
                  <option key={l.code} value={l.code}>{l.label} ({l.code})</option>
                ))}
              </select>
            </div>
            {data.total > customers.length && (
              <span className="rounded-full bg-amber-50 px-3 py-0.5 text-xs text-amber-700">
                Page limited — API returned {customers.length} of {data.total} total
              </span>
            )}
          </div>
        )}

        {/* Table */}
        {data && !loading && <CustomerTable customers={customers} language={language} />}

        {/* Empty state */}
        {!data && !loading && !error && (
          <p className="text-sm text-gray-400">
            Set a Company ID and hit <strong>Search</strong> to load customers.
          </p>
        )}

      </SectionCard>
    </div>
  );
}
