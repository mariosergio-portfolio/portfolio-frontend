import { useCallback, useEffect, useRef, useState } from 'react';
import * as echarts from 'echarts';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CounterItem {
  number: number;
  completedTime: string;
  completedTimeMs: number;
  processId: string;
}

interface ApiSummary {
  request: {
    n: number;
    countDelay: number;
    parallelProcess: string;
  };
  response: {
    startTime: string;
    endTime: string;
    durationMs: number;
    durationFormatted: string;
  };
}

interface ApiResponse {
  summary: ApiSummary;
  counters: CounterItem[];
}

interface ServerResult {
  data: ApiResponse | null;
  error: string | null;
  loading: boolean;
  status: number | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────

interface ServerEnv {
  label: string;
  javaBase: string;
  goBase: string;
}

function loadServerEnvs(): ServerEnv[] {
  const envs: ServerEnv[] = [];
  let i = 0;
  while (true) {
    const label    = (import.meta.env[`VITE_PARALLELISM_ENV_${i}_LABEL`]     as string | undefined)?.trim();
    const javaBase = (import.meta.env[`VITE_PARALLELISM_ENV_${i}_JAVA_BASE`] as string | undefined)?.trim();
    const goBase   = (import.meta.env[`VITE_PARALLELISM_ENV_${i}_GO_BASE`]   as string | undefined)?.trim();
    if (!label || !javaBase || !goBase) break;
    envs.push({ label, javaBase, goBase });
    i++;
  }
  return envs;
}

const SERVER_ENVS: ServerEnv[] = loadServerEnvs();

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildUrl(base: string, n: number, countDelay: number, parallelProcess: number) {
  return `${base}/api/counter?n=${n}&countDelay=${countDelay}&parallelProcess=${parallelProcess}`;
}

function uniqueThreads(counters: CounterItem[]): string[] {
  return [...new Set(counters.map(c => c.processId))];
}

function minCompletedTime(counters: CounterItem[]): string {
  return counters.reduce((min, c) => (c.completedTime < min ? c.completedTime : min), counters[0]?.completedTime ?? '');
}

function maxCompletedTime(counters: CounterItem[]): string {
  return counters.reduce((max, c) => (c.completedTime > max ? c.completedTime : max), counters[0]?.completedTime ?? '');
}

// ─── DragHandle ───────────────────────────────────────────────────────────────

interface DragHandleProps {
  onDrag: (deltaY: number) => void;
}

function DragHandle({ onDrag }: DragHandleProps) {
  const dragging   = useRef(false);
  const lastY      = useRef(0);
  const [active, setActive] = useState(false);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragging.current = true;
    lastY.current    = e.clientY;
    setActive(true);

    const onMove = (ev: MouseEvent) => {
      if (!dragging.current) return;
      const delta = ev.clientY - lastY.current;
      lastY.current = ev.clientY;
      onDrag(delta);
    };

    const onUp = () => {
      dragging.current = false;
      setActive(false);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [onDrag]);

  return (
    <div
      onMouseDown={onMouseDown}
      className="group relative flex cursor-row-resize items-center justify-center py-1 select-none"
      title="Drag to resize"
    >
      {/* track line */}
      <div className={`h-px w-full transition-colors ${active ? 'bg-blue-400' : 'bg-gray-200 group-hover:bg-blue-300'}`} />

      {/* pill */}
      <div className={`absolute flex items-center gap-1 rounded-full border px-3 py-1 shadow-sm transition-all
        ${active
          ? 'border-blue-400 bg-blue-50 scale-105'
          : 'border-gray-200 bg-white group-hover:border-blue-300 group-hover:bg-blue-50'
        }`}
      >
        {/* three horizontal dots */}
        <svg width="16" height="8" viewBox="0 0 16 8" fill="none" className={`transition-colors ${active ? 'text-blue-500' : 'text-gray-400 group-hover:text-blue-400'}`}>
          <line x1="1" y1="2" x2="15" y2="2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          <line x1="1" y1="6" x2="15" y2="6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </div>
    </div>
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

function StatRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 py-1.5">
      <span className="text-sm text-gray-500">{label}</span>
      <span className={`text-sm font-medium ${highlight ? 'text-blue-600' : 'text-gray-800'}`}>{value}</span>
    </div>
  );
}

function ServerPanel({ label, color, result }: { label: string; color: 'blue' | 'amber'; result: ServerResult }) {
  const accent = color === 'blue' ? 'bg-blue-600' : 'bg-amber-500';
  const border  = color === 'blue' ? 'border-blue-200' : 'border-amber-200';
  const badge   = color === 'blue' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700';

  return (
    <div className={`flex-1 rounded-xl border ${border} bg-white shadow-sm`}>
      <div className={`flex items-center gap-3 rounded-t-xl ${accent} px-5 py-3`}>
        <span className="text-sm font-bold text-white">{label}</span>
        {result.status && (
          <span className="ml-auto rounded-full bg-white/20 px-2 py-0.5 text-xs font-medium text-white">
            HTTP {result.status}
          </span>
        )}
      </div>

      <div className="px-5 py-4">
        {result.loading && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            Waiting for response…
          </div>
        )}

        {result.error && !result.loading && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {result.error}
          </div>
        )}

