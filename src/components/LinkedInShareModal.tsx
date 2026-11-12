import React, { useState } from 'react';
import { X, Copy, Check, Share2, Sparkles, Star } from 'lucide-react';

interface LinkedInShareModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LinkedInShareModal: React.FC<LinkedInShareModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const postContent = `Why does a quiet Irish town of 27,000 people record 11× worse winter evening air pollution than central London and 15× worse than Manhattan?

I’ve just published a new interactive data project analyzing telemetry from all 113 active Environmental Protection Agency (EPA) Ireland monitoring stations against global regulatory benchmarks (UK DEFRA, US EPA AirNow, Airparif):

The 7:00 PM "Stove Inversion" 🌫️🔥

A few startling findings from the EN 16450-certified sensor telemetry:

1. Regional Towns vs. Global Megacities: On calm winter nights, fine particulate matter (PM2.5) in Ennis, Co. Clare reaches 198.1 µg/m³ — more than 13× the WHO 24-hour safety threshold (15 µg/m³), outpolluting Westminster London (17.8 µg/m³), Midtown Manhattan (12.5 µg/m³), Paris (18.6 µg/m³), and even Beijing (61.0 µg/m³) during the evening hearth window.
2. 30-Day Cumulative Burden: Over a single winter month, Ennis and Tralee accumulate 5× to 9× more hours above the WHO danger threshold than London, New York, or Dublin Phoenix Park.
3. The Infrastructure Paradox: Dublin’s 1990 smoky coal ban, London’s 1956 Clean Air Act, and NYC’s Clean Heat program keep megacity winter evenings remarkably stable. Meanwhile, regional Irish valley towns without reticulated gas grids rely on solid fuels (turf, peat briquettes, wood) that become trapped under nocturnal thermal inversion lids.

The dashboard features:
- A 30-day cumulative monthly timelapse across a 32-county GIS map of Ireland.
- Animated exposure bar race & head-to-head duel against Dublin, London, New York, Paris, and Beijing.
- Interactive atmospheric physics breakdowns and full EPA CC BY 4.0 provenance.

Explore the live interactive dashboard: https://stove-inversion.onrender.com

#DataAnalytics #DataVisualization #EnvironmentalEngineering #AirQuality #EPA #TypeScript #React #PublicHealth #Ireland`;

  const handleCopy = () => {
    navigator.clipboard.writeText(postContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl p-6 sm:p-8 shadow-2xl my-8">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-2 mb-2">
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-500/10 text-orange-400 border border-orange-500/20">
            Portfolio & LinkedIn Kit
          </span>
        </div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-white">
          LinkedIn Feature & Post Kit
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Pre-formatted for your LinkedIn profile's Featured section and announcement post.
        </p>

        {/* Step 1: Featured Section Tips */}
        <div className="mt-5 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 space-y-1.5">
          <div className="flex items-center gap-2 font-bold text-amber-300">
            <Star className="w-4 h-4 fill-amber-300" />
            <span>How to add directly to your LinkedIn Featured section:</span>
          </div>
          <ol className="list-decimal list-inside space-y-1 text-slate-300 pl-1">
            <li>Go to your LinkedIn profile and click <strong>Add profile section &gt; Recommended &gt; Add featured</strong>.</li>
            <li>Click <strong>+ &gt; Add a link</strong> and paste your deployed URL.</li>
            <li>Title: <strong>The 7:00 PM "Stove Inversion" (EPA Telemetry Dashboard)</strong></li>
            <li>Description: <em>Interactive analysis of 113 EPA Ireland stations demonstrating the 20x winter PM2.5 hearth surge in regional valley towns.</em></li>
          </ol>
        </div>

        {/* Post Textarea */}
        <div className="mt-5 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Ready-to-Post Draft
            </label>
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-slate-950 font-semibold text-xs shadow-md shadow-orange-500/20 transition cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-slate-950" />
                  <span>Copied to Clipboard!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Post Draft</span>
                </>
              )}
            </button>
          </div>

          <textarea
            readOnly
            value={postContent}
            rows={11}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-300 font-mono leading-relaxed focus:outline-none select-all"
          />
        </div>

        {/* Footer */}
        <div className="mt-5 pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs transition cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
