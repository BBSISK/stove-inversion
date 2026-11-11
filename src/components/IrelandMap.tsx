import React, { useState } from 'react';
import { NationalHourlyPoint, DetailedStation } from '../types';
import { MapPin, AlertTriangle, ShieldCheck, Flame } from 'lucide-react';

interface IrelandMapProps {
  currentHour: number;
  hourlyPoints: NationalHourlyPoint[];
  selectedStationCode: string;
  onSelectStation: (code: string) => void;
  targetStations: Record<string, DetailedStation>;
  whoLimit: number;
}

// Bounding box for Ireland map projection
const MIN_LAT = 51.35;
const MAX_LAT = 55.45;
const MIN_LON = -10.65;
const MAX_LON = -5.85;

const SVG_WIDTH = 560;
const SVG_HEIGHT = 680;

const project = (lat: number, lon: number) => {
  const x = ((lon - MIN_LON) / (MAX_LON - MIN_LON)) * (SVG_WIDTH - 60) + 30;
  const y = ((MAX_LAT - lat) / (MAX_LAT - MIN_LAT)) * (SVG_HEIGHT - 60) + 30;
  return { x, y };
};

export const getPm25Color = (val: number) => {
  if (val <= 10) return { bg: '#10b981', ring: 'rgba(16, 185, 129, 0.4)', label: 'Clean / Good' };
  if (val <= 15) return { bg: '#3b82f6', ring: 'rgba(59, 130, 246, 0.4)', label: 'WHO Standard' };
  if (val <= 25) return { bg: '#f59e0b', ring: 'rgba(245, 158, 11, 0.5)', label: 'EU Limit Range' };
  if (val <= 50) return { bg: '#f97316', ring: 'rgba(249, 115, 22, 0.6)', label: 'Unhealthy' };
  if (val <= 100) return { bg: '#ef4444', ring: 'rgba(239, 68, 68, 0.7)', label: 'Hazardous' };
  return { bg: '#c026d3', ring: 'rgba(192, 38, 211, 0.9)', label: 'Severe Hearth Inversion' };
};

