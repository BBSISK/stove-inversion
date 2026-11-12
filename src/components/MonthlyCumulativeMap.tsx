import React, { useState, useEffect, useMemo } from 'react';
import { AirData } from '../types';
import { IRELAND_COUNTIES } from '../data/irelandGeo';
import { GLOBAL_BENCHMARKS } from '../data/globalBenchmarks';
import {
  Play,
  Pause,
  RotateCcw,
  FastForward,
  Maximize2,
  Minimize2,
  Flame,
  Calendar,
  TrendingUp,
  Wind,
  Globe,
} from 'lucide-react';

interface MonthlyCumulativeMapProps {
  data: AirData;
  selectedStationCode: string;
  onSelectStation: (code: string) => void;
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

// 30-Day November Synoptic Weather Schedule (Anticyclonic Inversion Domes vs Atlantic Gales)
const NOVEMBER_SYNOPTIC_DAYS: {
  day: number;
  dateLabel: string;
  regime: 'inversion' | 'atlantic' | 'frost';
  regimeTitle: string;
  valleyFactor: number;
  urbanFactor: number;
  windKmh: number;
  nightTempC: number;
}[] = [
  { day: 1, dateLabel: 'Nov 1', regime: 'inversion', regimeTitle: 'Calm Anticyclone Onset', valleyFactor: 1.35, urbanFactor: 1.05, windKmh: 7, nightTempC: 2.5 },
  { day: 2, dateLabel: 'Nov 2', regime: 'inversion', regimeTitle: 'Severe Nocturnal Inversion Peak', valleyFactor: 1.95, urbanFactor: 1.12, windKmh: 4, nightTempC: -0.5 },
  { day: 3, dateLabel: 'Nov 3', regime: 'inversion', regimeTitle: 'Stagnant Valley Trapping', valleyFactor: 1.65, urbanFactor: 1.08, windKmh: 6, nightTempC: 0.8 },
  { day: 4, dateLabel: 'Nov 4', regime: 'inversion', regimeTitle: 'High Pressure Thermal Lid', valleyFactor: 1.50, urbanFactor: 1.05, windKmh: 8, nightTempC: 1.5 },
  { day: 5, dateLabel: 'Nov 5', regime: 'inversion', regimeTitle: 'Calm Evening Hearth Accumulation', valleyFactor: 1.42, urbanFactor: 1.02, windKmh: 9, nightTempC: 2.1 },
  { day: 6, dateLabel: 'Nov 6', regime: 'inversion', regimeTitle: 'Lingering Mist & Cold Basin Air', valleyFactor: 1.30, urbanFactor: 1.00, windKmh: 11, nightTempC: 3.0 },
  { day: 7, dateLabel: 'Nov 7', regime: 'atlantic', regimeTitle: 'Atlantic Westerly Breeze', valleyFactor: 0.78, urbanFactor: 0.88, windKmh: 28, nightTempC: 8.4 },
  { day: 8, dateLabel: 'Nov 8', regime: 'atlantic', regimeTitle: 'Maritime Gale Dispersion', valleyFactor: 0.52, urbanFactor: 0.75, windKmh: 42, nightTempC: 9.8 },
  { day: 9, dateLabel: 'Nov 9', regime: 'atlantic', regimeTitle: 'Clean Atlantic Airflow', valleyFactor: 0.55, urbanFactor: 0.78, windKmh: 38, nightTempC: 9.1 },
  { day: 10, dateLabel: 'Nov 10', regime: 'atlantic', regimeTitle: 'Post-Frontal Clearing', valleyFactor: 0.68, urbanFactor: 0.84, windKmh: 24, nightTempC: 7.2 },
  { day: 11, dateLabel: 'Nov 11', regime: 'atlantic', regimeTitle: 'Slackening Westerly Flow', valleyFactor: 0.88, urbanFactor: 0.92, windKmh: 18, nightTempC: 5.5 },
  { day: 12, dateLabel: 'Nov 12', regime: 'inversion', regimeTitle: 'Clear Sky Radiational Cooling', valleyFactor: 1.25, urbanFactor: 1.00, windKmh: 9, nightTempC: 1.8 },
  { day: 13, dateLabel: 'Nov 13', regime: 'frost', regimeTitle: 'Midland Frost & Hearth Surge', valleyFactor: 1.52, urbanFactor: 1.06, windKmh: 5, nightTempC: -1.2 },
  { day: 14, dateLabel: 'Nov 14', regime: 'frost', regimeTitle: 'Deep Valley Temperature Inversion', valleyFactor: 1.68, urbanFactor: 1.10, windKmh: 4, nightTempC: -1.8 },
  { day: 15, dateLabel: 'Nov 15', regime: 'frost', regimeTitle: 'Persistent Anticyclonic Dome', valleyFactor: 1.58, urbanFactor: 1.07, windKmh: 6, nightTempC: -0.9 },
  { day: 16, dateLabel: 'Nov 16', regime: 'frost', regimeTitle: 'Freezing Fog & Trapped Soot', valleyFactor: 1.72, urbanFactor: 1.12, windKmh: 4, nightTempC: -2.1 },
  { day: 17, dateLabel: 'Nov 17', regime: 'inversion', regimeTitle: 'Calm Boundary Layer Collapse', valleyFactor: 1.45, urbanFactor: 1.04, windKmh: 8, nightTempC: 0.6 },
  { day: 18, dateLabel: 'Nov 18', regime: 'inversion', regimeTitle: 'Evening Solid-Fuel Peak', valleyFactor: 1.38, urbanFactor: 1.02, windKmh: 10, nightTempC: 1.4 },
  { day: 19, dateLabel: 'Nov 19', regime: 'inversion', regimeTitle: 'Still Autumn/Winter Transition', valleyFactor: 1.32, urbanFactor: 0.98, windKmh: 11, nightTempC: 2.2 },
  { day: 20, dateLabel: 'Nov 20', regime: 'atlantic', regimeTitle: 'Brief Coastal Breeze', valleyFactor: 0.82, urbanFactor: 0.90, windKmh: 22, nightTempC: 6.5 },
  { day: 21, dateLabel: 'Nov 21', regime: 'atlantic', regimeTitle: 'Moderate Southerly Drift', valleyFactor: 0.85, urbanFactor: 0.92, windKmh: 20, nightTempC: 6.0 },
  { day: 22, dateLabel: 'Nov 22', regime: 'inversion', regimeTitle: 'High Pressure Ridge Rebuilds', valleyFactor: 1.28, urbanFactor: 1.01, windKmh: 9, nightTempC: 1.9 },
  { day: 23, dateLabel: 'Nov 23', regime: 'frost', regimeTitle: 'Sharp Nocturnal Frost Lid', valleyFactor: 1.55, urbanFactor: 1.06, windKmh: 5, nightTempC: -1.0 },
  { day: 24, dateLabel: 'Nov 24', regime: 'frost', regimeTitle: 'Severe Basin Smog Trapping', valleyFactor: 1.66, urbanFactor: 1.09, windKmh: 5, nightTempC: -1.5 },
  { day: 25, dateLabel: 'Nov 25', regime: 'frost', regimeTitle: 'Sub-Zero Hearth Ignition Surge', valleyFactor: 1.75, urbanFactor: 1.11, windKmh: 4, nightTempC: -2.4 },
  { day: 26, dateLabel: 'Nov 26', regime: 'frost', regimeTitle: 'Stagnant Inversion Ceiling', valleyFactor: 1.60, urbanFactor: 1.08, windKmh: 6, nightTempC: -1.1 },
  { day: 27, dateLabel: 'Nov 27', regime: 'inversion', regimeTitle: 'Calm Cold River Basin Pooling', valleyFactor: 1.48, urbanFactor: 1.04, windKmh: 7, nightTempC: 0.2 },
  { day: 28, dateLabel: 'Nov 28', regime: 'inversion', regimeTitle: 'Widespread Evening Turf Smoke', valleyFactor: 1.52, urbanFactor: 1.05, windKmh: 6, nightTempC: -0.3 },
  { day: 29, dateLabel: 'Nov 29', regime: 'frost', regimeTitle: 'Late-Month Winter Freeze', valleyFactor: 1.64, urbanFactor: 1.08, windKmh: 5, nightTempC: -1.6 },
  { day: 30, dateLabel: 'Nov 30', regime: 'frost', regimeTitle: '30-Day Cumulative Peak Burden', valleyFactor: 1.58, urbanFactor: 1.06, windKmh: 6, nightTempC: -0.8 },
];

// Color scale for Cumulative Monthly WHO Breach Hours (0 to 220+ hours over 30 days)
export const getCumulativeColor = (breachHours: number, cumDose: number) => {
  if (breachHours <= 12 && cumDose < 3500) {
    return { bg: '#10b981', glow: '#059669', label: 'Low Cumulative Load' };
  }
  if (breachHours <= 30) {
    return { bg: '#38bdf8', glow: '#0284c7', label: 'Baseline Urban Load' };
  }
  if (breachHours <= 65) {
    return { bg: '#fbbf24', glow: '#d97706', label: 'Moderate Accumulation' };
  }
  if (breachHours <= 115) {
    return { bg: '#f97316', glow: '#ea580c', label: 'High Hearth Burden' };
  }
  if (breachHours <= 165) {
    return { bg: '#f43f5e', glow: '#e11d48', label: 'Severe Monthly Breach' };
  }
  return { bg: '#d946ef', glow: '#a21caf', label: 'Extreme Valley Accumulation' };
};

const CALLOUT_STATIONS: {
  code: string;
  shortLabel: string;
  side: 'left' | 'right';
  boxY: number;
  isBaseline?: boolean;
}[] = [
  { code: 'AQG-23568', shortLabel: 'Achill Island', side: 'left', boxY: 215, isBaseline: true },
  { code: 'EPA-43', shortLabel: 'Longford', side: 'left', boxY: 295 },
  { code: 'EPA-25', shortLabel: 'Ennis (Clare)', side: 'left', boxY: 425 },
  { code: 'EPA-71', shortLabel: 'Tralee (Kerry)', side: 'left', boxY: 515 },
  { code: 'EPA-67', shortLabel: 'Macroom (Cork)', side: 'left', boxY: 600 },
  { code: 'EPA-64', shortLabel: 'Letterkenny', side: 'right', boxY: 95 },
  { code: 'EPA-78', shortLabel: 'Cavan Town', side: 'right', boxY: 235 },
  { code: 'EPA-48', shortLabel: 'Dublin (Phoenix Pk)', side: 'right', boxY: 345, isBaseline: true },
  { code: 'EPA-24', shortLabel: 'Enniscorthy', side: 'right', boxY: 485 },
];

export const MonthlyCumulativeMap: React.FC<MonthlyCumulativeMapProps> = ({
  data,
  selectedStationCode,
  onSelectStation,
}) => {
  const [currentDay, setCurrentDay] = useState<number>(30);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(1);
  const [cinemaMode, setCinemaMode] = useState<boolean>(false);
  const [showGlobalCities, setShowGlobalCities] = useState<boolean>(true);
  const [hoveredCode, setHoveredCode] = useState<string | null>(null);

  // Playback loop across Day 1 -> Day 30
  useEffect(() => {
    if (!isPlaying) return;
    const ms = speed === 2 ? 260 : 480;
    const timer = setInterval(() => {
      setCurrentDay((prev) => {
        if (prev >= 30) return 1;
        return prev + 1;
      });
    }, ms);
    return () => clearInterval(timer);
  }, [isPlaying, speed]);

  // Pre-build 32-county SVG paths
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

  // Precompute 30-day cumulative series for all 113 Irish stations + 4 Global Megacities
  const cumulativeByDay = useMemo(() => {
    const whoLimit = data.metadata.whoGuidelineDailyPm25; // 15.0

    // Base daily profile for each Irish station from hourlySnapshots (hours 0..23)
    const stationHourlyMap: Record<string, number[]> = {};
    for (let h = 0; h < 24; h++) {
      const snap = data.hourlySnapshots[String(h)] || [];
      for (const pt of snap) {
        if (!stationHourlyMap[pt.code]) stationHourlyMap[pt.code] = [];
        stationHourlyMap[pt.code].push(pt.pm25);
      }
    }

    // Also include global benchmarks hourly profiles
    for (const [gCode, gStation] of Object.entries(GLOBAL_BENCHMARKS)) {
      stationHourlyMap[gCode] = gStation.profile24h.map((p) => p.averagePm25);
    }

    const daysMap: Record<
      number,
      {
        stations: {
          code: string;
          name: string;
          lat: number;
          lon: number;
          cumDose: number;
          cumBreachHours: number;
          eveningPeakMean: number;
          cigarettesEq: number;
        }[];
        byCode: Record<string, any>;
      }
    > = {};

    const runningDose: Record<string, number> = {};
    const runningBreach: Record<string, number> = {};

    for (const st of data.allStations) {
      runningDose[st.code] = 0;
      runningBreach[st.code] = 0;
    }
    for (const gCode of Object.keys(GLOBAL_BENCHMARKS)) {
      runningDose[gCode] = 0;
      runningBreach[gCode] = 0;
    }

    for (const syn of NOVEMBER_SYNOPTIC_DAYS) {
      const d = syn.day;
      const dayList = [];
      const dayByCode: Record<string, any> = {};

      // 1. Process 113 Irish stations
      for (const st of data.allStations) {
        const hours24 = stationHourlyMap[st.code] || Array(24).fill(8);
        const isUrbanOrClean =
          st.name.includes('Dublin') ||
          st.code === 'EPA-48' ||
          st.code === 'EPA-22' ||
          st.code === 'EPA-91' ||
          st.code === 'AQG-23568';

        let dayDose = 0;
        let dayBreaches = 0;

        for (let h = 0; h < 24; h++) {
          const baseVal = hours24[h] || 8;
          const isEvening = h >= 17 || h <= 2;
          const factor = isUrbanOrClean
            ? syn.urbanFactor
            : isEvening
            ? syn.valleyFactor
            : (syn.valleyFactor + 1) / 2;

          const simVal = baseVal * factor;
          dayDose += simVal;
          if (simVal > whoLimit) {
            dayBreaches += 1;
          }
        }

        runningDose[st.code] += dayDose;
        runningBreach[st.code] += dayBreaches;

        const evAvg = ((hours24[19] || 12) + (hours24[20] || 12) + (hours24[21] || 12)) / 3;
        const item = {
          code: st.code,
          name: st.name,
          lat: st.lat,
          lon: st.lon,
          cumDose: Math.round(runningDose[st.code]),
          cumBreachHours: runningBreach[st.code],
          eveningPeakMean: Math.round(evAvg * 10) / 10,
          cigarettesEq: Math.round((runningDose[st.code] / 528) * 10) / 10,
        };
        dayList.push(item);
        dayByCode[st.code] = item;
      }

      // 2. Process Global Megacity Benchmarks
      for (const [gCode, gSt] of Object.entries(GLOBAL_BENCHMARKS)) {
        const hours24 = stationHourlyMap[gCode];
        let dayDose = 0;
        let dayBreaches = 0;

        for (let h = 0; h < 24; h++) {
          const baseVal = hours24[h] || 10;
          const simVal = baseVal * syn.urbanFactor;
          dayDose += simVal;
          if (simVal > whoLimit) {
            dayBreaches += 1;
          }
        }

        runningDose[gCode] += dayDose;
        runningBreach[gCode] += dayBreaches;

        dayByCode[gCode] = {
          code: gCode,
          name: `${gSt.flag} ${gSt.name}`,
          lat: gSt.lat,
          lon: gSt.lon,
          cumDose: Math.round(runningDose[gCode]),
          cumBreachHours: runningBreach[gCode],
          eveningPeakMean: gSt.profile24h[19]?.averagePm25 || 14,
          cigarettesEq: Math.round((runningDose[gCode] / 528) * 10) / 10,
          isGlobal: true,
          globalColor: gSt.color,
        };
      }

      daysMap[d] = { stations: dayList, byCode: dayByCode };
    }

    return daysMap;
  }, [data]);

  const currentSnapshot = cumulativeByDay[currentDay] || cumulativeByDay[30];
  const currentSynoptic = NOVEMBER_SYNOPTIC_DAYS[currentDay - 1] || NOVEMBER_SYNOPTIC_DAYS[29];

  // Key benchmark stations for the animated Cumulative Bar Race
  const raceStations = useMemo(() => {
    const baseCodes = ['EPA-25', 'EPA-71', 'EPA-43', 'EPA-67', 'EPA-48'];
    const globalCodes = showGlobalCities
      ? ['GLOBAL-LON', 'GLOBAL-NYC', 'GLOBAL-PAR']
      : ['EPA-24', 'EPA-78', 'AQG-23568'];

    const allCodes = [...baseCodes, ...globalCodes];

    return allCodes
      .map((code) => {
        const st = currentSnapshot.byCode[code];
        const target = data.targetStations[code];
        const globalSt = GLOBAL_BENCHMARKS[code];
        if (!st) return null;
        return {
          ...st,
          displayName: globalSt
            ? `${globalSt.flag} ${globalSt.name}`
            : target
            ? `🇮🇪 ${target.name} (${target.county})`
            : `🇮🇪 ${st.name}`,
          isBaseline: code === 'EPA-48' || code === 'AQG-23568' || !!globalSt,
          customColor: globalSt?.color,
        };
      })
      .filter(Boolean)
      .sort((a, b) => b!.cumBreachHours - a!.cumBreachHours || b!.cumDose - a!.cumDose) as {
      code: string;
      displayName: string;
      cumDose: number;
      cumBreachHours: number;
      cigarettesEq: number;
      isBaseline: boolean;
      customColor?: string;
    }[];
  }, [currentSnapshot, data.targetStations, showGlobalCities]);

  // Helper to shade county polygons based on cumulative progression from Day 1 -> Day 30
  const getCountyCumulativeFill = (cx: number, cy: number, region: 'ROI' | 'NI') => {
    if (region === 'NI') return '#0c1322';
    let weightedBreach = 0;
    let weightTotal = 0;

    for (const pt of currentSnapshot.stations) {
      const { x, y } = project(pt.lat, pt.lon);
      const distSq = (x - cx) * (x - cx) + (y - cy) * (y - cy) + 180;
      if (distSq < 13000) {
        const w = 1 / distSq;
        weightedBreach += pt.cumBreachHours * w;
        weightTotal += w;
      }
    }

    const estBreach = weightTotal > 0 ? weightedBreach / weightTotal : 5;
    if (estBreach <= 12) return '#112233';
    if (estBreach <= 30) return '#16293d';
    if (estBreach <= 65) return '#2d261a';
    if (estBreach <= 110) return '#3b1f18';
    if (estBreach <= 155) return '#471627';
    return '#3f1242';
  };

  const ennisStat = currentSnapshot.byCode['EPA-25'];
  const dublinStat = currentSnapshot.byCode['EPA-48'];
  const londonStat = currentSnapshot.byCode['GLOBAL-LON'];
  const nycStat = currentSnapshot.byCode['GLOBAL-NYC'];
  const hoveredStation = hoveredCode ? currentSnapshot.byCode[hoveredCode] : null;

  const handleStartTimelapse = () => {
    if (!isPlaying && currentDay === 30) {
      setCurrentDay(1);
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <div
      className={`${
        cinemaMode
          ? 'fixed inset-0 z-50 bg-slate-950 p-4 sm:p-6 overflow-y-auto flex flex-col justify-center'
          : 'relative w-full'
      }`}
    >
      <div className="max-w-7xl w-full mx-auto bg-slate-900/95 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-2xl">
        {/* Top Banner: Title + Scrubber Controls + Cinema Toggle */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-fuchsia-500/15 text-fuchsia-300 border border-fuchsia-500/30">
                <Calendar className="w-3.5 h-3.5" />
                30-Day Cumulative Monthly Timelapse
              </span>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                  currentSynoptic.regime === 'atlantic'
                    ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                    : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                }`}
              >
                <Wind className="w-3.5 h-3.5" />
                Day {currentDay} ({currentSynoptic.dateLabel}): {currentSynoptic.regimeTitle}
              </span>
            </div>

            <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
              How 30 Nights of 7:00 PM "Stove Inversions" Outpollute London, New York &amp; Paris
            </h2>
            <p className="text-xs text-slate-400">
              Watch cumulative WHO breach hours (&gt;15 µg/m³) build up night after night in regional Irish river valleys compared against Dublin, London, and Manhattan.
            </p>
          </div>

          {/* Right Controls: Play 30-Day Timelapse + Speed + Cinema Frame */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={() => {
                setIsPlaying(false);
                setCurrentDay(1);
              }}
              title="Reset to Day 1 (Nov 1)"
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={handleStartTimelapse}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs tracking-wide transition cursor-pointer ${
                isPlaying
                  ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-lg shadow-amber-500/20'
                  : 'bg-gradient-to-r from-orange-500 to-fuchsia-500 hover:from-orange-600 hover:to-fuchsia-600 text-white shadow-lg shadow-fuchsia-500/25'
              }`}
            >
              {isPlaying ? (
                <>
                  <Pause className="w-4 h-4 fill-current" />
                  <span>PAUSE TIMELAPSE</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>PLAY 30-DAY TIMELAPSE</span>
                </>
              )}
            </button>

            <button
              onClick={() => setSpeed(speed === 1 ? 2 : 1)}
              className="px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-mono transition cursor-pointer flex items-center gap-1"
            >
              <FastForward className="w-3.5 h-3.5 text-orange-400" />
              <span>{speed}x</span>
            </button>

            <button
              onClick={() => setCinemaMode(!cinemaMode)}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-300 border border-sky-500/30 text-xs font-semibold transition cursor-pointer flex items-center gap-1.5"
              title="Toggle clean full-screen frame for LinkedIn video/GIF capture"
            >
              {cinemaMode ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              <span>{cinemaMode ? 'Exit Cinema Frame' : 'LinkedIn Capture Frame'}</span>
            </button>
          </div>
        </div>

        {/* Global Megacity Evening Peak Comparison Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 mt-4">
          {[
            {
              flag: '🇮🇪',
              city: 'Ennis (Co. Clare)',
              pop: 'Pop. 27,000',
              peak: '198.1 µg/m³',
              hrs: `${ennisStat?.cumBreachHours || 0}h >WHO`,
              badge: 'text-fuchsia-300 border-fuchsia-500/40 bg-fuchsia-500/10',
              valColor: 'text-fuchsia-400',
            },
            {
              flag: '🇮🇪',
              city: 'Tralee (Co. Kerry)',
              pop: 'Pop. 26,000',
              peak: '142.0 µg/m³',
              hrs: `${currentSnapshot.byCode['EPA-71']?.cumBreachHours || 0}h >WHO`,
              badge: 'text-rose-300 border-rose-500/30 bg-rose-500/10',
              valColor: 'text-rose-400',
            },
            {
              flag: '🇨🇳',
              city: 'Beijing (Chaoyang)',
              pop: 'Pop. 21.5M',
              peak: '61.0 µg/m³',
              hrs: `${currentSnapshot.byCode['GLOBAL-BJS']?.cumBreachHours || 0}h >WHO`,
              badge: 'text-amber-300 border-amber-500/30 bg-slate-950',
              valColor: 'text-amber-400',
            },
            {
              flag: '🇫🇷',
              city: 'Paris (Centre)',
              pop: 'Pop. 11.2M',
              peak: '18.6 µg/m³',
              hrs: `${currentSnapshot.byCode['GLOBAL-PAR']?.cumBreachHours || 0}h >WHO`,
              badge: 'text-indigo-300 border-slate-800 bg-slate-950',
              valColor: 'text-indigo-400',
            },
            {
              flag: '🇬🇧',
              city: 'London (Westminster)',
              pop: 'Pop. 8.9M',
              peak: '17.8 µg/m³',
              hrs: `${londonStat?.cumBreachHours || 0}h >WHO`,
              badge: 'text-sky-300 border-slate-800 bg-slate-950',
              valColor: 'text-sky-400',
            },
            {
              flag: '🇺🇸',
              city: 'New York (Manhattan)',
              pop: 'Pop. 8.5M',
              peak: '12.5 µg/m³',
              hrs: `${nycStat?.cumBreachHours || 0}h >WHO`,
              badge: 'text-emerald-300 border-slate-800 bg-slate-950',
              valColor: 'text-emerald-400',
            },
          ].map((item) => (
            <div
              key={item.city}
              className={`rounded-xl border p-2.5 flex flex-col justify-between ${item.badge}`}
            >
              <div className="flex items-center justify-between text-[11px] font-bold text-white">
                <span className="truncate">
                  {item.flag} {item.city}
                </span>
              </div>
              <div className="mt-1 flex items-baseline justify-between">
                <span className={`text-sm font-extrabold font-mono ${item.valColor}`}>
                  {item.hrs}
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  Pk: {item.peak}
                </span>
              </div>
              <span className="text-[9.5px] text-slate-500 mt-0.5">{item.pop}</span>
            </div>
          ))}
        </div>

        {/* 30-Day Interactive Timeline Scrubber Bar */}
        <div className="my-4 bg-slate-950/90 border border-slate-800/90 rounded-xl p-3">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <div className="flex items-center gap-2 font-mono">
              <span className="px-2 py-0.5 rounded bg-orange-500/20 text-orange-300 font-bold border border-orange-500/30">
                DAY {String(currentDay).padStart(2, '0')} / 30 ({currentSynoptic.dateLabel})
              </span>
              <span className="text-slate-400 text-[11px]">
                Night Temp: <strong className="text-slate-200">{currentSynoptic.nightTempC}°C</strong> • Wind:{' '}
                <strong className="text-slate-200">{currentSynoptic.windKmh} km/h</strong>
              </span>
            </div>
            <div className="text-[11px] font-mono text-slate-400 hidden sm:block">
              Cumulative Hours Monitored: <strong className="text-white">{currentDay * 24} hrs</strong>
            </div>
          </div>

          <input
            type="range"
            min="1"
            max="30"
            step="1"
            value={currentDay}
            onChange={(e) => setCurrentDay(parseInt(e.target.value, 10))}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-fuchsia-500"
          />

          <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1 px-0.5">
            <span>Nov 1 (Start)</span>
            <span className="text-rose-400">Nov 2–6 (Inversion #1)</span>
            <span className="text-emerald-400">Nov 8–11 (Atlantic Gale)</span>
            <span className="text-fuchsia-400">Nov 13–18 (Frost Lid #2)</span>
            <span className="text-rose-400">Nov 23–30 (Deep Freeze #3)</span>
          </div>
        </div>

        {/* Main 12-Column Summary Layout: Left 7 Cols = Ireland Cumulative Map, Right 5 Cols = Cumulative Bar Race & Staircase */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          {/* LEFT: All-Island 30-Day Cumulative Map */}
          <div className="lg:col-span-7 bg-slate-950/85 border border-slate-800 rounded-2xl p-3 flex flex-col justify-between relative overflow-hidden">
            {/* Map Subheader & Cumulative Color Legend */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800/80 z-10">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">
                  Cumulative Soot Load (Day 1 &rarr; Day {currentDay})
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-[9.5px] font-mono">
                <span className="text-slate-400">WHO Breach Hrs:</span>
                <span className="flex items-center gap-1 text-slate-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>&le;12h
                </span>
                <span className="flex items-center gap-1 text-slate-300">
                  <span className="w-2 h-2 rounded-full bg-sky-400"></span>&le;30h
                </span>
                <span className="flex items-center gap-1 text-slate-300">
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span>30–65h
                </span>
                <span className="flex items-center gap-1 text-slate-300">
                  <span className="w-2 h-2 rounded-full bg-orange-500"></span>65–115h
                </span>
                <span className="flex items-center gap-1 text-slate-300">
                  <span className="w-2 h-2 rounded-full bg-rose-500"></span>115–165h
                </span>
                <span className="flex items-center gap-1 text-fuchsia-300 font-bold">
                  <span className="w-2.5 h-2.5 rounded-full bg-fuchsia-500"></span>&gt;165h
                </span>
              </div>
            </div>

            {/* SVG Map */}
            <div className="relative w-full flex-1 flex items-center justify-center">
              <svg
                viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
                className="w-full h-auto max-h-[560px] select-none"
              >
                <defs>
                  <filter id="cumPlumeBlur" x="-100%" y="-100%" width="300%" height="300%">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="15" />
                  </filter>
                  <pattern
                    id="niHatchCum"
                    width="8"
                    height="8"
                    patternTransform="rotate(45 0 0)"
                    patternUnits="userSpaceOnUse"
                  >
                    <line x1="0" y1="0" x2="0" y2="8" stroke="#1e293b" strokeWidth="1.5" />
                  </pattern>
                </defs>

                {/* Subtle Graticule */}
                <g className="stroke-slate-800/35" strokeWidth="0.6" strokeDasharray="3 5">
                  {[52, 53, 54, 55].map((lat) => {
                    const { y } = project(lat, -8);
                    return <line key={lat} x1="0" y1={y} x2={SVG_WIDTH} y2={y} />;
                  })}
                  {[-10, -9, -8, -7, -6].map((lon) => {
                    const { x } = project(53.5, lon);
                    return <line key={lon} x1={x} y1="0" x2={x} y2={SVG_HEIGHT} />;
                  })}
                </g>

                {/* 32 County Polygons shaded by Cumulative Breach Progression */}
                <g>
                  {countyPaths.map((cp) => (
                    <g key={cp.id}>
                      <path
                        d={cp.d}
                        fill={getCountyCumulativeFill(cp.cx, cp.cy, cp.region)}
                        stroke={cp.region === 'ROI' ? '#334155' : '#1e293b'}
                        strokeWidth={cp.region === 'ROI' ? '0.9' : '0.6'}
                        strokeLinejoin="round"
                        className="transition-colors duration-300"
                      />
                      {cp.region === 'NI' && (
                        <path d={cp.d} fill="url(#niHatchCum)" opacity="0.4" className="pointer-events-none" />
                      )}
                    </g>
                  ))}
                </g>

                {/* Cumulative Atmospheric Soot Plumes (grow as cumulative breach hours climb) */}
                <g filter="url(#cumPlumeBlur)" className="pointer-events-none">
                  {currentSnapshot.stations.map((pt) => {
                    if (pt.cumBreachHours < 8) return null;
                    const { x, y } = project(pt.lat, pt.lon);
                    const color = getCumulativeColor(pt.cumBreachHours, pt.cumDose);
                    const radius = Math.min(52, 10 + Math.sqrt(pt.cumBreachHours) * 2.8);
                    const opacity = Math.min(0.7, 0.14 + (pt.cumBreachHours / 210) * 0.55);
                    return (
                      <circle
                        key={`cum-plume-${pt.code}`}
                        cx={x}
                        cy={y}
                        r={radius}
                        fill={color.bg}
                        opacity={opacity}
                      />
                    );
                  })}
                </g>

                {/* All 113 Station Beacons */}
                <g>
                  {currentSnapshot.stations.map((pt) => {
                    const { x, y } = project(pt.lat, pt.lon);
                    const color = getCumulativeColor(pt.cumBreachHours, pt.cumDose);
                    const isSelected = pt.code === selectedStationCode;
                    const isSevere = pt.cumBreachHours >= 130;

                    return (
                      <g
                        key={pt.code}
                        className="cursor-pointer"
                        onClick={() => onSelectStation(pt.code)}
                        onMouseEnter={() => setHoveredCode(pt.code)}
                        onMouseLeave={() => setHoveredCode(null)}
                      >
                        {isSevere && (
                          <circle
                            cx={x}
                            cy={y}
                            r="14"
                            fill="none"
                            stroke={color.bg}
                            strokeWidth="1.4"
                            opacity="0.55"
                            className="animate-ping"
                          />
                        )}
                        {isSelected && (
                          <circle
                            cx={x}
                            cy={y}
                            r="11"
                            fill="none"
                            stroke="#ffffff"
                            strokeWidth="1.75"
                            strokeDasharray="3 2"
                          />
                        )}
                        <circle
                          cx={x}
                          cy={y}
                          r={isSelected ? 5.8 : pt.cumBreachHours > 60 ? 4.5 : 3.2}
                          fill={color.bg}
                          stroke={isSelected ? '#ffffff' : '#090d16'}
                          strokeWidth={isSelected ? 2 : 1}
                        />
                      </g>
                    );
                  })}
                </g>

                {/* Margin Callout Badges showing Cumulative WHO Breach Hours */}
                <g>
                  {CALLOUT_STATIONS.map((item) => {
                    const st = currentSnapshot.byCode[item.code];
                    if (!st) return null;
                    const { x, y } = project(st.lat, st.lon);
                    const color = getCumulativeColor(st.cumBreachHours, st.cumDose);
                    const isSelected = st.code === selectedStationCode;

                    const boxWidth = 132;
                    const boxHeight = 26;
                    const boxX = item.side === 'left' ? 6 : SVG_WIDTH - boxWidth - 6;
                    const anchorX = item.side === 'left' ? boxX + boxWidth : boxX;
                    const elbowX = item.side === 'left' ? anchorX + 10 : anchorX - 10;
                    const boxCenterY = item.boxY;

                    return (
                      <g
                        key={`cum-callout-${item.code}`}
                        className="cursor-pointer"
                        onClick={() => onSelectStation(item.code)}
                        onMouseEnter={() => setHoveredCode(item.code)}
                        onMouseLeave={() => setHoveredCode(null)}
                      >
                        <polyline
                          points={`${x},${y} ${elbowX},${boxCenterY} ${anchorX},${boxCenterY}`}
                          fill="none"
                          stroke={isSelected ? '#ffffff' : color.bg}
                          strokeWidth={isSelected ? '1.5' : '1'}
                          strokeDasharray={item.isBaseline ? '2 2' : undefined}
                          opacity="0.75"
                        />
                        <circle cx={anchorX} cy={boxCenterY} r="2" fill={color.bg} />
                        <rect
                          x={boxX}
                          y={boxCenterY - boxHeight / 2}
                          width={boxWidth}
                          height={boxHeight}
                          rx="5"
                          fill="#090d16"
                          fillOpacity="0.93"
                          stroke={isSelected ? '#ffffff' : color.bg}
                          strokeWidth={isSelected ? '1.5' : '0.9'}
                        />
                        <text
                          x={boxX + 6}
                          y={boxCenterY + 3.5}
                          className="fill-slate-200 text-[9.5px] font-semibold"
                        >
                          {item.shortLabel}
                        </text>
                        <text
                          x={boxX + boxWidth - 6}
                          y={boxCenterY + 3.5}
                          textAnchor="end"
                          fill={color.bg}
                          className="text-[9.5px] font-mono font-extrabold"
                        >
                          {st.cumBreachHours}h &gt;WHO
                        </text>
                      </g>
                    );
                  })}
                </g>
              </svg>

              {/* Hover Station Details Overlay */}
              {hoveredStation && (
                <div className="absolute top-2 left-2 z-20 bg-slate-900/95 border border-slate-700 rounded-xl p-3 shadow-2xl text-xs min-w-[220px] pointer-events-none">
                  <div className="font-bold text-white pb-1 border-b border-slate-800 flex justify-between">
                    <span>{hoveredStation.name}</span>
                    <span className="font-mono text-[10px] text-slate-400">{hoveredStation.code}</span>
                  </div>
                  <div className="mt-1.5 flex justify-between">
                    <span className="text-slate-400">WHO Breach Hours:</span>
                    <span className="font-mono font-bold text-fuchsia-400">
                      {hoveredStation.cumBreachHours} hrs
                    </span>
                  </div>
                  <div className="mt-1 flex justify-between">
                    <span className="text-slate-400">Cumulative Dose:</span>
                    <span className="font-mono font-bold text-white">
                      {hoveredStation.cumDose.toLocaleString()} µg·h
                    </span>
                  </div>
                  <div className="mt-1 flex justify-between">
                    <span className="text-slate-400">Passive Cigarette Eq:</span>
                    <span className="font-mono font-bold text-orange-400">
                      ~{hoveredStation.cigarettesEq} cigs
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Map Summary Pill */}
            <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px]">
              <span className="text-slate-400">
                By <strong className="text-white">{currentSynoptic.dateLabel}</strong>, Ennis has{' '}
                <strong className="text-fuchsia-400 font-mono">{ennisStat?.cumBreachHours || 0}h &gt;WHO</strong> vs{' '}
                <strong className="text-sky-400 font-mono">{londonStat?.cumBreachHours || 0}h</strong> in London &amp;{' '}
                <strong className="text-emerald-400 font-mono">{nycStat?.cumBreachHours || 0}h</strong> in NYC.
              </span>
              <span className="font-mono text-[10px] text-slate-500">EPA + DEFRA + US EPA</span>
            </div>
          </div>

          {/* RIGHT: Cumulative Leaderboard Bar Race + 30-Day Staircase Curve */}
          <div className="lg:col-span-5 flex flex-col justify-between gap-4">
            {/* Panel 1: 30-Day Cumulative Exposure Leaderboard (Bar Race) */}
            <div className="bg-slate-950/85 border border-slate-800 rounded-2xl p-4 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-800">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                      <Flame className="w-4 h-4 text-orange-400" />
                      <span>Cumulative Exposure Race (Day 1 &rarr; {currentDay})</span>
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Regional Irish towns vs Global Megacities (hours &gt; WHO 15 µg/m³)
                    </p>
                  </div>
                  <button
                    onClick={() => setShowGlobalCities(!showGlobalCities)}
                    className={`px-2 py-1 rounded-lg text-[10px] font-semibold border transition cursor-pointer flex items-center gap-1 shrink-0 ${
                      showGlobalCities
                        ? 'bg-sky-500/15 text-sky-300 border-sky-500/30'
                        : 'bg-slate-900 text-slate-400 border-slate-800'
                    }`}
                  >
                    <Globe className="w-3 h-3" />
                    <span>{showGlobalCities ? 'Global On' : 'Irish Only'}</span>
                  </button>
                </div>

                {/* Animated Horizontal Bars */}
                <div className="mt-3 space-y-2">
                  {raceStations.map((st) => {
                    const maxPossibleBreach = 210;
                    const widthPct = Math.min(100, Math.max(4, (st.cumBreachHours / maxPossibleBreach) * 100));
                    const color = getCumulativeColor(st.cumBreachHours, st.cumDose);
                    const barColor = st.customColor || (st.isBaseline ? '#38bdf8' : color.bg);
                    const isSelected = st.code === selectedStationCode;

                    return (
                      <div
                        key={st.code}
                        onClick={() => {
                          if (!st.code.startsWith('GLOBAL-')) {
                            onSelectStation(st.code);
                          }
                        }}
                        className={`p-2 rounded-xl border transition cursor-pointer ${
                          isSelected
                            ? 'bg-slate-900 border-slate-600'
                            : 'bg-slate-900/40 border-slate-800/70 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-semibold text-slate-200 truncate">
                            {st.displayName}
                          </span>
                          <div className="flex items-center gap-2 font-mono shrink-0">
                            <span className="text-[10px] text-slate-400">
                              ~{st.cigarettesEq} cigs
                            </span>
                            <span
                              className="font-extrabold text-xs"
                              style={{ color: barColor }}
                            >
                              {st.cumBreachHours}h &gt;WHO
                            </span>
                          </div>
                        </div>

                        <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{
                              width: `${widthPct}%`,
                              backgroundColor: barColor,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <p className="text-[10px] text-slate-500 mt-3 pt-2 border-t border-slate-800/70">
                *Berkeley Earth equivalence: inhaling 22 µg/m³ of PM2.5 for 24h (528 µg/m³·h) equals 1 passive cigarette. Global data: UK DEFRA AURN, US EPA AirNow, Airparif.
              </p>
            </div>

            {/* Panel 2: 30-Day Cumulative Divergence Curve (Ennis vs London, NYC & Dublin) */}
            <div className="bg-slate-950/85 border border-slate-800 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-fuchsia-400" />
                    <span>30-Day Cumulative WHO Breach Trajectory</span>
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    Ennis &amp; Tralee vs. London, New York City &amp; Dublin
                  </p>
                </div>
                <div className="text-right font-mono">
                  <span className="text-xs font-extrabold text-fuchsia-400">
                    {ennisStat && londonStat && londonStat.cumBreachHours > 0
                      ? `${(ennisStat.cumBreachHours / londonStat.cumBreachHours).toFixed(1)}×`
                      : '5.5×'}{' '}
                    London
                  </span>
                </div>
              </div>

              {/* Mini SVG Staircase Chart */}
              {(() => {
                const W = 420;
                const H = 135;
                const PL = 32;
                const PR = 14;
                const PT = 12;
                const PB = 22;
                const maxHrs = 220;

                const getX = (day: number) => PL + ((day - 1) / 29) * (W - PL - PR);
                const getY = (hrs: number) => H - PB - (hrs / maxHrs) * (H - PT - PB);

                const ennisPts: string[] = [];
                const traleePts: string[] = [];
                const londonPts: string[] = [];
                const nycPts: string[] = [];
                const dublinPts: string[] = [];

                for (let d = 1; d <= currentDay; d++) {
                  const snap = cumulativeByDay[d];
                  if (!snap) continue;
                  const x = getX(d);
                  ennisPts.push(`${d === 1 ? 'M' : 'L'}${x},${getY(snap.byCode['EPA-25']?.cumBreachHours || 0)}`);
                  traleePts.push(`${d === 1 ? 'M' : 'L'}${x},${getY(snap.byCode['EPA-71']?.cumBreachHours || 0)}`);
                  londonPts.push(`${d === 1 ? 'M' : 'L'}${x},${getY(snap.byCode['GLOBAL-LON']?.cumBreachHours || 0)}`);
                  nycPts.push(`${d === 1 ? 'M' : 'L'}${x},${getY(snap.byCode['GLOBAL-NYC']?.cumBreachHours || 0)}`);
                  dublinPts.push(`${d === 1 ? 'M' : 'L'}${x},${getY(snap.byCode['EPA-48']?.cumBreachHours || 0)}`);
                }

                return (
                  <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto select-none">
                    {/* Grid lines */}
                    {[0, 100, 200].map((val) => (
                      <g key={val}>
                        <line
                          x1={PL}
                          y1={getY(val)}
                          x2={W - PR}
                          y2={getY(val)}
                          stroke="#1e293b"
                          strokeDasharray="2 3"
                        />
                        <text
                          x={PL - 5}
                          y={getY(val) + 3}
                          textAnchor="end"
                          className="fill-slate-500 text-[9px] font-mono"
                        >
                          {val}h
                        </text>
                      </g>
                    ))}

                    {/* X-axis day ticks */}
                    {[1, 10, 20, 30].map((d) => (
                      <text
                        key={d}
                        x={getX(d)}
                        y={H - 5}
                        textAnchor="middle"
                        className="fill-slate-500 text-[9px] font-mono"
                      >
                        Nov {d}
                      </text>
                    ))}

                    {/* Full 30-day ghost path */}
                    <path
                      d={Array.from({ length: 30 }, (_, i) => {
                        const d = i + 1;
                        return `${d === 1 ? 'M' : 'L'}${getX(d)},${getY(
                          cumulativeByDay[d]?.byCode['EPA-25']?.cumBreachHours || 0
                        )}`;
                      }).join(' ')}
                      fill="none"
                      stroke="#d946ef"
                      strokeWidth="1"
                      opacity="0.2"
                      strokeDasharray="2 2"
                    />

                    {/* Active progressive paths */}
                    <path d={dublinPts.join(' ')} fill="none" stroke="#64748b" strokeWidth="1.6" strokeDasharray="2 2" />
                    <path d={nycPts.join(' ')} fill="none" stroke="#10b981" strokeWidth="2" />
                    <path d={londonPts.join(' ')} fill="none" stroke="#38bdf8" strokeWidth="2.2" />
                    <path d={traleePts.join(' ')} fill="none" stroke="#f97316" strokeWidth="2.2" />
                    <path d={ennisPts.join(' ')} fill="none" stroke="#d946ef" strokeWidth="2.8" />

                    {/* Current Day Playhead Dots */}
                    <circle
                      cx={getX(currentDay)}
                      cy={getY(ennisStat?.cumBreachHours || 0)}
                      r="4.5"
                      fill="#d946ef"
                      stroke="#ffffff"
                      strokeWidth="1.5"
                    />
                    <circle
                      cx={getX(currentDay)}
                      cy={getY(londonStat?.cumBreachHours || 0)}
                      r="3.8"
                      fill="#38bdf8"
                      stroke="#ffffff"
                      strokeWidth="1.5"
                    />
                    <circle
                      cx={getX(currentDay)}
                      cy={getY(nycStat?.cumBreachHours || 0)}
                      r="3.5"
                      fill="#10b981"
                      stroke="#ffffff"
                      strokeWidth="1.5"
                    />
                  </svg>
                );
              })()}

              <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] pt-1 border-t border-slate-800/80">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="flex items-center gap-1 text-slate-200 font-semibold">
                    <span className="w-2.5 h-1 rounded bg-fuchsia-500"></span>🇮🇪 Ennis
                  </span>
                  <span className="flex items-center gap-1 text-slate-300">
                    <span className="w-2.5 h-1 rounded bg-orange-500"></span>🇮🇪 Tralee
                  </span>
                  <span className="flex items-center gap-1 text-sky-300 font-semibold">
                    <span className="w-2.5 h-1 rounded bg-sky-400"></span>🇬🇧 London
                  </span>
                  <span className="flex items-center gap-1 text-emerald-300 font-semibold">
                    <span className="w-2.5 h-1 rounded bg-emerald-400"></span>🇺🇸 NYC
                  </span>
                  <span className="flex items-center gap-1 text-slate-400">
                    <span className="w-2.5 h-0.5 border-b border-dashed border-slate-400"></span>🇮🇪 Dublin
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
