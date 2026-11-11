import React from 'react';
import { Flame, ShieldAlert, BookOpen, Share2, Info, Wind } from 'lucide-react';
import { AirData } from '../types';

interface HeaderProps {
  data: AirData;
  onOpenMethodology: () => void;
  onOpenPhysics: () => void;
  onOpenShare: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  data,
  onOpenMethodology,
  onOpenPhysics,
  onOpenShare,
}) => {
  return (
    <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-30 px-4 lg:px-8 py-4">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Left: Brand & Main Title */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-500/10 text-orange-400 border border-orange-500/20">
              <Flame className="w-3.5 h-3.5 text-orange-400" />
              EPA Telemetry Analysis
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
              <Wind className="w-3 h-3 text-cyan-400" />
              113 Active Monitors
            </span>
          </div>

          <div className="flex items-baseline gap-3">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
              The 7:00 PM <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-300 to-rose-400">"Stove Inversion"</span>
            </h1>
          </div>

          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
            Telemetry proves why quiet regional Irish towns experience catastrophic <strong className="text-rose-300">20× winter PM2.5 spikes</strong> compared to Dublin, driven by domestic solid fuel burning and nighttime atmospheric trapping.
          </p>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={onOpenPhysics}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
          >
            <Info className="w-3.5 h-3.5 text-amber-400" />
            <span>Atmospheric Physics</span>
          </button>

          <button
            onClick={onOpenMethodology}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
          >
            <BookOpen className="w-3.5 h-3.5 text-sky-400" />
            <span>EPA Methodology</span>
          </button>

          <button
            onClick={onOpenShare}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-slate-950 shadow-md shadow-orange-500/20 transition cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>LinkedIn Feature Pack</span>
          </button>
        </div>

      </div>
    </header>
  );
};
