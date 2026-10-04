import { useState } from 'react';
import { BASE_URL, idleState, postJson, type AskResponse, type RequestState } from './api';
import { ErrorBox, FieldLabel, RequestBar, SectionCard, Spinner } from './shared';

const MAX_PROMPT = 8000;
const MAX_SYSTEM_PROMPT = 4000;
const URL = `${BASE_URL}/api/bedrock/ask`;

/** POST /api/bedrock/ask: sends a prompt (and optional system prompt) to the Bedrock model. */
export default function GeneralAssistantSection() {
  const [prompt, setPrompt] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [result, setResult] = useState<RequestState<AskResponse>>(idleState());
  const [asked, setAsked] = useState(false);
  const [inputError, setInputError] = useState<string | null>(null);

  async function handleAsk() {
    if (!prompt.trim()) {
      setInputError('Write a prompt first.');
      return;
    }
    setInputError(null);
    setAsked(true);
    setResult({ ...idleState<AskResponse>(), loading: true });
    const body = systemPrompt.trim()
      ? { systemPrompt: systemPrompt.trim(), prompt: prompt.trim() }
      : { prompt: prompt.trim() };
    setResult(await postJson<AskResponse>(URL, body));
  }

  const { data, error, loading, status } = result;

  return (
    <SectionCard title="4- General AI assistant">
      <p className="mb-4 text-sm text-gray-500">
        Send any prompt to the AI model behind the API. It is not tied to a company or a customer,
        and no customer data is added to it.
      </p>

      <div className="flex flex-col gap-1">
        <FieldLabel>Prompt</FieldLabel>
        <textarea
          id="general-ask-prompt"
          rows={3}
          maxLength={MAX_PROMPT}
          value={prompt}
          onChange={(e) => {
            setPrompt(e.target.value);
            setInputError(null);
          }}
          placeholder="e.g. Summarize what a customers API does in one sentence."
          className={`rounded-lg border px-3 py-2 text-sm text-gray-800 focus:ring-1 focus:outline-none ${
            inputError
              ? 'border-red-400 focus:border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
          }`}
        />
        {inputError && <p className="text-xs text-red-500">{inputError}</p>}
      </div>

      <details className="mt-3">
        <summary className="cursor-pointer text-xs font-semibold tracking-wide text-gray-400 uppercase">
          System prompt (optional)
        </summary>
        <textarea
          id="general-ask-system"
          rows={2}
          maxLength={MAX_SYSTEM_PROMPT}
          value={systemPrompt}
          onChange={(e) => {
            setSystemPrompt(e.target.value);
          }}
          placeholder="Instructions that steer the model, e.g. Answer in one short paragraph."
          className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
        />
      </details>

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
            setSystemPrompt('');
            setResult(idleState());
            setAsked(false);
            setInputError(null);
          }}
          disabled={loading}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Clear
        </button>
      </div>

      {asked && <RequestBar method="POST" url={URL} status={status} />}

      <div className="mt-4">
        {error && !loading && <ErrorBox>{error}</ErrorBox>}
        {data && !loading && (
          <div className="rounded-lg bg-gray-50 px-4 py-3 text-sm whitespace-pre-wrap text-gray-800">
            {data.answer}
          </div>
        )}
      </div>
    </SectionCard>
  );
}
