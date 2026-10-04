import { useState } from 'react';
import { BASE_URL, idleState, postJson, type CompanyQueryResponse, type RequestState } from './api';
import { ErrorBox, FieldLabel, RequestBar, SectionCard, Spinner } from './shared';

const MAX_PROMPT = 8000;

const EXAMPLES = [
  'Which countries have the most customers?',
  'List the 5 oldest customers',
  'How many customers are there per country?',
  'Customers from Norway whose name starts with A',
];

function cell(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return JSON.stringify(value);
}

function ResultTable({ rows }: { rows: Record<string, unknown>[] }) {
  const first = rows[0];
  if (!first) {
    return (
      <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 py-8 text-center text-sm text-gray-400">
        The query returned no rows.
      </div>
    );
  }
  const columns = Object.keys(first);
  return (
    <div className="max-h-96 overflow-auto rounded-xl border border-gray-200">
      <table className="w-full text-sm">
        <thead className="sticky top-0 z-10 bg-gray-50">
          <tr>
            {columns.map((c) => (
              <th
                key={c}
                className="px-4 py-2.5 text-left text-xs font-semibold whitespace-nowrap text-gray-500"
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((row, i) => (
            <tr key={i} className="hover:bg-gray-50">
              {columns.map((c) => (
                <td key={c} className="px-4 py-2 text-gray-700">
                  {cell(row[c])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * POST /api/companies/{companyId}/ask: the model only sees the table structure and the question; it
 * writes a SQL query and a short message, and the API runs the query read-only for the company.
 */
export default function CompanyAssistantSection({ companyId }: { companyId: number }) {
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState<RequestState<CompanyQueryResponse>>(idleState());
  const [lastUrl, setLastUrl] = useState<string | null>(null);
  const [inputError, setInputError] = useState<string | null>(null);

  async function handleAsk() {
    if (!companyId || companyId <= 0) {
      setInputError('Set a positive Company ID in the filters above.');
      return;
    }
    if (!prompt.trim()) {
      setInputError('Write a question first.');
      return;
    }
    setInputError(null);
    const url = `${BASE_URL}/api/companies/${String(companyId)}/ask`;
    setLastUrl(url);
    setResult({ ...idleState<CompanyQueryResponse>(), loading: true });
    setResult(await postJson<CompanyQueryResponse>(url, { prompt: prompt.trim() }));
  }

  const { data, error, loading, status } = result;

  return (
    <SectionCard title="3- Ask about the company">
      <p className="mb-4 text-sm text-gray-500">
        Ask a question about the customers of company <strong>{companyId}</strong> in plain
        language. The AI model receives only the table structure, never the customer data: it writes
        a SQL query, and the API runs it read-only for this company.
      </p>

      <div className="flex flex-col gap-1">
        <FieldLabel>Question</FieldLabel>
        <textarea
          id="company-ask-prompt"
          rows={3}
          maxLength={MAX_PROMPT}
          value={prompt}
          onChange={(e) => {
            setPrompt(e.target.value);
            setInputError(null);
          }}
          placeholder="e.g. Which countries have the most customers?"
          className={`rounded-lg border px-3 py-2 text-sm text-gray-800 focus:ring-1 focus:outline-none ${
            inputError
              ? 'border-red-400 focus:border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
          }`}
        />
        {inputError && <p className="text-xs text-red-500">{inputError}</p>}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-xs text-gray-400">Try:</span>
        {EXAMPLES.map((example) => (
          <button
            key={example}
            onClick={() => {
              setPrompt(example);
              setInputError(null);
            }}
            className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600 transition hover:bg-blue-100 hover:text-blue-700"
          >
            {example}
          </button>
        ))}
      </div>

      <div className="mt-4 flex gap-2">
        <button
          onClick={() => {
            void handleAsk();
          }}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <>
              <Spinner className="border-white" />
              Asking…
            </>
          ) : (
            'Ask'
          )}
        </button>
        <button
          onClick={() => {
            setPrompt('');
            setResult(idleState());
            setLastUrl(null);
            setInputError(null);
          }}
          disabled={loading}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Clear
        </button>
      </div>

      {lastUrl && <RequestBar method="POST" url={lastUrl} status={status} />}

      <div className="mt-4 flex flex-col gap-4">
        {error && !loading && <ErrorBox>{error}</ErrorBox>}

        {data && !loading && (
          <>
            <p className="rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-900">{data.message}</p>

            <div>
              <FieldLabel>SQL generated by the model</FieldLabel>
              <pre className="mt-1 overflow-x-auto rounded-lg bg-gray-900 px-4 py-3 text-xs whitespace-pre-wrap text-gray-100">
                {data.sql}
              </pre>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-sm text-gray-600">
                <span className="font-semibold text-gray-800">{data.rowCount}</span> row
                {data.rowCount === 1 ? '' : 's'} returned
              </span>
              <ResultTable rows={data.rows} />
            </div>
          </>
        )}
      </div>
    </SectionCard>
  );
}
