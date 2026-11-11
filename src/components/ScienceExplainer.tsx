import React from 'react';
import { X, Flame, Wind, CloudFog, ShieldAlert, CheckCircle2, ChevronRight } from 'lucide-react';

interface ScienceExplainerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ScienceExplainer: React.FC<ScienceExplainerProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-700 rounded-2xl p-6 sm:p-8 shadow-2xl my-8">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-2 mb-2">
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            Atmospheric & Environmental Science
          </span>
        </div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-white">
          Why Does Ireland Suffer the 7:00 PM "Stove Inversion"?
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          A physical intersection of topographical geography, winter anticyclones, and household fuel economics.
        </p>

        {/* Section 1: Thermal Inversion Physics */}
        <div className="mt-6 space-y-4">
          <h3 className="text-base font-bold text-slate-200 flex items-center gap-2">
            <CloudFog className="w-4 h-4 text-sky-400" />
            1. The Atmospheric Trap: Thermal Inversion
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block mb-1">
                Normal Daytime Convection
              </span>
              <p className="text-xs text-slate-300 leading-relaxed">
                The earth absorbs sunlight, warming surface air. Warm air is less dense and naturally rises, carrying smoke, combustion gases, and particulate matter up into the troposphere to disperse safely.
              </p>
              <div className="mt-3 p-2 rounded bg-emerald-500/10 text-[11px] text-emerald-300 font-mono">
                Warm Surface → Rising Air → Rapid Dispersion
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-rose-500/30">
              <span className="text-xs font-bold text-rose-400 uppercase tracking-wider block mb-1">
                Winter Evening Inversion (19:00 - 23:00)
              </span>
              <p className="text-xs text-slate-300 leading-relaxed">
                Under clear, calm winter skies (anticyclonic high pressure), the ground radiates its heat rapidly into space. The air layer directly touching the cold ground cools faster than the air above it, creating an impenetrable <strong>warm air lid</strong>.
              </p>
              <div className="mt-3 p-2 rounded bg-rose-500/10 text-[11px] text-rose-300 font-mono">
                Cold Ground Air Trapped Below Warm Lid → No Escape
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Chimney smoke typically rises at around 30°C–60°C. In an inversion, it hits the warmer atmospheric layer at 50–100 meters above ground and cannot rise further. It cools and spreads horizontally across residential rooftops and gardens, pooling into the streets.
          </p>
        </div>

        {/* Section 2: Regional vs Dublin Infrastructure Divergence */}
        <div className="mt-6 pt-5 border-t border-slate-800 space-y-3">
          <h3 className="text-base font-bold text-slate-200 flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-400" />
            2. The Structural Fuel Divide: Why Dublin Stays Clean
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-950 border border-cyan-500/20">
              <h4 className="text-xs font-bold text-cyan-300 uppercase tracking-wider mb-2">
                Dublin & Major Cities
              </h4>
              <ul className="text-xs text-slate-300 space-y-2">
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                  <span><strong>Smoky Coal Ban:</strong> Enacted by Mary Harney in Dublin in 1990; reduced cardiovascular winter deaths by ~350/year almost immediately.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                  <span><strong>Gas Grid Infrastructure:</strong> High saturation of Gas Networks Ireland natural gas piping and heat pumps; minimal domestic wood/peat combustion.</span>
                </li>
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-orange-500/20">
              <h4 className="text-xs font-bold text-orange-300 uppercase tracking-wider mb-2">
                Regional Valley Towns (Ennis, Tralee, Longford)
              </h4>
              <ul className="text-xs text-slate-300 space-y-2">
                <li className="flex items-start gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-orange-400 shrink-0 mt-0.5" />
                  <span><strong>No Reticulated Gas Grid:</strong> Homes depend on kerosene heating oil and secondary solid fuel stoves/open hearths.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-orange-400 shrink-0 mt-0.5" />
                  <span><strong>Turf & Peat Heritage:</strong> Peat briquettes and barrowed sod turf are carbon-dense, moisture-heavy fuels producing high particulate mass per gigajoule.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-orange-400 shrink-0 mt-0.5" />
                  <span><strong>Valley Topography:</strong> Ennis (Fergus River valley), Tralee (flanked by Slieve Mish), and Macroom (Sullane River basin) form natural topographical bowls where cold air settles.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Section 3: Why PM2.5 Matters */}
        <div className="mt-6 pt-5 border-t border-slate-800 space-y-2">
          <h3 className="text-base font-bold text-slate-200 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            3. The Biological Threat of PM2.5
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Particles smaller than 2.5 microns (1/30th the width of a human hair) bypass nasal cilia and bronchial mucous defenses. They lodge deep in alveolar sacs and cross directly into the bloodstream, triggering systemic vascular inflammation, asthma exacerbations, and arrhythmias.
          </p>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs transition cursor-pointer"
          >
            Close Explainer
          </button>
        </div>

      </div>
    </div>
  );
};
