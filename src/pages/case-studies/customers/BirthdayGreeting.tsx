import { greetingUrl, type BirthdayGreetingResponse, type RequestState } from './api';
import { ErrorBox, RequestBar, Spinner } from './shared';

const TONE_STYLES: Record<string, string> = {
  PLAYFUL: 'bg-pink-100 text-pink-700',
  CASUAL: 'bg-sky-100 text-sky-700',
  WARM: 'bg-amber-100 text-amber-700',
  FORMAL: 'bg-slate-200 text-slate-700',
  NEUTRAL: 'bg-gray-100 text-gray-600',
};
const NEUTRAL_STYLE = 'bg-gray-100 text-gray-600';

export function GreetingButton({
  customerName,
  loading,
  onClick,
}: {
  customerName: string;
  loading: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      aria-label={`Write a birthday greeting for ${customerName}`}
      className="flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600 transition-all hover:bg-purple-100 hover:text-purple-700 focus:ring-2 focus:ring-purple-400 focus:ring-offset-1 focus:outline-none disabled:cursor-wait disabled:opacity-60"
    >
      {loading ? <Spinner className="h-3 w-3 border-purple-500" /> : <span aria-hidden>🎂</span>}
      Greeting
    </button>
  );
}

/** Result of a birthday greeting request, shown in a table row under the customer. */
export function GreetingResult({
  customerPk,
  state,
  onClose,
}: {
  customerPk: string;
  state: RequestState<BirthdayGreetingResponse>;
  onClose: () => void;
}) {
  return (
    <div className="rounded-lg border border-purple-100 bg-purple-50/50 px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {state.loading && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Spinner className="h-4 w-4 border-purple-500" />
              Writing the greeting…
            </div>
          )}
          {state.error && !state.loading && <ErrorBox>{state.error}</ErrorBox>}
          {state.data && !state.loading && (
            <div className="flex flex-col gap-2">
              <p className="text-sm whitespace-pre-wrap text-gray-800">{state.data.message}</p>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>Tone from age:</span>
                <span
                  className={`rounded-full px-2 py-0.5 font-semibold ${
                    TONE_STYLES[state.data.tone] ?? NEUTRAL_STYLE
                  }`}
                >
                  {state.data.tone}
                </span>
              </div>
            </div>
          )}
          <RequestBar method="POST" url={greetingUrl(customerPk)} status={state.status} />
        </div>
        <button
          onClick={onClose}
          aria-label="Close greeting"
          className="shrink-0 rounded px-1.5 text-gray-400 hover:bg-white hover:text-gray-600"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
