import React, { useState } from 'react';
import { DetailedStation } from '../types';
import { GLOBAL_BENCHMARKS } from '../data/globalBenchmarks';
import { Flame, Activity, Globe } from 'lucide-react';

interface ComparisonDuelProps {
  targetStations: Record<string, DetailedStation>;
  selectedStationCode: string;
  onSelectStation: (code: string) => void;
  baselineStationCode: string;
  onSelectBaseline: (code: string) => void;
  currentHour: number;
  whoLimit: number;
}

export const ComparisonDuel: React.FC<ComparisonDuelProps> = ({
  targetStations,
  selectedStationCode,
  onSelectStation,
  baselineStationCode,
  onSelectBaseline,
  currentHour,
  whoLimit,
}) => {
  const [viewMode, setViewMode] = useState<'diurnal' | 'peak'>('diurnal');

  // Combine Irish target stations + Global Megacity Benchmarks
  const allBaselines: Record<string, DetailedStation> = {
    ...targetStations,
    ...GLOBAL_BENCHMARKS,
  };

  const regionalStation = targetStations[selectedStationCode] || targetStations['EPA-25'];
  const baselineStation = allBaselines[baselineStationCode] || targetStations['EPA-48'];
  const globalBaseline = GLOBAL_BENCHMARKS[baselineStationCode];

  // Determine points based on mode
  const getSeries = (station: DetailedStation) => {
    if (viewMode === 'peak' && station.nov2PeakInversion && station.nov2PeakInversion.length > 0) {
      return station.nov2PeakInversion.map((p) => ({ hour: p.hour, val: p.pm25 }));
    }
    return station.profile24h.map((p) => ({ hour: p.hour, val: p.averagePm25 }));
  };

  const regionalSeries = getSeries(regionalStation);
  const baselineSeries = getSeries(baselineStation);

  // Current hour values
  const currentRegionalPoint = regionalSeries.find((p) => p.hour === currentHour) || { hour: currentHour, val: 0 };
  const currentBaselinePoint = baselineSeries.find((p) => p.hour === currentHour) || { hour: currentHour, val: 0.1 };

  const multiplier =
    currentBaselinePoint.val > 0
      ? (currentRegionalPoint.val / currentBaselinePoint.val).toFixed(1)
      : '1.0';

  // Chart dimensions
  const CHART_WIDTH = 640;
  const CHART_HEIGHT = 280;
  const PADDING_LEFT = 45;
  const PADDING_RIGHT = 25;
  const PADDING_TOP = 25;
  const PADDING_BOTTOM = 35;

  const maxVal = Math.max(
    ...regionalSeries.map((p) => p.val),
    ...baselineSeries.map((p) => p.val),
    whoLimit * 1.5,
    30
  );

  const getX = (hour: number) => {
    return PADDING_LEFT + (hour / 23) * (CHART_WIDTH - PADDING_LEFT - PADDING_RIGHT);
  };

  const getY = (val: number) => {
    return CHART_HEIGHT - PADDING_BOTTOM - (val / maxVal) * (CHART_HEIGHT - PADDING_TOP - PADDING_BOTTOM);
  };

  const createPath = (series: { hour: number; val: number }[]) => {
    if (!series.length) return '';
    return series.reduce((path, pt, idx) => {
      const x = getX(pt.hour);
      const y = getY(pt.val);
      return idx === 0 ? `M ${x} ${y}` : `${path} L ${x} ${y}`;
    }, '');
  };

  const createAreaPath = (series: { hour: number; val: number }[]) => {
    if (!series.length) return '';
    const linePath = createPath(series);
    const lastX = getX(series[series.length - 1].hour);
    const firstX = getX(series[0].hour);
    const zeroY = getY(0);
    return `${linePath} L ${lastX} ${zeroY} L ${firstX} ${zeroY} Z`;
  };

  const regionalPath = createPath(regionalSeries);
  const regionalArea = createAreaPath(regionalSeries);
  const baselinePath = createPath(baselineSeries);
  const whoY = getY(whoLimit);

  // Options
  const regionalKeys = Object.keys(targetStations).filter(
    (k) => !k.startsWith('EPA-48') && !k.startsWith('EPA-22') && !k.startsWith('EPA-91') && !k.startsWith('AQG-23568')
  );
  const irishBaselineKeys = Object.keys(targetStations).filter(
    (k) => k.startsWith('EPA-48') || k.startsWith('EPA-22') || k.startsWith('EPA-91') || k.startsWith('AQG-23568')
  );
  const globalKeys = Object.keys(GLOBAL_BENCHMARKS);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 lg:p-6 shadow-xl flex flex-col justify-between">
      {/* Top Header & Selectors */}
      <div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
              <h2 className="text-base sm:text-lg font-bold text-white">
                Head-to-Head Telemetry Duel (Ireland &amp; Global Cities)
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Compare regional solid-fuel towns against Dublin, London, New York City, Paris &amp; Beijing.
            </p>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setViewMode('diurnal')}
              className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                viewMode === 'diurnal'
                  ? 'bg-slate-800 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Diurnal 24h Average
            </button>
            <button
              onClick={() => setViewMode('peak')}
              className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'peak'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-rose-400" />
              <span>The Inversion Night (Nov 2)</span>
            </button>
          </div>
        </div>

        {/* Quick Global Benchmark Pills */}
        <div className="flex flex-wrap items-center gap-1.5 mt-3 text-[11px]">
          <span className="text-slate-500 font-medium flex items-center gap-1 mr-1">
            <Globe className="w-3.5 h-3.5 text-cyan-400" />
            <span>Compare against:</span>
          </span>
          {[
            { code: 'EPA-48', label: '🇮🇪 Dublin (Phoenix Pk)' },
            { code: 'GLOBAL-LON', label: '🇬🇧 London (Westminster)' },
            { code: 'GLOBAL-NYC', label: '🇺🇸 New York (Manhattan)' },
            { code: 'GLOBAL-PAR', label: '🇫🇷 Paris (Centre)' },
            { code: 'GLOBAL-BJS', label: '🇨🇳 Beijing (Chaoyang)' },
            { code: 'AQG-23568', label: '🌊 Achill Island' },
          ].map((preset) => (
            <button
              key={preset.code}
              onClick={() => onSelectBaseline(preset.code)}
              className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer ${
                baselineStationCode === preset.code
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Station Selectors Dropdown Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-3.5">
          {/* Regional Station Selector */}
          <div className="p-3 rounded-xl bg-slate-950 border border-rose-500/30">
            <label className="block text-[11px] font-semibold text-rose-400 mb-1 uppercase tracking-wider">
              🇮🇪 Regional Town (Solid Fuel / Inversion Basin)
            </label>
            <select
              value={selectedStationCode}
              onChange={(e) => onSelectStation(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-white focus:outline-none focus:border-rose-400 cursor-pointer"
            >
              {regionalKeys.map((code) => {
                const s = targetStations[code];
                return (
                  <option key={code} value={code}>
                    {s.name} ({s.county}) — Peak: {s.highestRecordedPm25} µg/m³
                  </option>
                );
              })}
            </select>
            <div className="mt-2 flex items-center justify-between text-xs">
              <span className="text-slate-400">Hour {String(currentHour).padStart(2, '0')}:00:</span>
              <span className="text-rose-400 font-extrabold font-mono text-sm">
                {currentRegionalPoint.val} µg/m³
              </span>
            </div>
          </div>

          {/* Baseline Station Selector (Irish + Global Megacities) */}
          <div className="p-3 rounded-xl bg-slate-950 border border-cyan-500/30">
            <label className="block text-[11px] font-semibold text-cyan-400 mb-1 uppercase tracking-wider">
              Control / Global Megacity Benchmark
            </label>
            <select
              value={baselineStationCode}
              onChange={(e) => onSelectBaseline(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-white focus:outline-none focus:border-cyan-400 cursor-pointer"
            >
              <optgroup label="Global Megacity Benchmarks">
                {globalKeys.map((code) => {
                  const g = GLOBAL_BENCHMARKS[code];
                  return (
                    <option key={code} value={code}>
                      {g.flag} {g.name} — {g.type}
                    </option>
                  );
                })}
              </optgroup>
              <optgroup label="Irish Baselines (Dublin & Atlantic)">
                {irishBaselineKeys.map((code) => {
                  const s = targetStations[code];
                  return (
                    <option key={code} value={code}>
                      🇮🇪 {s.name} ({s.type})
                    </option>
                  );
                })}
              </optgroup>
            </select>
            <div className="mt-2 flex items-center justify-between text-xs">
              <span className="text-slate-400">
                {globalBaseline ? globalBaseline.agency : `Hour ${String(currentHour).padStart(2, '0')}:00:`}
              </span>
              <span className="text-cyan-400 font-extrabold font-mono text-sm shrink-0 ml-2">
                {currentBaselinePoint.val} µg/m³
              </span>
            </div>
          </div>
        </div>

        {/* Dynamic Smog Multiplier Banner */}
        <div
          className={`p-3 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4 ${
            parseFloat(multiplier) >= 3.0
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-200'
              : 'bg-slate-950 border-slate-800 text-slate-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-rose-400 shrink-0" />
            <span className="text-xs">
              At <strong className="text-white font-mono">{String(currentHour).padStart(2, '0')}:00 UTC</strong>,{' '}
              <strong className="text-rose-300">{regionalStation.name}</strong> is{' '}
              <span className="px-1.5 py-0.5 rounded bg-rose-500/30 text-rose-100 font-mono font-bold text-sm">
                {multiplier}×
              </span>{' '}
              more polluted than{' '}
              <strong className="text-cyan-300">
                {globalBaseline ? `${globalBaseline.flag} ${globalBaseline.name}` : baselineStation.name}
              </strong>
              .
            </span>
          </div>

          <div className="text-[11px] font-mono text-slate-400 shrink-0">
            WHO Daily Limit: 15.0 µg/m³
          </div>
        </div>

        {/* SVG Time-Series Chart */}
        <div className="relative w-full aspect-[640/280] bg-slate-950/70 border border-slate-800 rounded-xl p-2 select-none">
          <svg viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} className="w-full h-full">
            <defs>
              <linearGradient id="regionalGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Grid Lines */}
            {[0, 0.25, 0.5, 0.75, 1.0].map((fraction) => {
              const yVal = fraction * maxVal;
              const yPos = getY(yVal);
              return (
                <g key={fraction}>
                  <line
                    x1={PADDING_LEFT}
                    y1={yPos}
                    x2={CHART_WIDTH - PADDING_RIGHT}
                    y2={yPos}
                    stroke="#1e293b"
                    strokeWidth="1"
                    strokeDasharray="2 4"
                  />
                  <text
                    x={PADDING_LEFT - 6}
                    y={yPos + 4}
                    textAnchor="end"
                    className="fill-slate-500 text-[10px] font-mono"
                  >
                    {Math.round(yVal)}
                  </text>
                </g>
              );
            })}

            {/* WHO Guideline Threshold Line (15 µg/m³) */}
            {whoY >= PADDING_TOP && whoY <= CHART_HEIGHT - PADDING_BOTTOM && (
              <g>
                <line
                  x1={PADDING_LEFT}
                  y1={whoY}
                  x2={CHART_WIDTH - PADDING_RIGHT}
                  y2={whoY}
                  stroke="#fbbf24"
                  strokeWidth="1.5"
                  strokeDasharray="4 3"
                />
                <text
                  x={CHART_WIDTH - PADDING_RIGHT}
                  y={whoY - 4}
                  textAnchor="end"
                  className="fill-amber-400 text-[10px] font-mono font-semibold"
                >
                  WHO 24h Safety Threshold (15 µg/m³)
                </text>
              </g>
            )}

            {/* Hour X-Axis Ticks */}
            {[0, 4, 8, 12, 16, 19, 21, 23].map((h) => {
              const xPos = getX(h);
              const isHearth = h === 19;
              return (
                <g key={h}>
                  <line
                    x1={xPos}
                    y1={CHART_HEIGHT - PADDING_BOTTOM}
                    x2={xPos}
                    y2={CHART_HEIGHT - PADDING_BOTTOM + 5}
                    stroke="#334155"
                    strokeWidth="1"
                  />
                  <text
                    x={xPos}
                    y={CHART_HEIGHT - PADDING_BOTTOM + 16}
                    textAnchor="middle"
                    className={`text-[10px] font-mono ${isHearth ? 'fill-orange-400 font-bold' : 'fill-slate-500'}`}
                  >
                    {String(h).padStart(2, '0')}:00
                  </text>
                </g>
              );
            })}

            {/* The 7:00 PM - 9:00 PM Hearth Window Highlight Zone */}
            <rect
              x={getX(19)}
              y={PADDING_TOP}
              width={getX(21) - getX(19)}
              height={CHART_HEIGHT - PADDING_TOP - PADDING_BOTTOM}
              fill="#f97316"
              fillOpacity="0.08"
            />
            <text
              x={(getX(19) + getX(21)) / 2}
              y={PADDING_TOP + 12}
              textAnchor="middle"
              className="fill-orange-400 text-[9px] font-mono font-bold uppercase tracking-wider"
            >
              Hearth Spike
            </text>

            {/* Regional Area Fill */}
            <path d={regionalArea} fill="url(#regionalGradient)" />

            {/* Baseline Line Path */}
            <path
              d={baselinePath}
              fill="none"
              stroke="#06b6d4"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Regional Line Path */}
            <path
              d={regionalPath}
              fill="none"
              stroke="#f43f5e"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Current Scrubber Vertical Cursor */}
            <line
              x1={getX(currentHour)}
              y1={PADDING_TOP}
              x2={getX(currentHour)}
              y2={CHART_HEIGHT - PADDING_BOTTOM}
              stroke="#ffffff"
              strokeWidth="1.5"
              strokeDasharray="3 3"
              opacity="0.8"
            />

            {/* Regional current point circle */}
            <circle
              cx={getX(currentHour)}
              cy={getY(currentRegionalPoint.val)}
              r="5"
              fill="#f43f5e"
              stroke="#ffffff"
              strokeWidth="2"
            />

            {/* Baseline current point circle */}
            <circle
              cx={getX(currentHour)}
              cy={getY(currentBaselinePoint.val)}
              r="4.5"
              fill="#06b6d4"
              stroke="#ffffff"
              strokeWidth="2"
            />
          </svg>
        </div>
      </div>

      {/* Chart Legend & Context Note */}
      <div className="mt-4 pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1 bg-rose-500 rounded"></span>
            <span className="text-slate-300 font-medium">🇮🇪 {regionalStation.name}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1 bg-cyan-400 rounded"></span>
            <span className="text-slate-300 font-medium">
              {globalBaseline ? `${globalBaseline.flag} ${globalBaseline.name}` : `🇮🇪 ${baselineStation.name}`}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 border-b border-dashed border-amber-400"></span>
            <span className="text-amber-400 font-mono">WHO 15 µg/m³</span>
          </div>
        </div>

        <p className="text-[11px] text-slate-500">
          {globalBaseline
            ? `${globalBaseline.agency} — ${globalBaseline.policyNote}`
            : 'Source: Sonitus Systems / EPA Ireland high-resolution telemetry.'}
        </p>
      </div>
    </div>
  );
};
