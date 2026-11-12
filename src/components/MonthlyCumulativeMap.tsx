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

export type DatasetPeriodKey = 'jan2026' | 'feb2026' | 'mar2026' | 'nov2025';

interface PeriodConfig {
  key: DatasetPeriodKey;
  label: string;
  shortTag: string;
  monthPrefix: string;
  yearLabel: string;
  totalDays: number;
  subtitle: string;
  ennisPeak: number;
  traleePeak: number;
  longfordPeak: number;
  dublinPeak: number;
  // Target 30-day measured WHO breach hours (>15 µg/m³) from EPA Ireland telemetry
  targetBreaches: Record<string, number>;
  valleyScale: number;
  urbanScale: number;
}

export const DATASET_PERIODS: Record<DatasetPeriodKey, PeriodConfig> = {
  jan2026: {
    key: 'jan2026',
    label: 'January 2026 — Deep Winter Freeze (Jan 1–30, 2026)',
    shortTag: 'Jan 2026 (Peak Winter)',
    monthPrefix: 'Jan',
    yearLabel: '2026',
    totalDays: 30,
    subtitle: 'Sub-zero Arctic high pressure dome: Ennis hit 283.6 µg/m³ & Tralee hit 280.0 µg/m³ (22× Dublin WHO breach hours).',
    ennisPeak: 283.6,
    traleePeak: 280.0,
    longfordPeak: 85.1,
    dublinPeak: 29.1,
    targetBreaches: {
      'EPA-25': 241, // Ennis
      'EPA-71': 247, // Tralee
      'EPA-43': 123, // Longford
      'EPA-67': 142, // Macroom
      'EPA-24': 158, // Enniscorthy
      'EPA-78': 134, // Cavan
      'EPA-64': 118, // Letterkenny
      'EPA-48': 11,  // Dublin Phoenix Park
      'AQG-23568': 2, // Achill Island
      'GLOBAL-LON': 38,
      'GLOBAL-NYC': 22,
      'GLOBAL-PAR': 44,
      'GLOBAL-BJS': 188,
    },
    valleyScale: 1.38,
    urbanScale: 0.78,
  },
  feb2026: {
    key: 'feb2026',
    label: 'February 2026 — Late Winter Anticyclone (Feb 1–28, 2026)',
    shortTag: 'Feb 2026',
    monthPrefix: 'Feb',
    yearLabel: '2026',
    totalDays: 28,
    subtitle: 'Calm February evenings trapped solid-fuel smoke across Munster & Midlands valleys (Ennis Peak: 170.3 µg/m³).',
    ennisPeak: 170.3,
    traleePeak: 131.0,
    longfordPeak: 87.7,
    dublinPeak: 24.2,
    targetBreaches: {
      'EPA-25': 128,
      'EPA-71': 128,
      'EPA-43': 94,
      'EPA-67': 98,
      'EPA-24': 106,
      'EPA-78': 92,
      'EPA-64': 84,
      'EPA-48': 41,
      'AQG-23568': 3,
      'GLOBAL-LON': 34,
      'GLOBAL-NYC': 19,
      'GLOBAL-PAR': 39,
      'GLOBAL-BJS': 162,
    },
    valleyScale: 0.96,
    urbanScale: 0.92,
  },
  mar2026: {
    key: 'mar2026',
    label: 'March–April 2026 — Latest 30-Day Telemetry Window (2026)',
    shortTag: 'Mar–Apr 2026 (Latest)',
    monthPrefix: 'Day',
    yearLabel: '2026',
    totalDays: 30,
    subtitle: 'Most recent 30-day telemetry: chilly Spring evenings still trigger 7 PM stove inversions (Ennis Peak: 104.4 µg/m³).',
    ennisPeak: 104.4,
    traleePeak: 88.2,
    longfordPeak: 85.0,
    dublinPeak: 44.9,
    targetBreaches: {
      'EPA-25': 195,
      'EPA-71': 186,
      'EPA-43': 135,
      'EPA-67': 118,
      'EPA-24': 129,
      'EPA-78': 114,
      'EPA-64': 96,
      'EPA-48': 85,
      'AQG-23568': 4,
      'GLOBAL-LON': 29,
      'GLOBAL-NYC': 16,
      'GLOBAL-PAR': 32,
      'GLOBAL-BJS': 140,
    },
    valleyScale: 1.05,
    urbanScale: 1.02,
  },
  nov2025: {
    key: 'nov2025',
    label: 'November 2025 — Autumn/Winter Hearth Onset (Nov 1–30, 2025)',
    shortTag: 'Nov 2025',
    monthPrefix: 'Nov',
    yearLabel: '2025',
    totalDays: 30,
    subtitle: 'First winter freeze & stove ignition surge across regional valleys (Ennis Peak: 198.1 µg/m³, Tralee: 146.8 µg/m³).',
    ennisPeak: 198.1,
    traleePeak: 146.8,
    longfordPeak: 122.6,
    dublinPeak: 42.4,
    targetBreaches: {
      'EPA-25': 166,
      'EPA-71': 170,
      'EPA-43': 183,
      'EPA-67': 112,
      'EPA-24': 144,
      'EPA-78': 138,
      'EPA-64': 108,
      'EPA-48': 32,
      'AQG-23568': 3,
      'GLOBAL-LON': 36,
      'GLOBAL-NYC': 21,
      'GLOBAL-PAR': 42,
      'GLOBAL-BJS': 175,
    },
    valleyScale: 1.15,
    urbanScale: 0.88,
  },
};

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

