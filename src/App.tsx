import React, { useState, useEffect } from 'react';
import { AirData } from './types';
import { Header } from './components/Header';
import { TimelapseSlider } from './components/TimelapseSlider';
import { IrelandMap } from './components/IrelandMap';
import { ComparisonDuel } from './components/ComparisonDuel';
import { MonthlyCumulativeMap } from './components/MonthlyCumulativeMap';
import { ScienceExplainer } from './components/ScienceExplainer';
import { MethodologyModal } from './components/MethodologyModal';
import { LinkedInShareModal } from './components/LinkedInShareModal';
import { Calendar, Clock, LayoutGrid, Loader2 } from 'lucide-react';

export const App: React.FC = () => {
  const [data, setData] = useState<AirData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dashboard View Mode: 'cumulative' (30-Day Monthly Summary for LinkedIn), 'diurnal' (24-Hour Cycle), or 'both'
  const [dashboardMode, setDashboardMode] = useState<'cumulative' | 'diurnal' | 'both'>('cumulative');

  // Default hour is 19 (7:00 PM UTC - The Hearth Spike)
  const [currentHour, setCurrentHour] = useState<number>(19);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);

  // Selected stations for Duel
  const [selectedStationCode, setSelectedStationCode] = useState<string>('EPA-25'); // Ennis
  const [baselineStationCode, setBaselineStationCode] = useState<string>('EPA-48'); // Dublin Phoenix Park

  // Modals
  const [isMethodologyOpen, setIsMethodologyOpen] = useState(false);
  const [isPhysicsOpen, setIsPhysicsOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);

  // Load telemetry dataset
  useEffect(() => {
    fetch('./data.json')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        return res.json();
      })
      .then((json: AirData) => {
        setData(json);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load air quality data:', err);
        setError('Failed to load air quality telemetry data.');
        setLoading(false);
      });
  }, []);

  // Animation Loop for 24h Playback
  useEffect(() => {
    if (!isPlaying) return;

    const intervalMs = playbackSpeed === 2 ? 650 : 1200;
    const timer = setInterval(() => {
      setCurrentHour((prev) => (prev + 1) % 24);
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isPlaying, playbackSpeed]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-slate-200">
        <Loader2 className="w-10 h-10 text-orange-500 animate-spin mb-4" />
        <h2 className="text-lg font-bold text-white">Loading EPA Ireland Telemetry...</h2>
        <p className="text-xs text-slate-400 mt-1">Calibrating 113 active monitoring stations.</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-rose-400">
        <p className="text-sm font-semibold">{error || 'Data could not be rendered.'}</p>
      </div>
    );
  }

  const hourlyPoints = data.hourlySnapshots[String(currentHour)] || [];
  const whoLimit = data.metadata.whoGuidelineDailyPm25;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navigation & Controls */}
      <Header
        data={data}
        onOpenMethodology={() => setIsMethodologyOpen(true)}
        onOpenPhysics={() => setIsPhysicsOpen(true)}
        onOpenShare={() => setIsShareOpen(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-5 space-y-6">
        {/* View Switcher Bar + Key Metrics Ribbon */}
        <section className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/70 border border-slate-800/90 rounded-2xl p-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setDashboardMode('cumulative')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                dashboardMode === 'cumulative'
                  ? 'bg-gradient-to-r from-orange-500 to-fuchsia-500 text-white shadow-md shadow-fuchsia-500/20'
                  : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>30-Day Monthly Cumulative (LinkedIn Summary)</span>
            </button>

            <button
              onClick={() => setDashboardMode('diurnal')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                dashboardMode === 'diurnal'
                  ? 'bg-orange-500 text-slate-950 shadow-md shadow-orange-500/20'
                  : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>24-Hour Diurnal Cycle &amp; Station Duel</span>
            </button>

            <button
              onClick={() => setDashboardMode('both')}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                dashboardMode === 'both'
                  ? 'bg-slate-700 text-white border border-slate-600'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Full Combined View</span>
            </button>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono px-2">
            <div>
              <span className="text-slate-500">Ennis 2026 Peak: </span>
              <strong className="text-fuchsia-400">283.6 µg/m³</strong>
            </div>
            <span className="text-slate-700">|</span>
            <div>
              <span className="text-slate-500">Dublin Pk: </span>
              <strong className="text-sky-400">9.1 µg/m³</strong>
            </div>
            <span className="text-slate-700 hidden sm:inline">|</span>
            <div className="hidden sm:block">
              <span className="text-slate-500">WHO Limit: </span>
              <strong className="text-amber-400">15.0 µg/m³</strong>
            </div>
          </div>
        </section>

        {/* SECTION A: 30-Day Cumulative Monthly Ireland Map Timelapse (LinkedIn Summary View) */}
        {(dashboardMode === 'cumulative' || dashboardMode === 'both') && (
          <section>
            <MonthlyCumulativeMap
              data={data}
              selectedStationCode={selectedStationCode}
              onSelectStation={(code) => setSelectedStationCode(code)}
            />
          </section>
        )}

        {/* SECTION B: 24-Hour Diurnal Cycle & Head-to-Head Duel */}
        {(dashboardMode === 'diurnal' || dashboardMode === 'both') && (
          <div className="space-y-6">
            {/* Key Metrics Highlight Ribbon */}
            <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 sm:p-4">
                <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">
                  Ennis Peak Inversion
                </span>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-extrabold font-mono text-purple-400">
                    198.1
                  </span>
                  <span className="text-xs text-slate-400 font-mono">µg/m³</span>
                </div>
                <span className="text-[11px] text-purple-300 font-medium">
                  13.2× WHO 24h Threshold (15)
                </span>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 sm:p-4">
                <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">
                  The Hearth Window
                </span>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-extrabold font-mono text-orange-400">
                    19:00 - 21:00
                  </span>
                  <span className="text-xs text-slate-400 font-mono">UTC</span>
                </div>
                <span className="text-[11px] text-orange-300 font-medium">
                  100% of top annual spikes
                </span>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 sm:p-4">
                <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">
                  Dublin Phoenix Park Baseline
                </span>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-extrabold font-mono text-cyan-400">
                    9.1
                  </span>
                  <span className="text-xs text-slate-400 font-mono">µg/m³</span>
                </div>
                <span className="text-[11px] text-cyan-300 font-medium">
                  Smoky Coal Ban + Gas Grid
                </span>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 sm:p-4">
                <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">
                  Active EPA Monitors
                </span>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-400">
                    113
                  </span>
                  <span className="text-xs text-slate-400 font-mono">Stations</span>
                </div>
                <span className="text-[11px] text-emerald-300 font-medium">
                  AURN National Network
                </span>
              </div>
            </section>

            {/* 24-Hour Scrubber & Narrative Bar */}
            <section>
              <TimelapseSlider
                currentHour={currentHour}
                onHourChange={(h) => setCurrentHour(h)}
                isPlaying={isPlaying}
                onTogglePlay={() => setIsPlaying(!isPlaying)}
                playbackSpeed={playbackSpeed}
                onSpeedToggle={() => setPlaybackSpeed(playbackSpeed === 1 ? 2 : 1)}
              />
            </section>

            {/* Core Visualization Grid: Map + Comparison Duel */}
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              <div className="lg:col-span-5 flex flex-col">
                <IrelandMap
                  currentHour={currentHour}
                  hourlyPoints={hourlyPoints}
                  selectedStationCode={selectedStationCode}
                  onSelectStation={(code) => setSelectedStationCode(code)}
                  targetStations={data.targetStations}
                  whoLimit={whoLimit}
                />
              </div>

              <div className="lg:col-span-7 flex flex-col">
                <ComparisonDuel
                  targetStations={data.targetStations}
                  selectedStationCode={selectedStationCode}
                  onSelectStation={(code) => setSelectedStationCode(code)}
                  baselineStationCode={baselineStationCode}
                  onSelectBaseline={(code) => setBaselineStationCode(code)}
                  currentHour={currentHour}
                  whoLimit={whoLimit}
                />
              </div>
            </section>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-6 px-4 lg:px-8 mt-12 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-400">The 7:00 PM "Stove Inversion"</span>
            <span>•</span>
            <span>Data: EPA Ireland AURN / Sonitus Systems</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMethodologyOpen(true)}
              className="hover:text-slate-300 transition cursor-pointer"
            >
              Academic Provenance
            </button>
            <button
              onClick={() => setIsPhysicsOpen(true)}
              className="hover:text-slate-300 transition cursor-pointer"
            >
              Inversion Physics
            </button>
            <button
              onClick={() => setIsShareOpen(true)}
              className="text-orange-400 hover:text-orange-300 font-medium transition cursor-pointer"
            >
              LinkedIn Feature Pack
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <ScienceExplainer
        isOpen={isPhysicsOpen}
        onClose={() => setIsPhysicsOpen(false)}
      />

      <MethodologyModal
        isOpen={isMethodologyOpen}
        onClose={() => setIsMethodologyOpen(false)}
        data={data}
      />

      <LinkedInShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
      />
    </div>
  );
};

export default App;