export const IrelandMap: React.FC<IrelandMapProps> = ({
  currentHour,
  hourlyPoints,
  selectedStationCode,
  onSelectStation,
  targetStations,
  whoLimit,
}) => {
  const [hoveredPoint, setHoveredPoint] = useState<NationalHourlyPoint | null>(null);

  // Stylized Ireland Landmass SVG Outline Path (approximate high-precision coastal hull)
  // Covers Malin Head down to Mizen Head, Wicklow Head, Loop Head, Galway Bay, Clew Bay, Donegal
  const irelandOutlinePath = `
    M 360 48
    C 380 55, 410 70, 435 95
    C 450 115, 445 140, 430 165
    C 420 180, 440 210, 450 250
    C 460 290, 440 330, 445 370
    C 450 405, 435 440, 415 470
    C 400 495, 410 520, 395 550
    C 380 575, 340 600, 310 615
    C 270 630, 235 635, 195 620
    C 165 605, 140 580, 115 570
    C 90 560, 65 540, 55 510
    C 45 475, 75 450, 100 440
    C 120 430, 115 410, 95 390
    C 75 370, 80 340, 110 320
    C 135 305, 130 275, 105 250
    C 85 230, 95 190, 130 170
    C 160 150, 195 160, 220 140
    C 240 120, 260 90, 295 70
    Z
  `;

  return (
    <div className="relative bg-slate-900/90 border border-slate-800 rounded-2xl p-4 lg:p-6 shadow-xl flex flex-col items-center">
      
      {/* Map Header */}
      <div className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 mb-2 border-b border-slate-800">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <span>Spatial Dispersion</span>
            <span className="text-xs font-mono font-normal text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20">
              {String(currentHour).padStart(2, '0')}:00 UTC
            </span>
          </h2>
          <p className="text-xs text-slate-400">
            Real-time telemetry from all 113 active EPA stations.
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono">
          <div className="flex items-center gap-1 text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span>&lt;10</span>
          </div>
          <div className="flex items-center gap-1 text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
            <span>&lt;15 (WHO)</span>
          </div>
          <div className="flex items-center gap-1 text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            <span>15-25</span>
          </div>
          <div className="flex items-center gap-1 text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
            <span>25-50</span>
          </div>
          <div className="flex items-center gap-1 text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
            <span>50-100</span>
          </div>
          <div className="flex items-center gap-1 text-purple-300 font-bold">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-600 shadow-sm shadow-purple-500"></span>
            <span>&gt;100 µg</span>
          </div>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="relative w-full max-w-[540px] aspect-[560/680] flex items-center justify-center">
        <svg
          viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
          className="w-full h-full select-none"
        >
          {/* Defs for gradients & filters */}
          <defs>
            <radialGradient id="landGradient" cx="50%" cy="50%" r="60%">
              <stop offset="0%" stopColor="#1e293b" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#0f172a" stopOpacity="0.95" />
            </radialGradient>
            <filter id="glow-filter" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="4" />
            </filter>
          </defs>

          {/* Ocean Grid lines for geospatial aesthetic */}
          <g className="stroke-slate-800/40" strokeWidth="0.5" strokeDasharray="4 4">
            <line x1="50" y1="100" x2="510" y2="100" />
            <line x1="50" y1="250" x2="510" y2="250" />
            <line x1="50" y1="400" x2="510" y2="400" />
            <line x1="50" y1="550" x2="510" y2="550" />
            <line x1="150" y1="50" x2="150" y2="630" />
            <line x1="300" y1="50" x2="300" y2="630" />
            <line x1="450" y1="50" x2="450" y2="630" />
          </g>

          {/* Latitude / Longitude ticks */}
          <text x="50" y="95" className="fill-slate-600 text-[10px] font-mono">55°N</text>
          <text x="50" y="245" className="fill-slate-600 text-[10px] font-mono">54°N</text>
          <text x="50" y="395" className="fill-slate-600 text-[10px] font-mono">53°N</text>
          <text x="50" y="545" className="fill-slate-600 text-[10px] font-mono">52°N</text>
          <text x="155" y="660" className="fill-slate-600 text-[10px] font-mono">10°W</text>
          <text x="305" y="660" className="fill-slate-600 text-[10px] font-mono">8°W</text>
          <text x="455" y="660" className="fill-slate-600 text-[10px] font-mono">6°W</text>

          {/* Stylized Ireland Landmass */}
          <path
            d={irelandOutlinePath}
            fill="url(#landGradient)"
            stroke="#334155"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />

          {/* Major Urban Reference Labels */}
          {[
            { name: 'Dublin', lat: 53.3498, lon: -6.2603, anchor: 'start', dx: 8 },
            { name: 'Galway', lat: 53.2707, lon: -9.0568, anchor: 'end', dx: -8 },
            { name: 'Cork', lat: 51.8985, lon: -8.4756, anchor: 'middle', dy: 14 },
            { name: 'Limerick', lat: 52.6638, lon: -8.6267, anchor: 'end', dx: -8 },
            { name: 'Sligo', lat: 54.2766, lon: -8.4761, anchor: 'end', dx: -8 },
            { name: 'Waterford', lat: 52.2593, lon: -7.1101, anchor: 'start', dx: 8 },
          ].map((city) => {
            const pt = project(city.lat, city.lon);
            return (
              <g key={city.name} className="pointer-events-none opacity-40">
                <circle cx={pt.x} cy={pt.y} r="2" fill="#94a3b8" />
                <text
                  x={pt.x + (city.dx || 0)}
                  y={pt.y + (city.dy || 3)}
                  textAnchor={city.anchor as any}
                  className="fill-slate-400 text-[10px] font-medium tracking-wider"
                >
                  {city.name}
                </text>
              </g>
            );
          })}

          {/* EPA Monitoring Station Markers */}
          {hourlyPoints.map((pt) => {
            const { x, y } = project(pt.lat, pt.lon);
            const color = getPm25Color(pt.pm25);
            const isSelected = pt.code === selectedStationCode;
            const isHighSpike = pt.pm25 >= 50;
            const isSevere = pt.pm25 >= 100;
            const isTarget = !!targetStations[pt.code];

            return (
              <g
                key={pt.code}
                className="cursor-pointer transition-transform duration-200"
                onClick={() => onSelectStation(pt.code)}
                onMouseEnter={() => setHoveredPoint(pt)}
                onMouseLeave={() => setHoveredPoint(null)}
              >
                {/* Severe Spikes: Pulsing outer halo */}
                {isSevere && (
                  <circle
                    cx={x}
                    cy={y}
                    r="16"
                    fill={color.bg}
                    opacity="0.25"
                    className="animate-ping"
                  />
                )}

                {/* High Spikes: Soft glowing aura */}
                {isHighSpike && (
                  <circle
                    cx={x}
                    cy={y}
                    r={isSelected ? 14 : 10}
                    fill={color.bg}
                    opacity="0.3"
                  />
                )}

                {/* Selection Ring */}
                {isSelected && (
                  <circle
                    cx={x}
                    cy={y}
                    r="12"
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth="2"
                    strokeDasharray="2 2"
                  />
                )}

                {/* Main Core Dot */}
                <circle
                  cx={x}
                  cy={y}
                  r={isSelected ? 6 : isTarget ? 5 : 3.5}
                  fill={color.bg}
                  stroke={isSelected ? '#ffffff' : '#090d16'}
                  strokeWidth={isSelected ? 2 : 1}
                />

                {/* Target Towns: Subtle Label if spike > 30 */}
                {isTarget && (pt.pm25 >= 35 || isSelected) && (
                  <g className="pointer-events-none">
                    <rect
                      x={x + 7}
                      y={y - 12}
                      width={pt.name.length * 6.2 + 36}
                      height={18}
                      rx="4"
                      fill="#0f172a"
                      fillOpacity="0.9"
                      stroke={isSelected ? '#ffffff' : color.bg}
                      strokeWidth="1"
                    />
                    <text
                      x={x + 11}
                      y={y}
                      className="fill-white text-[10px] font-semibold"
                    >
                      {pt.name}: <tspan fill={color.bg} fontWeight="bold">{pt.pm25}</tspan>
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>

        {/* Hover Floating Card Tooltip */}
        {hoveredPoint && (
          <div
            className="absolute z-20 pointer-events-none bg-slate-900/95 border border-slate-700/80 rounded-xl p-3 shadow-2xl backdrop-blur-md text-xs min-w-[210px]"
            style={{
              top: Math.min(Math.max(project(hoveredPoint.lat, hoveredPoint.lon).y - 80, 10), SVG_HEIGHT - 120),
              left: Math.min(Math.max(project(hoveredPoint.lat, hoveredPoint.lon).x + 15, 10), 320),
            }}
          >
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
              <span className="font-bold text-white truncate max-w-[140px]">
                {hoveredPoint.name}
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                {hoveredPoint.code}
              </span>
            </div>

            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-slate-400">PM2.5 (Fine Soot):</span>
              <span
                className="text-base font-extrabold font-mono"
                style={{ color: getPm25Color(hoveredPoint.pm25).bg }}
              >
                {hoveredPoint.pm25} µg/m³
              </span>
            </div>

            <div className="mt-1 flex items-center justify-between text-[11px]">
              <span className="text-slate-500">WHO Guideline (15):</span>
              <span
                className={`font-mono font-semibold ${
                  hoveredPoint.pm25 > whoLimit ? 'text-rose-400' : 'text-emerald-400'
                }`}
              >
                {hoveredPoint.pm25 > whoLimit
                  ? `${(hoveredPoint.pm25 / whoLimit).toFixed(1)}× Above Limit`
                  : 'Compliant'}
              </span>
            </div>

            <div className="mt-2 pt-1.5 border-t border-slate-800/80 text-[10px] text-slate-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400"></span>
              <span>Click to compare with Dublin Baseline</span>
            </div>
          </div>
        )}
      </div>

      {/* Map Footer Helper */}
      <div className="w-full mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-orange-400" />
          <span>Click any marker to duel against Dublin Phoenix Park</span>
        </div>
        <div className="text-[11px] font-mono text-slate-500">
          Source: EPA AURN
        </div>
      </div>

    </div>
  );
};