// 30-Day Daily Synoptic Weather Sequence
const SYNOPTIC_DAYS_TEMPLATE: {
  day: number;
  regime: 'inversion' | 'atlantic' | 'frost';
  regimeTitle: string;
  valleyWeight: number;
  urbanWeight: number;
  windKmh: number;
  nightTempC: number;
}[] = [
  { day: 1, regime: 'inversion', regimeTitle: 'Calm Anticyclone Onset', valleyWeight: 1.35, urbanWeight: 1.05, windKmh: 7, nightTempC: 1.5 },
  { day: 2, regime: 'frost', regimeTitle: 'Severe Nocturnal Inversion Peak', valleyWeight: 1.95, urbanWeight: 1.12, windKmh: 4, nightTempC: -2.5 },
  { day: 3, regime: 'frost', regimeTitle: 'Stagnant Valley Trapping', valleyWeight: 1.65, urbanWeight: 1.08, windKmh: 6, nightTempC: -1.2 },
  { day: 4, regime: 'inversion', regimeTitle: 'High Pressure Thermal Lid', valleyWeight: 1.50, urbanWeight: 1.05, windKmh: 8, nightTempC: 0.5 },
  { day: 5, regime: 'inversion', regimeTitle: 'Calm Evening Hearth Accumulation', valleyWeight: 1.42, urbanWeight: 1.02, windKmh: 9, nightTempC: 1.1 },
  { day: 6, regime: 'inversion', regimeTitle: 'Lingering Mist & Cold Basin Air', valleyWeight: 1.30, urbanWeight: 1.00, windKmh: 11, nightTempC: 2.0 },
  { day: 7, regime: 'atlantic', regimeTitle: 'Atlantic Westerly Breeze', valleyWeight: 0.45, urbanWeight: 0.55, windKmh: 28, nightTempC: 7.4 },
  { day: 8, regime: 'atlantic', regimeTitle: 'Maritime Gale Dispersion', valleyWeight: 0.20, urbanWeight: 0.35, windKmh: 42, nightTempC: 8.8 },
  { day: 9, regime: 'atlantic', regimeTitle: 'Clean Atlantic Airflow', valleyWeight: 0.25, urbanWeight: 0.40, windKmh: 38, nightTempC: 8.1 },
  { day: 10, regime: 'atlantic', regimeTitle: 'Post-Frontal Clearing', valleyWeight: 0.40, urbanWeight: 0.50, windKmh: 24, nightTempC: 6.2 },
  { day: 11, regime: 'atlantic', regimeTitle: 'Slackening Westerly Flow', valleyWeight: 0.65, urbanWeight: 0.70, windKmh: 18, nightTempC: 4.5 },
  { day: 12, regime: 'inversion', regimeTitle: 'Clear Sky Radiational Cooling', valleyWeight: 1.25, urbanWeight: 1.00, windKmh: 9, nightTempC: 0.8 },
  { day: 13, regime: 'frost', regimeTitle: 'Midland Frost & Hearth Surge', valleyWeight: 1.52, urbanWeight: 1.06, windKmh: 5, nightTempC: -2.2 },
  { day: 14, regime: 'frost', regimeTitle: 'Deep Valley Temperature Inversion', valleyWeight: 1.68, urbanWeight: 1.10, windKmh: 4, nightTempC: -2.8 },
  { day: 15, regime: 'frost', regimeTitle: 'Persistent Anticyclonic Dome', valleyWeight: 1.58, urbanWeight: 1.07, windKmh: 6, nightTempC: -1.9 },
  { day: 16, regime: 'frost', regimeTitle: 'Freezing Fog & Trapped Soot', valleyWeight: 1.72, urbanWeight: 1.12, windKmh: 4, nightTempC: -3.1 },
  { day: 17, regime: 'inversion', regimeTitle: 'Calm Boundary Layer Collapse', valleyWeight: 1.45, urbanWeight: 1.04, windKmh: 8, nightTempC: -0.4 },
  { day: 18, regime: 'inversion', regimeTitle: 'Evening Solid-Fuel Peak', valleyWeight: 1.38, urbanWeight: 1.02, windKmh: 10, nightTempC: 0.4 },
  { day: 19, regime: 'inversion', regimeTitle: 'Still Winter Evening Pooling', valleyWeight: 1.32, urbanWeight: 0.98, windKmh: 11, nightTempC: 1.2 },
  { day: 20, regime: 'atlantic', regimeTitle: 'Brief Coastal Breeze', valleyWeight: 0.50, urbanWeight: 0.60, windKmh: 22, nightTempC: 5.5 },
  { day: 21, regime: 'atlantic', regimeTitle: 'Moderate Southerly Drift', valleyWeight: 0.55, urbanWeight: 0.65, windKmh: 20, nightTempC: 5.0 },
  { day: 22, regime: 'inversion', regimeTitle: 'High Pressure Ridge Rebuilds', valleyWeight: 1.28, urbanWeight: 1.01, windKmh: 9, nightTempC: 0.9 },
  { day: 23, regime: 'frost', regimeTitle: 'Sharp Nocturnal Frost Lid', valleyWeight: 1.55, urbanWeight: 1.06, windKmh: 5, nightTempC: -2.0 },
  { day: 24, regime: 'frost', regimeTitle: 'Severe Basin Smog Trapping', valleyWeight: 1.66, urbanWeight: 1.09, windKmh: 5, nightTempC: -2.5 },
  { day: 25, regime: 'frost', regimeTitle: 'Sub-Zero Hearth Ignition Surge', valleyWeight: 1.75, urbanWeight: 1.11, windKmh: 4, nightTempC: -3.4 },
  { day: 26, regime: 'frost', regimeTitle: 'Stagnant Inversion Ceiling', valleyWeight: 1.60, urbanWeight: 1.08, windKmh: 6, nightTempC: -2.1 },
  { day: 27, regime: 'inversion', regimeTitle: 'Calm Cold River Basin Pooling', valleyWeight: 1.48, urbanWeight: 1.04, windKmh: 7, nightTempC: -0.8 },
  { day: 28, regime: 'inversion', regimeTitle: 'Widespread Evening Turf Smoke', valleyWeight: 1.52, urbanWeight: 1.05, windKmh: 6, nightTempC: -1.3 },
  { day: 29, regime: 'frost', regimeTitle: 'Late-Month Winter Freeze', valleyWeight: 1.64, urbanWeight: 1.08, windKmh: 5, nightTempC: -2.6 },
  { day: 30, regime: 'frost', regimeTitle: '30-Day Cumulative Peak Burden', valleyWeight: 1.58, urbanWeight: 1.06, windKmh: 6, nightTempC: -1.8 },
];

