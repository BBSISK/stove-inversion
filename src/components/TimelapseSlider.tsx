import React, { useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, FastForward, Flame, Moon, Sun, Sunset, Sunrise } from 'lucide-react';

interface TimelapseSliderProps {
  currentHour: number;
  onHourChange: (hour: number) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  playbackSpeed: number;
  onSpeedToggle: () => void;
}

export const getHourNarrative = (hour: number) => {
  if (hour >= 0 && hour <= 5) {
    return {
      phase: "Night Inversion & Boundary Layer Trapping",
      icon: Moon,
      color: "text-purple-400 border-purple-500/30 bg-purple-500/10",
      description: "Surface temperature cools under clear skies. A shallow cold boundary layer traps residual hearth smoke near ground level in river basin towns."
    };
  } else if (hour >= 6 && hour <= 9) {
    return {
      phase: "Morning Relight & Commuter Surge",
      icon: Sunrise,
      color: "text-amber-400 border-amber-500/30 bg-amber-500/10",
      description: "Initial ignition of kitchen stoves and morning commuter traffic. Moderate rise across both urban and rural zones."
    };
  } else if (hour >= 10 && hour <= 16) {
    return {
      phase: "Solar Mixing & Atmospheric Dispersion",
      icon: Sun,
      color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
      description: "Daytime solar heating warms ground air. Thermal convective currents lift and disperse particulate matter. Air quality is at its cleanest nationwide (<12 µg/m³)."
    };
  } else if (hour >= 17 && hour <= 18) {
    return {
      phase: "Sunset & Radiational Ground Cooling",
      icon: Sunset,
      color: "text-orange-400 border-orange-500/30 bg-orange-500/10",
      description: "Sun sets; rapid radiational heat loss from the soil creates a temperature inversion (cold air trapped below a warmer upper layer). Stoves begin lighting."
    };
  } else if (hour >= 19 && hour <= 21) {
    return {
      phase: "🔥 THE HEARTH SPIKE (Peak Inversion)",
      icon: Flame,
      color: "text-rose-400 border-rose-500/40 bg-rose-500/20 font-bold",
      description: "Domestic solid fuel peak: peat briquettes, turf, and dried timber are stoked across regional towns. Particulate is trapped under the thermal inversion lid, spiking regional monitors above 150-190 µg/m³."
    };
  } else {
    return {
      phase: "Overnight Smoldering",
      icon: Moon,
      color: "text-indigo-400 border-indigo-500/30 bg-indigo-500/10",
      description: "Stoves damped down for overnight burn. Microscopic fine soot accumulates in valleys without wind dispersal."
    };
  }
};

export const TimelapseSlider: React.FC<TimelapseSliderProps> = ({
  currentHour,
  onHourChange,
  isPlaying,
  onTogglePlay,
  playbackSpeed,
  onSpeedToggle,
}) => {
  const narrative = getHourNarrative(currentHour);
  const IconComponent = narrative.icon;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl backdrop-blur-md">
      {/* Narrative Headline */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-slate-800/90 border border-slate-700 flex flex-col items-center justify-center font-mono">
            <span className="text-lg font-bold text-white tracking-wider">
              {String(currentHour).padStart(2, '0')}:00
            </span>
            <span className="text-[10px] text-slate-400 uppercase">UTC</span>
          </div>

          <div>
            <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${narrative.color}`}>
              <IconComponent className="w-3.5 h-3.5" />
              <span>{narrative.phase}</span>
            </div>
            <p className="text-xs text-slate-400 mt-1 line-clamp-2 max-w-xl">
              {narrative.description}
            </p>
          </div>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center gap-2 self-end sm:self-center">
          <button
            onClick={() => onHourChange(0)}
            title="Reset to 00:00"
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={onTogglePlay}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-xs tracking-wide transition cursor-pointer ${
              isPlaying
                ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-orange-500 hover:bg-orange-600 text-slate-950 shadow-md shadow-orange-500/20'
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4 fill-current" />
                <span>PAUSE</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>PLAY 24H</span>
              </>
            )}
          </button>

          <button
            onClick={onSpeedToggle}
            title="Toggle animation speed"
            className="flex items-center gap-1 px-2.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-mono transition cursor-pointer"
          >
            <FastForward className="w-3.5 h-3.5" />
            <span>{playbackSpeed}x</span>
          </button>
        </div>
      </div>

      {/* Scrubbing Bar */}
      <div className="space-y-2">
        <div className="relative flex items-center">
          <input
            type="range"
            min="0"
            max="23"
            step="1"
            value={currentHour}
            onChange={(e) => onHourChange(parseInt(e.target.value, 10))}
            className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-orange-500 focus:outline-none"
          />
        </div>

        {/* Hour Ticks */}
        <div className="flex justify-between text-[11px] font-mono text-slate-500 px-1">
          <span>00:00</span>
          <span>03:00</span>
          <span>06:00</span>
          <span>09:00</span>
          <span>12:00</span>
          <span>15:00</span>
          <span>18:00</span>
          <span className="text-orange-400 font-bold">19:00 🔥</span>
          <span>21:00</span>
          <span>23:00</span>
        </div>

        {/* Preset Quick-Jumps */}
        <div className="flex items-center gap-1.5 pt-1 overflow-x-auto text-[11px]">
          <span className="text-slate-500 shrink-0 font-medium mr-1">Quick view:</span>
          {[
            { label: '07:00 Morning', hour: 7 },
            { label: '14:00 Solar Clean', hour: 14 },
            { label: '17:00 Sunset Inversion', hour: 17 },
            { label: '19:00 🔥 The Stove Spike', hour: 19 },
            { label: '21:00 Peak Smog', hour: 21 },
          ].map((preset) => (
            <button
              key={preset.hour}
              onClick={() => onHourChange(preset.hour)}
              className={`px-2.5 py-1 rounded-md transition font-medium shrink-0 cursor-pointer ${
                currentHour === preset.hour
                  ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40'
                  : 'bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-transparent'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
