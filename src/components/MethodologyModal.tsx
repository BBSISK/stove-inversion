import React from 'react';
import { X, BookOpen, ExternalLink, ShieldCheck, Download, Award } from 'lucide-react';
import { AirData } from '../types';

interface MethodologyModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: AirData;
}

export const MethodologyModal: React.FC<MethodologyModalProps> = ({ isOpen, onClose, data }) => {
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

        {/* Title */}
        <div className="flex items-center gap-2 mb-2">
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20">
            EPA Ireland Provenance & Academic Methodology
          </span>
        </div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-white">
          Data Governance & Instrumentation Standards
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Full traceability and measurement standards underlying this diurnal inversion analysis.
        </p>

        {/* Section 1: Monitoring Network */}
        <div className="mt-6 space-y-3">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-sky-400" />
            1. National Ambient Air Quality Network (AURN)
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Data is retrieved from the real-time telemetry network operated by the <strong>Environmental Protection Agency (EPA) Ireland</strong> in collaboration with Sonitus Systems and Local Authorities. The network comprises 113 continuously transmitting stations measuring PM2.5, PM10, NO2, SO2, and Ozone across all four air quality zones (Zone A Dublin, Zone B Cork, Zone C Large Towns, Zone D Rural).
          </p>
        </div>

        {/* Section 2: Sensor Calibration & Standards */}
        <div className="mt-5 pt-4 border-t border-slate-800 space-y-3">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-400" />
            2. Instrumental Calibration & Quality Assurance
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="font-semibold text-slate-200 block mb-1">Palas Fidas 200 (Optical Particle Counter)</span>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Certified to European Standard <strong>EN 16450</strong> for automated PM2.5 and PM10 measurement. Equipped with an Intelligent Aerosol Drying System (IADS) to eliminate hygroscopic water droplets and fog bias.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="font-semibold text-slate-200 block mb-1">Turnkey Osiris & DustDetex</span>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Light-scattering nephelometers calibrated using gravimetric reference samplers (EN 12341) to ensure high-fidelity sub-micron particulate counting.
              </p>
            </div>
          </div>
        </div>

        {/* Section 3: Threshold Standards */}
        <div className="mt-5 pt-4 border-t border-slate-800 space-y-3">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
            3. Regulatory & Health Thresholds
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="py-2 pr-4 font-semibold">Standard Body</th>
                  <th className="py-2 pr-4 font-semibold">Metric</th>
                  <th className="py-2 pr-4 font-semibold">Threshold</th>
                  <th className="py-2 font-semibold">Health Basis</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
                <tr>
                  <td className="py-2 pr-4 font-sans text-amber-400 font-semibold">WHO 2021</td>
                  <td className="py-2 pr-4">PM2.5 24h Average</td>
                  <td className="py-2 pr-4 text-amber-400 font-bold">15.0 µg/m³</td>
                  <td className="py-2 font-sans text-slate-400">Cardiovascular & pulmonary mortality</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-sans text-sky-400 font-semibold">EU Directive 2008/50/EC</td>
                  <td className="py-2 pr-4">PM2.5 Annual Target</td>
                  <td className="py-2 pr-4 text-sky-400 font-bold">20.0 µg/m³</td>
                  <td className="py-2 font-sans text-slate-400">Statutory European Union legal cap</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-sans text-rose-400 font-semibold">Ennis Recorded Peak</td>
                  <td className="py-2 pr-4">PM2.5 1h Inversion Peak</td>
                  <td className="py-2 pr-4 text-rose-400 font-bold">198.1 µg/m³</td>
                  <td className="py-2 font-sans text-rose-300 font-semibold">13.2× WHO Daily Limit</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 4: Open Data License */}
        <div className="mt-5 pt-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-400">
          <div>
            <span>Data Licensed under </span>
            <a
              href="https://creativecommons.org/licenses/by/4.0/"
              target="_blank"
              rel="noreferrer"
              className="text-sky-400 hover:underline font-medium inline-flex items-center gap-1"
            >
              Creative Commons Attribution 4.0 International (CC BY 4.0)
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <a
            href="./data.json"
            download="epa_air_quality_pipeline.json"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
          >
            <Download className="w-3.5 h-3.5 text-orange-400" />
            <span>Download Pipeline JSON (517 KB)</span>
          </a>
        </div>

      </div>
    </div>
  );
};