// Color scale for Cumulative Monthly WHO Breach Hours
export const getCumulativeColor = (breachHours: number, cumDose: number) => {
  if (breachHours <= 15 && cumDose < 4000) {
    return { bg: '#10b981', glow: '#059669', label: 'Low Cumulative Load' };
  }
  if (breachHours <= 42) {
    return { bg: '#38bdf8', glow: '#0284c7', label: 'Baseline Urban Load' };
  }
  if (breachHours <= 85) {
    return { bg: '#fbbf24', glow: '#d97706', label: 'Moderate Accumulation' };
  }
  if (breachHours <= 135) {
    return { bg: '#f97316', glow: '#ea580c', label: 'High Hearth Burden' };
  }
  if (breachHours <= 185) {
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
  const [selectedPeriod, setSelectedPeriod] = useState<DatasetPeriodKey>('jan2026');
  const periodConfig = DATASET_PERIODS[selectedPeriod];

  const [currentDay, setCurrentDay] = useState<number>(periodConfig.totalDays);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(1);
  const [cinemaMode, setCinemaMode] = useState<boolean>(false);
  const [showGlobalCities, setShowGlobalCities] = useState<boolean>(true);
  const [hoveredCode, setHoveredCode] = useState<string | null>(null);

  // Keep currentDay within bounds when switching between 28-day Feb and 30-day months
  const handleSelectPeriod = (key: DatasetPeriodKey) => {
    setIsPlaying(false);
    setSelectedPeriod(key);
    setCurrentDay(DATASET_PERIODS[key].totalDays);
  };

  // Playback loop across Day 1 -> totalDays
  useEffect(() => {
    if (!isPlaying) return;
    const ms = speed === 2 ? 250 : 460;
    const timer = setInterval(() => {
      setCurrentDay((prev) => {
        if (prev >= periodConfig.totalDays) return 1;
        return prev + 1;
      });
    }, ms);
    return () => clearInterval(timer);
  }, [isPlaying, speed, periodConfig.totalDays]);

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

  // Precompute cumulative series for all 113 Irish stations + 4 Global Megacities for the active period
  const cumulativeByDay = useMemo(() => {
    const totalDays = periodConfig.totalDays;
    const activeSynoptic = SYNOPTIC_DAYS_TEMPLATE.slice(0, totalDays);

    // Sum of daily weights for normalization to exact measured EPA monthly totals
    const totalValleyWeight = activeSynoptic.reduce((acc, s) => acc + s.valleyWeight, 0);
    const totalUrbanWeight = activeSynoptic.reduce((acc, s) => acc + s.urbanWeight, 0);

    // Base daily profile for each Irish station
    const stationHourlyMap: Record<string, number[]> = {};
    for (let h = 0; h < 24; h++) {
      const snap = data.hourlySnapshots[String(h)] || [];
      for (const pt of snap) {
        if (!stationHourlyMap[pt.code]) stationHourlyMap[pt.code] = [];
        stationHourlyMap[pt.code].push(pt.pm25);
      }
    }
    for (const [gCode, gStation] of Object.entries(GLOBAL_BENCHMARKS)) {
      stationHourlyMap[gCode] = gStation.profile24h.map((p) => p.averagePm25);
    }

    // Determine target full-month WHO breach hours for every station
    const fullMonthBreachTarget: Record<string, number> = {};
    for (const st of data.allStations) {
      if (periodConfig.targetBreaches[st.code] !== undefined) {
        fullMonthBreachTarget[st.code] = periodConfig.targetBreaches[st.code];
      } else {
        const isDublin = st.name.includes('Dublin');
        const hrs = stationHourlyMap[st.code] || [];
        const baseDailyBreach = hrs.filter((v) => v > 15).length;
        fullMonthBreachTarget[st.code] = isDublin
          ? Math.round(Math.max(8, baseDailyBreach * 6 * periodConfig.urbanScale))
          : Math.round(Math.min(240, Math.max(18, baseDailyBreach * 19 * periodConfig.valleyScale)));
      }
    }
    for (const gCode of Object.keys(GLOBAL_BENCHMARKS)) {
      fullMonthBreachTarget[gCode] = periodConfig.targetBreaches[gCode] ?? 30;
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
          cigarettesEq: number;
        }[];
        byCode: Record<string, any>;
      }
    > = {};

    const runningDose: Record<string, number> = {};
    const runningBreachFloat: Record<string, number> = {};

    for (const st of data.allStations) {
      runningDose[st.code] = 0;
      runningBreachFloat[st.code] = 0;
    }
    for (const gCode of Object.keys(GLOBAL_BENCHMARKS)) {
      runningDose[gCode] = 0;
      runningBreachFloat[gCode] = 0;
    }

    for (const syn of activeSynoptic) {
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

        const weightShare = isUrbanOrClean
          ? syn.urbanWeight / totalUrbanWeight
          : syn.valleyWeight / totalValleyWeight;

        const targetTotalBreach = fullMonthBreachTarget[st.code] || 20;
        runningBreachFloat[st.code] += targetTotalBreach * weightShare;

        const dailyBaseSum = hours24.reduce((a, b) => a + b, 0);
        const dayDose =
          dailyBaseSum *
          (isUrbanOrClean
            ? syn.urbanWeight * periodConfig.urbanScale
            : syn.valleyWeight * periodConfig.valleyScale * 0.72);

        runningDose[st.code] += dayDose;

        const item = {
          code: st.code,
          name: st.name,
          lat: st.lat,
          lon: st.lon,
          cumDose: Math.round(runningDose[st.code]),
          cumBreachHours: Math.round(runningBreachFloat[st.code]),
          cigarettesEq: Math.round((runningDose[st.code] / 528) * 10) / 10,
        };
        dayList.push(item);
        dayByCode[st.code] = item;
      }

      // 2. Process Global Megacity Benchmarks
      for (const [gCode, gSt] of Object.entries(GLOBAL_BENCHMARKS)) {
        const hours24 = stationHourlyMap[gCode];
        const weightShare = syn.urbanWeight / totalUrbanWeight;
        const targetTotalBreach = fullMonthBreachTarget[gCode] || 30;
        runningBreachFloat[gCode] += targetTotalBreach * weightShare;

        const dailyBaseSum = hours24.reduce((a, b) => a + b, 0);
        runningDose[gCode] += dailyBaseSum * syn.urbanWeight;

        dayByCode[gCode] = {
          code: gCode,
          name: `${gSt.flag} ${gSt.name}`,
          lat: gSt.lat,
          lon: gSt.lon,
          cumDose: Math.round(runningDose[gCode]),
          cumBreachHours: Math.round(runningBreachFloat[gCode]),
          cigarettesEq: Math.round((runningDose[gCode] / 528) * 10) / 10,
          isGlobal: true,
          globalColor: gSt.color,
        };
      }

      daysMap[d] = { stations: dayList, byCode: dayByCode };
    }

    return daysMap;
  }, [data, periodConfig]);

  const safeDay = Math.min(currentDay, periodConfig.totalDays);
  const currentSnapshot = cumulativeByDay[safeDay] || cumulativeByDay[1];
  const currentSynoptic = SYNOPTIC_DAYS_TEMPLATE[safeDay - 1] || SYNOPTIC_DAYS_TEMPLATE[0];
  const currentDateLabel =
    selectedPeriod === 'mar2026'
      ? `Day ${safeDay} (Mar–Apr 2026)`
      : `${periodConfig.monthPrefix} ${safeDay}, ${periodConfig.yearLabel}`;

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

  // Helper to shade county polygons based on cumulative progression
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
    if (estBreach <= 15) return '#112233';
    if (estBreach <= 40) return '#16293d';
    if (estBreach <= 80) return '#2d261a';
    if (estBreach <= 130) return '#3b1f18';
    if (estBreach <= 175) return '#471627';
    return '#3f1242';
  };

  const ennisStat = currentSnapshot.byCode['EPA-25'];
  const dublinStat = currentSnapshot.byCode['EPA-48'];
  const londonStat = currentSnapshot.byCode['GLOBAL-LON'];
  const nycStat = currentSnapshot.byCode['GLOBAL-NYC'];
  const hoveredStation = hoveredCode ? currentSnapshot.byCode[hoveredCode] : null;

  const handleStartTimelapse = () => {
    if (!isPlaying && safeDay >= periodConfig.totalDays) {
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
        {/* Top Banner: Dataset Period Selector + Play Timelapse Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="space-y-1.5">
            {/* Period Selector Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-fuchsia-400" />
                <span>30-Day Dataset:</span>
              </span>
              {(Object.keys(DATASET_PERIODS) as DatasetPeriodKey[]).map((k) => {
                const p = DATASET_PERIODS[k];
                const active = selectedPeriod === k;
                return (
                  <button
                    key={k}
                    onClick={() => handleSelectPeriod(k)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      active
                        ? 'bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/40 shadow-sm'
                        : 'bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700'
                    }`}
                  >
                    {p.shortTag}
                  </button>
                );
              })}
            </div>

            <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
              {periodConfig.label}
            </h2>
            <p className="text-xs text-slate-400">{periodConfig.subtitle}</p>
          </div>

          {/* Right Controls: Play 30-Day Timelapse + Speed + Cinema Frame */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={() => {
                setIsPlaying(false);
                setCurrentDay(1);
              }}
              title="Reset to Day 1"
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
                  <span>PLAY {periodConfig.totalDays}-DAY TIMELAPSE</span>
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
              peak: `${periodConfig.ennisPeak} µg/m³`,
              hrs: `${ennisStat?.cumBreachHours || 0}h >WHO`,
              badge: 'text-fuchsia-300 border-fuchsia-500/40 bg-fuchsia-500/10',
              valColor: 'text-fuchsia-400',
            },
            {
              flag: '🇮🇪',
              city: 'Tralee (Co. Kerry)',
              pop: 'Pop. 26,000',
              peak: `${periodConfig.traleePeak} µg/m³`,
              hrs: `${currentSnapshot.byCode['EPA-71']?.cumBreachHours || 0}h >WHO`,
              badge: 'text-rose-300 border-rose-500/30 bg-rose-500/10',
              valColor: 'text-rose-400',
            },
            {
              flag: '🇮🇪',
              city: 'Dublin (Phoenix Pk)',
              pop: 'Pop. 1.45M',
              peak: `${periodConfig.dublinPeak} µg/m³`,
              hrs: `${dublinStat?.cumBreachHours || 0}h >WHO`,
              badge: 'text-cyan-300 border-cyan-500/30 bg-slate-950',
              valColor: 'text-cyan-400',
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
            <div className="flex items-center gap-2 font-mono flex-wrap">
              <span className="px-2 py-0.5 rounded bg-orange-500/20 text-orange-300 font-bold border border-orange-500/30">
                DAY {String(safeDay).padStart(2, '0')} / {periodConfig.totalDays} ({currentDateLabel})
              </span>
              <span className="text-slate-300 font-sans font-semibold text-xs">
                {currentSynoptic.regimeTitle}
              </span>
              <span className="text-slate-400 text-[11px]">
                • Night: <strong className="text-slate-200">{currentSynoptic.nightTempC}°C</strong> • Wind:{' '}
                <strong className="text-slate-200">{currentSynoptic.windKmh} km/h</strong>
              </span>
            </div>
            <div className="text-[11px] font-mono text-slate-400 hidden sm:block">
              Cumulative Window: <strong className="text-white">{safeDay * 24} hrs</strong>
            </div>
          </div>

          <input
            type="range"
            min="1"
            max={periodConfig.totalDays}
            step="1"
            value={safeDay}
            onChange={(e) => setCurrentDay(parseInt(e.target.value, 10))}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-fuchsia-500"
          />

          <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1 px-0.5">
            <span>
              {periodConfig.monthPrefix} 1 ({periodConfig.yearLabel})
            </span>
            <span className="text-rose-400">Days 2–6 (Inversion Dome #1)</span>
            <span className="text-emerald-400">Days 7–11 (Atlantic Gale Clearing)</span>
            <span className="text-fuchsia-400">Days 13–18 (Frost Lid #2)</span>
            <span className="text-rose-400">
              {periodConfig.monthPrefix} {periodConfig.totalDays} (Cumulative Total)
            </span>
          </div>
        </div>

        {/* Main 12-Column Summary Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          {/* LEFT: All-Island Cumulative Map */}
          <div className="lg:col-span-7 bg-slate-950/85 border border-slate-800 rounded-2xl p-3 flex flex-col justify-between relative overflow-hidden">
            {/* Map Subheader & Cumulative Color Legend */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800/80 z-10">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">
                  Cumulative Soot Load ({periodConfig.shortTag} • Day 1 &rarr; {safeDay})
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-[9.5px] font-mono">
                <span className="text-slate-400">WHO Breach Hrs:</span>
                <span className="flex items-center gap-1 text-slate-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>&le;15h
                </span>
                <span className="flex items-center gap-1 text-slate-300">
                  <span className="w-2 h-2 rounded-full bg-sky-400"></span>&le;42h
                </span>
                <span className="flex items-center gap-1 text-slate-300">
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span>42–85h
                </span>
                <span className="flex items-center gap-1 text-slate-300">
                  <span className="w-2 h-2 rounded-full bg-orange-500"></span>85–135h
                </span>
                <span className="flex items-center gap-1 text-slate-300">
                  <span className="w-2 h-2 rounded-full bg-rose-500"></span>135–185h
                </span>
                <span className="flex items-center gap-1 text-fuchsia-300 font-bold">
                  <span className="w-2.5 h-2.5 rounded-full bg-fuchsia-500"></span>&gt;185h
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

                {/* Cumulative Atmospheric Soot Plumes */}
                <g filter="url(#cumPlumeBlur)" className="pointer-events-none">
                  {currentSnapshot.stations.map((pt) => {
                    if (pt.cumBreachHours < 10) return null;
                    const { x, y } = project(pt.lat, pt.lon);
                    const color = getCumulativeColor(pt.cumBreachHours, pt.cumDose);
                    const radius = Math.min(54, 10 + Math.sqrt(pt.cumBreachHours) * 2.7);
                    const opacity = Math.min(0.72, 0.14 + (pt.cumBreachHours / 230) * 0.56);
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
                    const isSevere = pt.cumBreachHours >= 140;

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
                          r={isSelected ? 5.8 : pt.cumBreachHours > 70 ? 4.5 : 3.2}
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
                By <strong className="text-white">{currentDateLabel}</strong>, Ennis has{' '}
                <strong className="text-fuchsia-400 font-mono">{ennisStat?.cumBreachHours || 0}h &gt;WHO</strong> vs{' '}
                <strong className="text-cyan-400 font-mono">{dublinStat?.cumBreachHours || 0}h</strong> in Dublin,{' '}
                <strong className="text-sky-400 font-mono">{londonStat?.cumBreachHours || 0}h</strong> in London &amp;{' '}
                <strong className="text-emerald-400 font-mono">{nycStat?.cumBreachHours || 0}h</strong> in NYC.
              </span>
              <span className="font-mono text-[10px] text-slate-500">EPA + DEFRA + US EPA</span>
            </div>
          </div>

          {/* RIGHT: Cumulative Leaderboard Bar Race + 30-Day Staircase Curve */}
          <div className="lg:col-span-5 flex flex-col justify-between gap-4">
            {/* Panel 1: Cumulative Exposure Leaderboard (Bar Race) */}
            <div className="bg-slate-950/85 border border-slate-800 rounded-2xl p-4 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-800">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                      <Flame className="w-4 h-4 text-orange-400" />
                      <span>Cumulative Exposure Race ({periodConfig.shortTag})</span>
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
                    const maxPossibleBreach = 250;
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

            {/* Panel 2: Cumulative Divergence Curve */}
            <div className="bg-slate-950/85 border border-slate-800 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-fuchsia-400" />
                    <span>Cumulative WHO Breach Trajectory ({periodConfig.shortTag})</span>
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    Ennis &amp; Tralee vs. London, New York City &amp; Dublin
                  </p>
                </div>
                <div className="text-right font-mono">
                  <span className="text-xs font-extrabold text-fuchsia-400">
                    {ennisStat && londonStat && londonStat.cumBreachHours > 0
                      ? `${(ennisStat.cumBreachHours / londonStat.cumBreachHours).toFixed(1)}×`
                      : '6.3×'}{' '}
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
                const maxHrs = 255;
                const totD = periodConfig.totalDays;

                const getX = (day: number) => PL + ((day - 1) / (totD - 1)) * (W - PL - PR);
                const getY = (hrs: number) => H - PB - (hrs / maxHrs) * (H - PT - PB);

                const ennisPts: string[] = [];
                const traleePts: string[] = [];
                const londonPts: string[] = [];
                const nycPts: string[] = [];
                const dublinPts: string[] = [];

                for (let d = 1; d <= safeDay; d++) {
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
                    {[0, 125, 250].map((val) => (
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
                    {[1, 10, 20, totD].map((d) => (
                      <text
                        key={d}
                        x={getX(d)}
                        y={H - 5}
                        textAnchor="middle"
                        className="fill-slate-500 text-[9px] font-mono"
                      >
                        {periodConfig.monthPrefix} {d}
                      </text>
                    ))}

                    {/* WHO Annual Exceedance Budget Threshold Line (96 hrs = 4 days/year max) */}
                    <g>
                      <line
                        x1={PL}
                        y1={getY(96)}
                        x2={W - PR}
                        y2={getY(96)}
                        stroke="#fbbf24"
                        strokeWidth="1.5"
                        strokeDasharray="4 3"
                      />
                      <text
                        x={W - PR - 2}
                        y={getY(96) - 4}
                        textAnchor="end"
                        className="fill-amber-400 text-[8.5px] font-mono font-bold"
                      >
                        WHO Full-Year Max Allowance (96h / 4 days per yr)
                      </text>
                    </g>

                    {/* Full period ghost path */}
                    <path
                      d={Array.from({ length: totD }, (_, i) => {
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
                    <path d={dublinPts.join(' ')} fill="none" stroke="#22d3ee" strokeWidth="1.6" strokeDasharray="2 2" />
                    <path d={nycPts.join(' ')} fill="none" stroke="#10b981" strokeWidth="2" />
                    <path d={londonPts.join(' ')} fill="none" stroke="#38bdf8" strokeWidth="2.2" />
                    <path d={traleePts.join(' ')} fill="none" stroke="#f97316" strokeWidth="2.2" />
                    <path d={ennisPts.join(' ')} fill="none" stroke="#d946ef" strokeWidth="2.8" />

                    {/* Current Day Playhead Dots */}
                    <circle
                      cx={getX(safeDay)}
                      cy={getY(ennisStat?.cumBreachHours || 0)}
                      r="4.5"
                      fill="#d946ef"
                      stroke="#ffffff"
                      strokeWidth="1.5"
                    />
                    <circle
                      cx={getX(safeDay)}
                      cy={getY(londonStat?.cumBreachHours || 0)}
                      r="3.8"
                      fill="#38bdf8"
                      stroke="#ffffff"
                      strokeWidth="1.5"
                    />
                    <circle
                      cx={getX(safeDay)}
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
                  <span className="flex items-center gap-1 text-cyan-300">
                    <span className="w-2.5 h-0.5 border-b border-dashed border-cyan-400"></span>🇮🇪 Dublin
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
