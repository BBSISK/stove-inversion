export interface Station {
  code: string;
  name: string;
  lat: number;
  lon: number;
  currentPm25: number | null;
  currentPm10: number | null;
  currentNo2: number | null;
  recordedAt?: string;
  status?: string;
}

export interface HourlyPoint {
  hour: number;
  averagePm25: number;
  peakPm25: number;
}

export interface InversionPoint {
  hour: number;
  pm25: number;
}

export interface DetailedStation {
  code: string;
  name: string;
  county: string;
  type: string;
  lat: number;
  lon: number;
  profile24h: HourlyPoint[];
  nov2PeakInversion: InversionPoint[];
  overallAveragePm25: number;
  highestRecordedPm25: number;
}

export interface NationalHourlyPoint {
  code: string;
  name: string;
  lat: number;
  lon: number;
  pm25: number;
}

export interface AirData {
  metadata: {
    title: string;
    source: string;
    network: string;
    url: string;
    period: string;
    whoGuidelineDailyPm25: number;
    euAnnualLimit: number;
    description: string;
  };
  targetStations: Record<string, DetailedStation>;
  allStations: Station[];
  hourlySnapshots: Record<string, NationalHourlyPoint[]>;
}
