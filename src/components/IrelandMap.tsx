import React, { useState, useMemo } from 'react';
import { NationalHourlyPoint, DetailedStation } from '../types';
import { IRELAND_COUNTIES } from '../data/irelandGeo';
import { MapPin, Layers, Flame, Eye, Sparkles } from 'lucide-react';

interface IrelandMapProps {
  currentHour: number;
  hourlyPoints: NationalHourlyPoint[];
  selectedStationCode: string;
  onSelectStation: (code: string) => void;
  targetStations: Record<string, DetailedStation>;
  whoLimit: number;
}

// Accurate aspect-ratio corrected bounds for the full island of Ireland
const MIN_LAT = 51.35;
const MAX_LAT = 55.48;
const MIN_LON = -10.75;
const MAX_LON = -5.30;

const SVG_WIDTH = 580;
const SVG_HEIGHT = 700;
const PAD_X = 52;
const PAD_Y = 36;

const project = (lat: number, lon: number) => {
  const x = PAD_X + ((lon - MIN_LON) / (MAX_LON - MIN_LON)) * (SVG_WIDTH - PAD_X * 2);
  const y = PAD_Y + ((MAX_LAT - lat) / (MAX_LAT - MIN_LAT)) * (SVG_HEIGHT - PAD_Y * 2);
  return { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 };
};

export const getPm25Color = (val: number) => {
  if (val <= 10) return { bg: '#10b981', glow: '#059669', ring: 'rgba(16, 185, 129, 0.35)', label: 'Clean (<10)' };
  if (val <= 15) return { bg: '#38bdf8', glow: '#0284c7', ring: 'rgba(56, 189, 248, 0.35)', label: 'WHO Compliant (<15)' };
  if (val <= 25) return { bg: '#fbbf24', glow: '#d97706', ring: 'rgba(251, 191, 36, 0.45)', label: 'Moderate (15-25)' };
  if (val <= 50) return { bg: '#f97316', glow: '#ea580c', ring: 'rgba(249, 115, 22, 0.55)', label: 'Unhealthy (25-50)' };
  if (val <= 100) return { bg: '#f43f5e', glow: '#e11d48', ring: 'rgba(244, 63, 94, 0.65)', label: 'Hazardous (50-100)' };
  return { bg: '#d946ef', glow: '#a21caf', ring: 'rgba(217, 70, 239, 0.85)', label: 'Severe Inversion (>100)' };
};

// Fixed callout definitions for key geographical stations with clean margin leader-line positions
const CALLOUT_STATIONS: {
  code: string;
  shortLabel: string;
  side: 'left' | 'right';
  boxY: number;
  isBaseline?: boolean;
}[] = [
  { code: 'AQG-23568', shortLabel: 'Achill Island', side: 'left', boxY: 225, isBaseline: true },
  { code: 'EPA-43', shortLabel: 'Longford', side: 'left', boxY: 295 },
  { code: 'EPA-25', shortLabel: 'Ennis (Clare)', side: 'left', boxY: 425 },
  { code: 'EPA-71', shortLabel: 'Tralee (Kerry)', side: 'left', boxY: 515 },
  { code: 'EPA-67', shortLabel: 'Macroom (Cork)', side: 'left', boxY: 600 },
  { code: 'EPA-64', shortLabel: 'Letterkenny', side: 'right', boxY: 95 },
  { code: 'EPA-78', shortLabel: 'Cavan Town', side: 'right', boxY: 235 },
  { code: 'EPA-48', shortLabel: 'Dublin (Phoenix Pk)', side: 'right', boxY: 345, isBaseline: true },
  { code: 'EPA-24', shortLabel: 'Enniscorthy', side: 'right', boxY: 485 },
];