        {result.data && !result.loading && (() => {
          const { summary, counters } = result.data;
          const threads = uniqueThreads(counters);
          return (
            <div className="space-y-4">
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">Request</p>
                <div className="divide-y divide-gray-100 rounded-lg border border-gray-100">
                  <StatRow label="n" value={String(summary.request.n)} />
                  <StatRow label="countDelay" value={`${summary.request.countDelay} ms`} />
                  <StatRow label="parallelProcess" value={String(summary.request.parallelProcess)} />
                </div>
              </div>

              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">Timing</p>
                <div className="divide-y divide-gray-100 rounded-lg border border-gray-100">
                  <StatRow label="Start" value={summary.response.startTime} />
                  <StatRow label="End" value={summary.response.endTime} />
                  <StatRow label="Duration" value={summary.response.durationFormatted} highlight />
                  <StatRow label="Duration (ms)" value={`${summary.response.durationMs} ms`} highlight />
                </div>
              </div>

              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Threads / Goroutines ({threads.length})
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {threads.map(t => (
                    <span key={t} className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${badge}`}>
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Counters ({counters.length} items)
                </p>
                <div className="max-h-52 overflow-y-auto rounded-lg border border-gray-100">
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left font-semibold text-gray-500">#</th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-500">Process ID</th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-500">Completed Time</th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-500">Ms</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {counters.slice(0, 200).map(c => (
                        <tr key={c.number} className="hover:bg-gray-50">
                          <td className="px-3 py-1.5 font-mono text-gray-700">{c.number}</td>
                          <td className="px-3 py-1.5 text-gray-600">{c.processId}</td>
                          <td className="px-3 py-1.5 font-mono text-gray-500">{c.completedTime}</td>
                          <td className="px-3 py-1.5 font-mono text-gray-500">{c.completedTimeMs}</td>
                        </tr>
                      ))}
                      {counters.length > 200 && (
                        <tr>
                          <td colSpan={4} className="px-3 py-2 text-center text-gray-400">
                            … {counters.length - 200} more rows hidden
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          );
        })()}

        {!result.loading && !result.error && !result.data && (
          <p className="text-sm text-gray-400">No data yet. Hit <strong>Run</strong> to call this server.</p>
        )}
      </div>
    </div>
  );
}

// ─── DurationChart ────────────────────────────────────────────────────────────

function DurationChart({ javaDuration, goDuration }: { javaDuration: number; goDuration: number }) {
  const chartRef     = useRef<HTMLDivElement>(null);
  const chartInst    = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;
    chartInst.current = echarts.init(chartRef.current);
    const ro = new ResizeObserver(() => chartInst.current?.resize());
    ro.observe(chartRef.current);
    return () => { chartInst.current?.dispose(); ro.disconnect(); };
  }, []);

  useEffect(() => {
    const chart = chartInst.current;
    if (!chart) return;
    chart.clear();
    chart.setOption({
      animation: true,
      animationDuration: 3500,
      animationEasing: 'elasticOut',
      grid: { top: 24, bottom: 40, left: 16, right: 16, containLabel: true },
      xAxis: {
        type: 'category',
        data: ['Java', 'Go'],
        axisLabel: { fontWeight: 'bold' },
        axisTick: { show: false },
        axisLine: { show: false },
      },
      yAxis: {
        type: 'value',
        name: 'ms',
        nameTextStyle: { color: '#9ca3af', fontSize: 11 },
        axisLabel: { color: '#9ca3af', fontSize: 11 },
        splitLine: { lineStyle: { color: '#f3f4f6' } },
      },
      series: [{
        type: 'bar',
        barMaxWidth: 48,
        data: [
          { value: javaDuration, itemStyle: { color: '#2563eb', borderRadius: [6, 6, 0, 0] } },
          { value: goDuration,   itemStyle: { color: '#f59e0b', borderRadius: [6, 6, 0, 0] } },
        ],
        label: { show: true, position: 'top', formatter: '{c} ms', fontSize: 11, color: '#374151', fontWeight: 'bold' },
      }],
      tooltip: { trigger: 'axis', formatter: (p: any) => `${p[0].name}: <b>${p[0].value} ms</b>` },
    });
  }, [javaDuration, goDuration]);

  return <div ref={chartRef} className="h-full w-full" />;
}

// ─── CountersLineChart ───────────────────────────────────────────────────────

function CountersLineChart({ javaCounters, goCounters }: { javaCounters: CounterItem[]; goCounters: CounterItem[] }) {
  const chartRef  = useRef<HTMLDivElement>(null);
  const chartInst = useRef<echarts.ECharts | null>(null);

  // Init chart once
  useEffect(() => {
    if (!chartRef.current) return;
    chartInst.current = echarts.init(chartRef.current);
    const ro = new ResizeObserver(() => chartInst.current?.resize());
    ro.observe(chartRef.current);
    return () => { chartInst.current?.dispose(); ro.disconnect(); };
  }, []);

  // Update data with animation
  useEffect(() => {
    const chart = chartInst.current;
    if (!chart) return;

    const javaSorted = [...javaCounters].sort((a, b) => a.completedTimeMs - b.completedTimeMs);
    const goSorted   = [...goCounters].sort((a, b)   => a.completedTimeMs - b.completedTimeMs);

    const allMs = [
      ...javaSorted.map(c => c.completedTimeMs),
      ...goSorted.map(c => c.completedTimeMs),
    ];
    const base = allMs.length ? Math.min(...allMs) : 0;

    const javaData = javaSorted.map(c => [c.completedTimeMs - base, c.number]);
    const goData   = goSorted.map(c =>   [c.completedTimeMs - base, c.number]);

    chart.setOption({
      animation: true,
      animationDuration: 3000,
      animationEasing: 'cubicOut',
      animationDurationUpdate: 1800,
      animationEasingUpdate: 'cubicInOut',
      grid: { top: 24, bottom: 40, left: 16, right: 16, containLabel: true },
      tooltip: { trigger: 'axis', formatter: (p: any) => `${p[0]?.axisValue} ms<br/>${p.map((s: any) => `${s.seriesName}: #${s.data[1]}`).join('<br/>')}` },
      legend: { bottom: 0, textStyle: { fontSize: 11, color: '#6b7280' } },
      xAxis: {
        type: 'value',
        name: 'ms',
        nameTextStyle: { color: '#9ca3af', fontSize: 11 },
        axisLabel: { color: '#9ca3af', fontSize: 10 },
        splitLine: { lineStyle: { color: '#f3f4f6' } },
      },
      yAxis: {
        type: 'value',
        name: '#',
        nameTextStyle: { color: '#9ca3af', fontSize: 11 },
        axisLabel: { color: '#9ca3af', fontSize: 10 },
        splitLine: { show: false },
      },
      series: [
        {
          name: 'Java',
          type: 'line',
          data: javaData,
          showSymbol: false,
          lineStyle: { color: '#2563eb', width: 2 },
          itemStyle: { color: '#2563eb' },
          animationDelay: 0,
        },
        {
          name: 'Go',
          type: 'line',
          data: goData,
          showSymbol: false,
          lineStyle: { color: '#f59e0b', width: 2 },
          itemStyle: { color: '#f59e0b' },
          animationDelay: 400,
        },
      ],
    }, true);
  }, [javaCounters, goCounters]);

  return <div ref={chartRef} className="h-full w-full" />;
}

// ─── WinnerBanner ────────────────────────────────────────────────────────────

function WinnerBanner({ java, go, lastParams }: {
  java: ServerResult;
  go: ServerResult;
  lastParams: { n: number; countDelay: number; parallelProcess: number; envLabel: string } | null;
}) {
  const lastJavaData = useRef<ApiResponse | null>(null);
  const lastGoData   = useRef<ApiResponse | null>(null);

  if (java.data)  lastJavaData.current = java.data;
  if (go.data)    lastGoData.current   = go.data;

  const jData = lastJavaData.current;
  const gData = lastGoData.current;

  const javaDuration = jData?.summary.response.durationMs ?? 0;
  const goDuration   = gData?.summary.response.durationMs ?? 0;
  const diff         = Math.abs(javaDuration - goDuration);
  const faster       = jData && gData ? (javaDuration < goDuration ? 'Java' : goDuration < javaDuration ? 'Go' : null) : null;
  const speedupPct   = faster ? ((diff / Math.max(javaDuration, goDuration)) * 100).toFixed(1) : '0';
  const winnerDurationMs       = faster === 'Java' ? javaDuration : goDuration;
  const winnerDurationFormatted = faster === 'Java'
    ? jData!.summary.response.durationFormatted
    : gData?.summary.response.durationFormatted ?? '';
  const winnerBorder = faster === 'Java' ? 'border-blue-300 bg-blue-50'
    : faster === 'Go' ? 'border-amber-300 bg-amber-50'
    : 'border-gray-200 bg-gray-50';
  const winnerColor  = faster === 'Java' ? 'text-blue-600' : faster === 'Go' ? 'text-amber-600' : 'text-gray-600';

  return (
    <div className="mb-4 flex items-stretch gap-4">

      {/* Left – last run params */}
      {lastParams && (
        <div className="flex w-96 flex-col justify-center gap-1 rounded-xl border border-gray-200 bg-white px-8 py-6 shadow-sm">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Last run</p>
          <div className="space-y-1 text-xs text-gray-600">
            <div className="flex gap-2"><span className="w-36 shrink-0 text-gray-400">Environment</span><span className="font-medium">{lastParams.envLabel}</span></div>
            <div className="flex gap-2"><span className="w-36 shrink-0 text-gray-400">n</span><span className="font-mono font-medium">{lastParams.n}</span></div>
            <div className="flex gap-2"><span className="w-36 shrink-0 text-gray-400">countDelay</span><span className="font-mono font-medium">{lastParams.countDelay} ms</span></div>
            <div className="flex gap-2"><span className="w-36 shrink-0 text-gray-400">parallelProcess</span><span className="font-mono font-medium">{lastParams.parallelProcess}</span></div>
          </div>
        </div>
      )}

      {/* Right – winner */}
      <div className={`flex flex-1 flex-col items-center justify-center rounded-xl border-2 px-6 py-4 text-center shadow-sm ${winnerBorder}`}>
        {faster ? (
          <>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Fastest response</p>
            <p className={`mt-1 text-3xl font-extrabold ${winnerColor}`}>{faster}</p>
            <p className="mt-1 text-sm text-gray-600">
              {diff} ms faster — <strong>{speedupPct}%</strong> improvement
            </p>
            <p className="mt-2 text-xs text-gray-600">
              Duration: <span className="font-mono font-medium text-gray-800">{winnerDurationMs} ms</span>
              {winnerDurationFormatted && (
                <span className="ml-1 text-gray-600">({winnerDurationFormatted})</span>
              )}
            </p>
          </>
        ) : jData && gData ? (
          <>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Result</p>
            <p className="mt-1 text-2xl font-bold text-gray-700">Tie</p>
            <p className="mt-1 text-sm text-gray-500">Both servers responded in exactly the same time.</p>
          </>
        ) : (
          <p className="text-sm text-gray-400">Run to see results.</p>
        )}
      </div>

      {/* Right – bar chart */}
      <div className="flex w-96 flex-col justify-center rounded-xl border border-gray-200 bg-white px-4 py-4 shadow-sm">
        <p className="mb-1 text-center text-xs font-semibold uppercase tracking-wide text-gray-400">Duration (ms)</p>
        <div className="h-40">
          <DurationChart javaDuration={javaDuration} goDuration={goDuration} />
        </div>
      </div>

      {/* Far right – line chart */}
      <div className="flex flex-1 flex-col justify-center rounded-xl border border-gray-200 bg-white px-4 py-4 shadow-sm">
        <p className="mb-1 text-center text-xs font-semibold uppercase tracking-wide text-gray-400">Counters completion time</p>
        <div className="h-40">
          <CountersLineChart javaCounters={jData?.counters ?? []} goCounters={gData?.counters ?? []} />
        </div>
      </div>
    </div>
  );
}

// ─── Conclusion ───────────────────────────────────────────────────────────────

function Conclusion({ java, go }: { java: ServerResult; go: ServerResult }) {
  const bothReady = java.data && go.data;
  const anyError  = (java.error || go.error) && !bothReady;

  if (!java.data && !go.data && !anyError) {
    return (
      <SectionCard title="3- Conclusion">
        <p className="text-sm text-gray-400">Run both servers to see the comparison.</p>
      </SectionCard>
    );
  }

  if (anyError) {
    return (
      <SectionCard title="3- Conclusion">
        <p className="text-sm text-amber-600">One or both requests failed — fix the errors above to compare results.</p>
      </SectionCard>
    );
  }

  if (!bothReady) {
    return (
      <SectionCard title="3- Conclusion">
        <p className="text-sm text-gray-400">Waiting for both responses…</p>
      </SectionCard>
    );
  }

  const jd = java.data!;
  const gd = go.data!;

  const javaDuration  = jd.summary.response.durationMs;
  const goDuration    = gd.summary.response.durationMs;
  const diff          = Math.abs(javaDuration - goDuration);
  const faster        = javaDuration < goDuration ? 'Java' : goDuration < javaDuration ? 'Go' : null;
  const speedupPct    = faster ? ((diff / Math.max(javaDuration, goDuration)) * 100).toFixed(1) : '0';

  const javaThreads   = uniqueThreads(jd.counters);
  const goThreads     = uniqueThreads(gd.counters);

  const javaMin = minCompletedTime(jd.counters);
  const javaMax = maxCompletedTime(jd.counters);
  const goMin   = minCompletedTime(gd.counters);
  const goMax   = maxCompletedTime(gd.counters);

  const winnerColor = faster === 'Java' ? 'text-blue-600' : faster === 'Go' ? 'text-amber-600' : 'text-gray-600';

  return (
    <SectionCard title="3- Conclusion">
      <div className="space-y-6">

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Metrics Comparison</p>
          <div className="overflow-hidden rounded-xl border border-gray-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-2.5 text-left font-semibold text-gray-500">Metric</th>
                  <th className="px-4 py-2.5 text-center font-semibold text-blue-600">Java</th>
                  <th className="px-4 py-2.5 text-center font-semibold text-amber-600">Go</th>
                  <th className="px-4 py-2.5 text-center font-semibold text-gray-500">Winner</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="px-4 py-2.5 text-gray-600">Duration (ms)</td>
                  <td className={`px-4 py-2.5 text-center font-mono font-medium ${javaDuration <= goDuration ? 'text-blue-600' : 'text-gray-700'}`}>{javaDuration}</td>
                  <td className={`px-4 py-2.5 text-center font-mono font-medium ${goDuration <= javaDuration ? 'text-amber-600' : 'text-gray-700'}`}>{goDuration}</td>
                  <td className="px-4 py-2.5 text-center">
                    {javaDuration < goDuration ? '🔵 Java' : goDuration < javaDuration ? '🟡 Go' : '🤝 Tie'}
                  </td>
                </tr>
                <tr className="bg-gray-50/50">
                  <td className="px-4 py-2.5 text-gray-600">Duration (formatted)</td>
                  <td className="px-4 py-2.5 text-center font-mono text-xs text-gray-700">{jd.summary.response.durationFormatted}</td>
                  <td className="px-4 py-2.5 text-center font-mono text-xs text-gray-700">{gd.summary.response.durationFormatted}</td>
                  <td className="px-4 py-2.5 text-center text-gray-400">—</td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 text-gray-600">Threads / Goroutines</td>
                  <td className="px-4 py-2.5 text-center font-mono font-medium text-gray-700">{javaThreads.length}</td>
                  <td className="px-4 py-2.5 text-center font-mono font-medium text-gray-700">{goThreads.length}</td>
                  <td className="px-4 py-2.5 text-center text-gray-400">—</td>
                </tr>
                <tr className="bg-gray-50/50">
                  <td className="px-4 py-2.5 text-gray-600">Total counters </td>
                  <td className="px-4 py-2.5 text-center font-mono font-medium text-gray-700">{jd.counters.length}</td>
                  <td className="px-4 py-2.5 text-center font-mono font-medium text-gray-700">{gd.counters.length}</td>
                  <td className="px-4 py-2.5 text-center">
                    {jd.counters.length === gd.counters.length ? '🤝 Tie' : jd.counters.length > gd.counters.length ? '🔵 Java' : '🟡 Go'}
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 text-gray-600">First counter completed</td>
                  <td className="px-4 py-2.5 text-center font-mono text-xs text-gray-700">{javaMin}</td>
                  <td className="px-4 py-2.5 text-center font-mono text-xs text-gray-700">{goMin}</td>
                  <td className="px-4 py-2.5 text-center text-gray-400">—</td>
                </tr>
                <tr className="bg-gray-50/50">
                  <td className="px-4 py-2.5 text-gray-600">Last counter completed</td>
                  <td className="px-4 py-2.5 text-center font-mono text-xs text-gray-700">{javaMax}</td>
                  <td className="px-4 py-2.5 text-center font-mono text-xs text-gray-700">{goMax}</td>
                  <td className="px-4 py-2.5 text-center text-gray-400">—</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-lg border border-gray-100 bg-gray-50 px-5 py-4 text-sm leading-relaxed text-gray-600">
          <strong className="text-gray-800">Analysis:</strong>{' '}
          {faster ? (
            <>
              <span className={winnerColor + ' font-semibold'}>{faster}</span> completed the task in{' '}
              <strong>{faster === 'Java' ? javaDuration : goDuration} ms</strong> vs{' '}
              <strong>{faster === 'Java' ? goDuration : javaDuration} ms</strong> for the other server — a{' '}
              <strong>{speedupPct}%</strong> speed advantage over {diff} ms.{' '}
              Java used <strong>{javaThreads.length}</strong> thread{javaThreads.length !== 1 ? 's' : ''} from its
              thread pool while Go used <strong>{goThreads.length}</strong> goroutine{goThreads.length !== 1 ? 's' : ''}.{' '}
              {javaThreads.length === goThreads.length
                ? 'Both runtimes exercised the same level of parallelism.'
                : javaThreads.length > goThreads.length
                  ? 'Java spread the work across more threads, trading memory for throughput.'
                  : 'Go multiplexed more work per goroutine, reflecting its lightweight concurrency model.'}
            </>
          ) : (
            <>Both servers completed the task in exactly <strong>{javaDuration} ms</strong>,
            using <strong>{javaThreads.length}</strong> Java threads and <strong>{goThreads.length}</strong> Go goroutines respectively.</>
          )}
        </div>

      </div>
    </SectionCard>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const DEFAULT_N                = 8;
const DEFAULT_COUNT_DELAY      = 1000;
const DEFAULT_PARALLEL_PROCESS = 8;
const MIN_HEIGHT               = 80;

export default function ParallelismPage() {
  const [n,               setN]               = useState(DEFAULT_N);
  const [countDelay,      setCountDelay]      = useState(DEFAULT_COUNT_DELAY);
  const [parallelProcess, setParallelProcess] = useState(DEFAULT_PARALLEL_PROCESS);
  const [parallelProcessError, setParallelProcessError] = useState<string | null>(null);
  const [nError,               setNError]               = useState<string | null>(null);
  const [countDelayError,      setCountDelayError]      = useState<string | null>(null);
  const [serverEnvIdx,         setServerEnvIdx]         = useState(0);
  const [lastParams, setLastParams] = useState<{ n: number; countDelay: number; parallelProcess: number; envLabel: string } | null>(null);
  const [runKey, setRunKey] = useState(0);

  const serverEnv = SERVER_ENVS[serverEnvIdx];

  const [java, setJava] = useState<ServerResult>({ data: null, error: null, loading: false, status: null });
  const [go,   setGo]   = useState<ServerResult>({ data: null, error: null, loading: false, status: null });

  // Heights for the three sections (null = auto / unconstrained)
  const [h1, setH1] = useState<number | null>(null);
  const [h2, setH2] = useState<number | null>(null);

  const sec1Ref = useRef<HTMLDivElement>(null);
  const sec2Ref = useRef<HTMLDivElement>(null);

  const handleDrag1 = useCallback((delta: number) => {
    const current = sec1Ref.current?.getBoundingClientRect().height ?? (h1 ?? 200);
    setH1(Math.max(MIN_HEIGHT, current + delta));
  }, [h1]);

  const handleDrag2 = useCallback((delta: number) => {
    const current = sec2Ref.current?.getBoundingClientRect().height ?? (h2 ?? 200);
    setH2(Math.max(MIN_HEIGHT, current + delta));
  }, [h2]);

  async function fetchServer(
    base: string,
    setter: React.Dispatch<React.SetStateAction<ServerResult>>,
  ) {
    setter({ data: null, error: null, loading: true, status: null });
    try {
      const url = buildUrl(base, n, countDelay, parallelProcess);
      const res = await fetch(url);
      const status = res.status;
      if (!res.ok) {
        const text = await res.text().catch(() => 'Unknown error');
        setter({ data: null, error: `HTTP ${status}: ${text}`, loading: false, status });
        return;
      }
      const json: ApiResponse = await res.json();
      setter({ data: json, error: null, loading: false, status });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setter({ data: null, error: msg, loading: false, status: null });
    }
  }

  function handleRun() {
    let valid = true;
    if (n > 5000000) {
      setNError('Value must be ≤ 5,000,000');
      valid = false;
    } else {
      setNError(null);
    }
    if (countDelay > 1000) {
      setCountDelayError('Value must be ≤ 1,000');
      valid = false;
    } else {
      setCountDelayError(null);
    }
    if (parallelProcess < -1 || parallelProcess > 500000) {
      setParallelProcessError('Value must be between -1 and 500,000');
      valid = false;
    } else {
      setParallelProcessError(null);
    }
    if (!valid) return;
    setRunKey(k => k + 1);
    setLastParams({ n, countDelay, parallelProcess, envLabel: serverEnv.label });
    setJava({ data: null, error: null, loading: true, status: null });
    setGo(  { data: null, error: null, loading: true, status: null });
    fetchServer(serverEnv.javaBase, setJava);
    fetchServer(serverEnv.goBase,   setGo);
  }

  const running = java.loading || go.loading;

  return (
    <div className="flex flex-col">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Parallelism — Java vs Go</h1>
        <p className="mt-1 text-sm text-gray-500">
          Compare parallel counter execution between a Java thread-pool server and a Go goroutine server.
        </p>
      </div>

      {/* ── Section 1 – Parameters ── */}
      <div
        ref={sec1Ref}
        style={h1 !== null ? { height: h1, overflow: 'auto' } : undefined}
      >
        <SectionCard title="1- Parameters">
          <div className="flex flex-wrap items-end gap-4">

            <div className="flex min-w-[180px] flex-1 flex-col gap-1">
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-400" htmlFor="param-env">
                Server environment
              </label>
              <select
                id="param-env"
                value={serverEnvIdx}
                onChange={e => setServerEnvIdx(Number(e.target.value))}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {SERVER_ENVS.map((env, i) => (
                  <option key={i} value={i}>{env.label}</option>
                ))}
              </select>
            </div>

            <div className="flex min-w-[160px] flex-1 flex-col gap-1">
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-400" htmlFor="param-n">
                n (total count)
                <span className="block text-[11px] font-normal normal-case tracking-normal text-gray-400">* total number of interactions, simulates blocking server-side requests to external services</span>
              </label>
              <input
                id="param-n"
                type="number"
                min={1}
                max={5000000}
                value={n}
                onChange={e => { setN(Number(e.target.value)); setNError(null); }}
                className={`rounded-lg border px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-1 ${
                  nError
                    ? 'border-red-400 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                }`}
              />
              {nError && (
                <p className="text-xs text-red-500">{nError}</p>
              )}
            </div>

            <div className="flex min-w-[160px] flex-1 flex-col gap-1">
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-400" htmlFor="param-delay">
                countDelay (ms)
                <span className="block text-[11px] font-normal normal-case tracking-normal text-gray-400">* blocking/sleeping time for each parallel execution</span>
              </label>
              <input
                id="param-delay"
                type="number"
                min={0}
                max={1000}
                value={countDelay}
                onChange={e => { setCountDelay(Number(e.target.value)); setCountDelayError(null); }}
                className={`rounded-lg border px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-1 ${
                  countDelayError
                    ? 'border-red-400 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                }`}
              />
              {countDelayError && (
                <p className="text-xs text-red-500">{countDelayError}</p>
              )}
            </div>

            <div className="flex min-w-[160px] flex-1 flex-col gap-1">
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-400" htmlFor="param-parallel">
                Number of parallel Process
                <span className="block text-[11px] font-normal normal-case tracking-normal text-gray-400">* threads / goroutines (set -1 for Java21 virtual threads)</span>
              </label>
              <input
                id="param-parallel"
                type="number"
                max={500000}
                value={parallelProcess}
                onChange={e => {
                  setParallelProcess(Number(e.target.value));
                  setParallelProcessError(null);
                }}
                className={`rounded-lg border px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-1 ${
                  parallelProcessError
                    ? 'border-red-400 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                }`}
              />
              {parallelProcessError && (
                <p className="text-xs text-red-500">{parallelProcessError}</p>
              )}
            </div>

            <button
              onClick={handleRun}
              disabled={running}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {running ? (
                <>
                  <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Running…
                </>
              ) : (
                'Run'
              )}
            </button>
          </div>

          <div className="mt-4 space-y-1.5">
            {[
              { label: 'Java', base: serverEnv.javaBase, color: 'text-blue-600',  repo: 'https://github.com/mariosergio30/parallelism-java'   },
              { label: 'Go',   base: serverEnv.goBase,   color: 'text-amber-600', repo: 'https://github.com/mariosergio30/parallelism-golang' },
            ].map(s => (
              <div key={s.label} className="flex flex-col gap-0.5 rounded-lg bg-gray-50 px-3 py-2">
                <div className="flex items-baseline gap-2">
                  <span className={`shrink-0 text-xs font-bold ${s.color}`}>{s.label}</span>
                  <code className="break-all text-xs text-gray-500">{buildUrl(s.base, n, countDelay, parallelProcess)}</code>
                </div>
                <div className="flex items-baseline gap-2 pl-0">
                  <span className="shrink-0 text-xs font-bold invisible">{s.label}</span>
                  <a href={s.repo} target="_blank" rel="noopener noreferrer" className={`text-[10px] ${s.color} hover:underline`}>{s.repo}</a>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      {/* ── Drag handle 1 ── */}
      <DragHandle onDrag={handleDrag1} />

      {/* ── Section 2 – API Responses ── */}
      <div
        ref={sec2Ref}
        style={h2 !== null ? { height: h2, overflow: 'auto' } : undefined}
      >
        <SectionCard title="2- API Responses">
          <WinnerBanner key={runKey} java={java} go={go} lastParams={lastParams} />
          <div className="flex flex-col gap-4 lg:flex-row">
            <ServerPanel label="Java  ·  :8080" color="blue"  result={java} />
            <ServerPanel label="Go    ·  :8081" color="amber" result={go}   />
          </div>
        </SectionCard>
      </div>

      {/* ── Drag handle 2 ── */}
      <DragHandle onDrag={handleDrag2} />

      {/* ── Section 3 – Conclusion ── */}
      <Conclusion java={java} go={go} />
    </div>
  );
}