export const IrelandMap: React.FC<IrelandMapProps> = ({
  currentHour,
  hourlyPoints,
  selectedStationCode,
  onSelectStation,
  targetStations,
  whoLimit,
}) => {
  const [hoveredPoint, setHoveredPoint] = useState<NationalHourlyPoint | null>(null);
  const [showPlumes, setShowPlumes] = useState<boolean>(true);
  const [showCallouts, setShowCallouts] = useState<boolean>(true);
  const [choroplethMode, setChoroplethMode] = useState<boolean>(false);

  // Pre-build SVG path strings for all 32 counties + calculate county centroids
  const countyPaths = useMemo(() => {
    return IRELAND_COUNTIES.map((county, idx) => {
      let sumX = 0;
      let sumY = 0;
      let count = 0;

      const d = county.polygons
        .map((ring) => {
          return (
            ring
              .map(([lon, lat], i) => {
                const { x, y } = project(lat, lon);
                sumX += x;
                sumY += y;
                count++;
                return `${i === 0 ? 'M' : 'L'}${x},${y}`;
              })
              .join(' ') + ' Z'
          );
        })
        .join(' ');

      return {
        id: `${county.name}-${idx}`,
        name: county.name,
        region: county.region,
        d,
        cx: count ? sumX / count : 0,
        cy: count ? sumY / count : 0,
      };
    });
  }, []);

  // Map station code -> current hourly reading
  const pointByCode = useMemo(() => {
    const map: Record<string, NationalHourlyPoint> = {};
    for (const p of hourlyPoints) {
      map[p.code] = p;
    }
    return map;
  }, [hourlyPoints]);

  // Calculate summary stats for the active hour
  const stats = useMemo(() => {
    if (!hourlyPoints.length) return { overWho: 0, maxStation: null as NationalHourlyPoint | null, mean: 0 };
    let overWho = 0;
    let sum = 0;
    let maxStation = hourlyPoints[0];
    for (const p of hourlyPoints) {
      sum += p.pm25;
      if (p.pm25 > whoLimit) overWho++;
      if (p.pm25 > maxStation.pm25) maxStation = p;
    }
    return {
      overWho,
      maxStation,
      mean: Math.round((sum / hourlyPoints.length) * 10) / 10,
    };
  }, [hourlyPoints, whoLimit]);

  // Sort stations so highest PM2.5 and selected station render on top
  const sortedPoints = useMemo(() => {
    return [...hourlyPoints].sort((a, b) => {
      if (a.code === selectedStationCode) return 1;
      if (b.code === selectedStationCode) return -1;
      return a.pm25 - b.pm25;
    });
  }, [hourlyPoints, selectedStationCode]);

  // Helper to compute county fill when choropleth mode is active
  const getCountyFill = (cx: number, cy: number, region: 'ROI' | 'NI') => {
    if (region === 'NI') return '#0c1322';
    if (!choroplethMode) return 'url(#emeraldIsleGrad)';

    // Find nearest stations in SVG space using inverse distance weighting
    let weightedSum = 0;
    let weightTotal = 0;
    for (const pt of hourlyPoints) {
      const { x, y } = project(pt.lat, pt.lon);
      const distSq = (x - cx) * (x - cx) + (y - cy) * (y - cy) + 200;
      if (distSq < 12000) {
        const w = 1 / distSq;
        weightedSum += pt.pm25 * w;
        weightTotal += w;
      }
    }
    const estVal = weightTotal > 0 ? weightedSum / weightTotal : 8;
    if (estVal <= 10) return '#0f292a';
    if (estVal <= 15) return '#11263c';
    if (estVal <= 25) return '#332817';
    if (estVal <= 45) return '#3b1d16';
    if (estVal <= 80) return '#451524';
    return '#3b123d';
  };

  return (
    <div className="relative bg-slate-900/90 border border-slate-800 rounded-2xl p-4 lg:p-5 shadow-xl flex flex-col justify-between h-full">
      {/* Top Header & Layer Controls */}
      <div className="w-full space-y-2.5 pb-3 border-b border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span>All-Island Spatial Telemetry</span>
              <span className="text-xs font-mono font-semibold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20">
                {String(currentHour).padStart(2, '0')}:00 UTC
              </span>
            </h2>
            <p className="text-[11px] text-slate-400">
              32-county GIS projection • 113 live EPA AURN stations
            </p>
          </div>

          {/* Interactive Layer Pills */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowPlumes(!showPlumes)}
              className={`px-2 py-1 rounded-md text-[10px] font-semibold border transition cursor-pointer flex items-center gap-1 ${
                showPlumes
                  ? 'bg-orange-500/15 text-orange-300 border-orange-500/30'
                  : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-slate-200'
              }`}
              title="Toggle atmospheric thermal inversion smoke plumes"
            >
              <Flame className="w-3 h-3" />
              <span>Plumes</span>
            </button>

            <button
              onClick={() => setChoroplethMode(!choroplethMode)}
              className={`px-2 py-1 rounded-md text-[10px] font-semibold border transition cursor-pointer flex items-center gap-1 ${
                choroplethMode
                  ? 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                  : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-slate-200'
              }`}
              title="Shade counties by interpolated PM2.5 intensity"
            >
              <Layers className="w-3 h-3" />
              <span>County Shade</span>
            </button>

            <button
              onClick={() => setShowCallouts(!showCallouts)}
              className={`px-2 py-1 rounded-md text-[10px] font-semibold border transition cursor-pointer flex items-center gap-1 ${
                showCallouts
                  ? 'bg-sky-500/15 text-sky-300 border-sky-500/30'
                  : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-slate-200'
              }`}
              title="Toggle key town leader-line callouts"
            >
              <Eye className="w-3 h-3" />
              <span>Labels</span>
            </button>
          </div>
        </div>

        {/* Color Scale Legend Bar */}
        <div className="flex flex-wrap items-center justify-between gap-1.5 pt-0.5 text-[10px] font-mono">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="flex items-center gap-1 text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              &le;10 Clean
            </span>
            <span className="flex items-center gap-1 text-slate-300">
              <span className="w-2 h-2 rounded-full bg-sky-400"></span>
              &le;15 WHO
            </span>
            <span className="flex items-center gap-1 text-slate-300">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              15–25
            </span>
            <span className="flex items-center gap-1 text-slate-300">
              <span className="w-2 h-2 rounded-full bg-orange-500"></span>
              25–50
            </span>
            <span className="flex items-center gap-1 text-slate-300">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              50–100
            </span>
            <span className="flex items-center gap-1 text-fuchsia-300 font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-fuchsia-500 shadow-sm shadow-fuchsia-500"></span>
              &gt;100 µg/m³
            </span>
          </div>
        </div>
      </div>

      {/* Main Cartographic SVG Canvas */}
      <div className="relative w-full flex-1 flex items-center justify-center my-1 bg-slate-950/75 rounded-xl border border-slate-800/80 overflow-hidden">
        <svg
          viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
          className="w-full h-auto max-h-[620px] select-none"
        >
          <defs>
            {/* Rich Dark Topographical Land Gradient */}
            <linearGradient id="emeraldIsleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#17233b" />
              <stop offset="50%" stopColor="#121c30" />
              <stop offset="100%" stopColor="#0d1526" />
            </linearGradient>

            {/* Outer Coastline Bathymetry / Continental Shelf Glow */}
            <filter id="coastalShelfGlow" x="-15%" y="-15%" width="130%" height="130%">
              <feDropShadow dx="0" dy="2" stdDeviation="6" floodColor="#0284c7" floodOpacity="0.18" />
            </filter>

            {/* Soft Gaussian Blur for Thermal Inversion Smoke Plumes */}
            <filter id="plumeBlur" x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="14" />
            </filter>

            {/* Subtle Diagonal Hatch for NI Jurisdiction */}
            <pattern id="niHatch" width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
              <line x1="0" y1="0" x2="0" y2="8" stroke="#1e293b" strokeWidth="1.5" />
            </pattern>
          </defs>

          {/* Subtle Ocean Graticule Grid (Lat / Lon lines) */}
          <g className="stroke-slate-800/40" strokeWidth="0.6" strokeDasharray="3 5">
            {[52, 53, 54, 55].map((lat) => {
              const { y } = project(lat, -8);
              return (
                <g key={`lat-${lat}`}>
                  <line x1="0" y1={y} x2={SVG_WIDTH} y2={y} />
                  <text
                    x={SVG_WIDTH - 8}
                    y={y - 4}
                    textAnchor="end"
                    className="fill-slate-600/80 text-[9px] font-mono stroke-none"
                  >
                    {lat}°N
                  </text>
                </g>
              );
            })}
            {[-10, -9, -8, -7, -6].map((lon) => {
              const { x } = project(53.5, lon);
              return (
                <g key={`lon-${lon}`}>
                  <line x1={x} y1="0" x2={x} y2={SVG_HEIGHT} />
                  <text
                    x={x + 3}
                    y={SVG_HEIGHT - 8}
                    className="fill-slate-600/80 text-[9px] font-mono stroke-none"
                  >
                    {Math.abs(lon)}°W
                  </text>
                </g>
              );
            })}
          </g>

          {/* Ocean Geographic Watermarks */}
          <text
            x="68"
            y="145"
            className="fill-slate-800/90 text-[10px] font-bold tracking-[0.25em] uppercase pointer-events-none"
          >
            Atlantic Ocean
          </text>
          <text
            x="512"
            y="435"
            textAnchor="end"
            className="fill-slate-800/90 text-[10px] font-bold tracking-[0.25em] uppercase pointer-events-none"
          >
            Irish Sea
          </text>

          {/* Layer 1: Coastline Bathymetry Underlay */}
          <g filter="url(#coastalShelfGlow)">
            {countyPaths.map((cp) => (
              <path
                key={`glow-${cp.id}`}
                d={cp.d}
                fill="#0f172a"
                stroke="#1e293b"
                strokeWidth="2"
                strokeLinejoin="round"
              />
            ))}
          </g>

          {/* Layer 2: 32 County Polygons */}
          <g>
            {countyPaths.map((cp) => (
              <g key={cp.id}>
                <path
                  d={cp.d}
                  fill={getCountyFill(cp.cx, cp.cy, cp.region)}
                  stroke={cp.region === 'ROI' ? '#334155' : '#1e293b'}
                  strokeWidth={cp.region === 'ROI' ? '0.9' : '0.6'}
                  strokeLinejoin="round"
                  className="transition-colors duration-300"
                />
                {cp.region === 'NI' && (
                  <path
                    d={cp.d}
                    fill="url(#niHatch)"
                    stroke="none"
                    opacity="0.45"
                    className="pointer-events-none"
                  />
                )}
              </g>
            ))}
          </g>

          {/* Subtle NI Jurisdiction Label */}
          {(() => {
            const niCenter = project(54.62, -6.65);
            return (
              <text
                x={niCenter.x}
                y={niCenter.y}
                textAnchor="middle"
                className="fill-slate-600 text-[8.5px] font-mono uppercase tracking-widest pointer-events-none"
              >
                NI (DAERA)
              </text>
            );
          })()}

          {/* Layer 3: Major River Basins (Topographical Inversion Valleys) */}
          <g className="pointer-events-none opacity-45" fill="none" stroke="#38bdf8" strokeWidth="1.2" strokeLinecap="round">
            {/* River Shannon & Estuary (Limerick -> Athlone -> Carrick-on-Shannon) */}
            <path
              d={[
                project(52.58, -9.65),
                project(52.68, -8.95),
                project(52.66, -8.63),
                project(52.80, -8.44),
                project(53.05, -8.18),
                project(53.42, -7.94),
                project(53.72, -7.99),
                project(53.94, -8.09),
              ]
                .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`)
                .join(' ')}
              strokeDasharray="1 2"
            />
          </g>

          {/* Layer 4: Atmospheric Thermal Inversion Smoke Plumes */}
          {showPlumes && (
            <g filter="url(#plumeBlur)" className="pointer-events-none">
              {hourlyPoints.map((pt) => {
                if (pt.pm25 <= 14) return null;
                const { x, y } = project(pt.lat, pt.lon);
                const color = getPm25Color(pt.pm25);
                // Scale plume radius nonlinearly with PM2.5 intensity
                const radius = Math.min(48, 12 + Math.sqrt(pt.pm25) * 2.6);
                const opacity = Math.min(0.65, 0.15 + (pt.pm25 / 160) * 0.5);
                return (
                  <circle
                    key={`plume-${pt.code}`}
                    cx={x}
                    cy={y}
                    r={radius}
                    fill={color.bg}
                    opacity={opacity}
                    className="transition-all duration-500"
                  />
                );
              })}
            </g>
          )}

          {/* Layer 5: All 113 EPA Monitoring Station Nodes */}
          <g>
            {sortedPoints.map((pt) => {
              const { x, y } = project(pt.lat, pt.lon);
              const color = getPm25Color(pt.pm25);
              const isSelected = pt.code === selectedStationCode;
              const isHovered = hoveredPoint?.code === pt.code;
              const isHighSpike = pt.pm25 >= 35;
              const isSevere = pt.pm25 >= 90;
              const isTarget = !!targetStations[pt.code];

              return (
                <g
                  key={pt.code}
                  className="cursor-pointer"
                  onClick={() => onSelectStation(pt.code)}
                  onMouseEnter={() => setHoveredPoint(pt)}
                  onMouseLeave={() => setHoveredPoint(null)}
                >
                  {/* Animated Radar Pulse for Severe Spikes (>90 µg/m³) */}
                  {isSevere && (
                    <circle
                      cx={x}
                      cy={y}
                      r="16"
                      fill="none"
                      stroke={color.bg}
                      strokeWidth="1.5"
                      opacity="0.6"
                      className="animate-ping"
                    />
                  )}

                  {/* Outer Risk Ring for Elevated Stations */}
                  {isHighSpike && (
                    <circle
                      cx={x}
                      cy={y}
                      r={isSelected ? 12 : 8.5}
                      fill={color.bg}
                      opacity="0.22"
                    />
                  )}

                  {/* Active Selection Reticle */}
                  {isSelected && (
                    <g>
                      <circle
                        cx={x}
                        cy={y}
                        r="13"
                        fill="none"
                        stroke="#ffffff"
                        strokeWidth="1.75"
                        strokeDasharray="3 2"
                      />
                      <circle
                        cx={x}
                        cy={y}
                        r="17"
                        fill="none"
                        stroke={color.bg}
                        strokeWidth="1"
                        opacity="0.6"
                      />
                    </g>
                  )}

                  {/* Core Telemetry Beacon */}
                  <circle
                    cx={x}
                    cy={y}
                    r={isSelected || isHovered ? 6 : isTarget ? 4.8 : 3.2}
                    fill={color.bg}
                    stroke={isSelected || isHovered ? '#ffffff' : '#090d16'}
                    strokeWidth={isSelected || isHovered ? 2 : 1.1}
                  />
                </g>
              );
            })}
          </g>

          {/* Layer 6: Smart Non-Overlapping Margin Callout Badges with Leader Lines */}
          {showCallouts && (
            <g>
              {CALLOUT_STATIONS.map((item) => {
                const st = pointByCode[item.code];
                if (!st) return null;
                const { x, y } = project(st.lat, st.lon);
                const color = getPm25Color(st.pm25);
                const isSelected = st.code === selectedStationCode;

                const boxWidth = 118;
                const boxHeight = 24;
                const boxX = item.side === 'left' ? 8 : SVG_WIDTH - boxWidth - 8;
                const anchorX = item.side === 'left' ? boxX + boxWidth : boxX;
                const elbowX = item.side === 'left' ? anchorX + 12 : anchorX - 12;
                const boxCenterY = item.boxY;

                return (
                  <g
                    key={`callout-${item.code}`}
                    className="cursor-pointer group"
                    onClick={() => onSelectStation(item.code)}
                    onMouseEnter={() => setHoveredPoint(st)}
                    onMouseLeave={() => setHoveredPoint(null)}
                  >
                    {/* Crisp Angled Leader Line */}
                    <polyline
                      points={`${x},${y} ${elbowX},${boxCenterY} ${anchorX},${boxCenterY}`}
                      fill="none"
                      stroke={isSelected ? '#ffffff' : color.bg}
                      strokeWidth={isSelected ? '1.5' : '1'}
                      strokeDasharray={item.isBaseline ? '2 2' : undefined}
                      opacity={isSelected ? '0.95' : '0.65'}
                    />

                    {/* Small dot at station end of leader */}
                    <circle cx={anchorX} cy={boxCenterY} r="2" fill={color.bg} />

                    {/* Callout Pill Container */}
                    <rect
                      x={boxX}
                      y={boxCenterY - boxHeight / 2}
                      width={boxWidth}
                      height={boxHeight}
                      rx="5"
                      fill={isSelected ? '#1e293b' : '#090d16'}
                      fillOpacity="0.92"
                      stroke={isSelected ? '#ffffff' : color.bg}
                      strokeWidth={isSelected ? '1.5' : '0.9'}
                    />

                    {/* Town Name */}
                    <text
                      x={boxX + 6}
                      y={boxCenterY + 3.5}
                      className="fill-slate-200 text-[9.5px] font-semibold"
                    >
                      {item.shortLabel}
                    </text>

                    {/* Live PM2.5 Reading Badge */}
                    <text
                      x={boxX + boxWidth - 6}
                      y={boxCenterY + 3.5}
                      textAnchor="end"
                      fill={color.bg}
                      className="text-[10px] font-mono font-extrabold"
                    >
                      {st.pm25}
                    </text>
                  </g>
                );
              })}
            </g>
          )}
        </svg>

        {/* Bottom-Left Live National Telemetry Mini-HUD */}
        <div className="absolute bottom-2.5 left-2.5 bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-2 backdrop-blur-md pointer-events-none shadow-lg">
          <div className="flex items-center gap-4 text-[11px]">
            <div>
              <span className="text-slate-500 block text-[9px] uppercase font-semibold tracking-wider">
                Exceeding WHO (15)
              </span>
              <span className={`font-mono font-bold ${stats.overWho > 20 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {stats.overWho} <span className="text-slate-500 font-normal">/ {hourlyPoints.length} stations</span>
              </span>
            </div>
            {stats.maxStation && (
              <div className="border-l border-slate-800 pl-3">
                <span className="text-slate-500 block text-[9px] uppercase font-semibold tracking-wider">
                  Peak Monitor ({String(currentHour).padStart(2, '0')}:00)
                </span>
                <span className="font-semibold text-white">
                  {stats.maxStation.name.split(',')[0]}:{' '}
                  <strong className="font-mono" style={{ color: getPm25Color(stats.maxStation.pm25).bg }}>
                    {stats.maxStation.pm25} µg/m³
                  </strong>
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Hover Floating Card Tooltip */}
        {hoveredPoint && (
          <div
            className="absolute top-3 left-3 z-20 pointer-events-none bg-slate-900/95 border border-slate-700 rounded-xl p-3 shadow-2xl backdrop-blur-md text-xs min-w-[225px]"
          >
            <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-slate-800">
              <span className="font-bold text-white truncate max-w-[155px]">
                {hoveredPoint.name}
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                {hoveredPoint.code}
              </span>
            </div>

            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-slate-400">PM2.5 Telemetry:</span>
              <span
                className="text-base font-extrabold font-mono"
                style={{ color: getPm25Color(hoveredPoint.pm25).bg }}
              >
                {hoveredPoint.pm25} µg/m³
              </span>
            </div>

            <div className="mt-1 flex items-center justify-between text-[11px]">
              <span className="text-slate-500">WHO 24h Threshold (15):</span>
              <span
                className={`font-mono font-semibold ${
                  hoveredPoint.pm25 > whoLimit ? 'text-rose-400' : 'text-emerald-400'
                }`}
              >
                {hoveredPoint.pm25 > whoLimit
                  ? `${(hoveredPoint.pm25 / whoLimit).toFixed(1)}× Above Limit`
                  : '✓ Within Safe Limit'}
              </span>
            </div>

            <div className="mt-2 pt-1.5 border-t border-slate-800/80 text-[10px] text-sky-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              <span>Click to load in Head-to-Head Duel</span>
            </div>
          </div>
        )}
      </div>

      {/* Map Footer */}
      <div className="w-full pt-2.5 flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-orange-400 shrink-0" />
          <span>Click any station beacon or town badge to compare against Dublin</span>
        </div>
        <div className="font-mono text-[10px] text-slate-500 shrink-0">
          WGS84 • 32 Counties
        </div>
      </div>
    </div>
  );
};
