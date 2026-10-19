"use client";

import React, { useState } from "react";
import { 
  TrendingDown, 
  Sparkles, 
  Award, 
  CheckCircle2, 
  Layers, 
  Play, 
  Sliders, 
  ArrowUpRight,
  ShieldCheck,
  Zap
} from "lucide-react";
import { 
  ParetoOptimizationResult, 
  ParetoCandidate, 
  runParetoOptimization, 
  adaptFuzzyDeadband 
} from "@/lib/api";

export function ParetoOptimizer() {
  const [loading, setLoading] = useState<boolean>(false);
  const [durationMinutes, setDurationMinutes] = useState<number>(60);
  const [result, setResult] = useState<ParetoOptimizationResult | null>(null);
  const [appliedAlpha, setAppliedAlpha] = useState<number | null>(null);

  const handleRunOptimization = async () => {
    setLoading(true);
    try {
      const res = await runParetoOptimization(durationMinutes);
      setResult(res);
    } catch (err) {
      console.error("Failed to run Pareto optimization:", err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (!result) {
      handleRunOptimization();
    }
  }, []);

  const handleApplyOptimal = async (alpha: number) => {
    try {
      await adaptFuzzyDeadband(alpha);
      setAppliedAlpha(alpha);
    } catch (err) {
      console.error("Failed to apply optimal deadband:", err);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 sm:p-6 space-y-6">
      {/* Header & Explanation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <Award className="w-4 h-4" />
            </div>
            <h3 className="text-base font-semibold text-slate-900">
              Multi-Objective Pareto Optimal Frontier Exploration
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Solves the fundamental thermodynamic tradeoff between <strong>Thermal Comfort Quality</strong> ($\int |e| dt$) and <strong>Operating Energy Cost</strong> ($\$$). Tests 5 candidate fuzzy deadband parameters across physical differential heat equations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
            <span>Duration:</span>
            <select
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(Number(e.target.value))}
              disabled={loading}
              className="bg-transparent font-semibold text-slate-800 outline-none cursor-pointer"
            >
              <option value={30}>30 mins</option>
              <option value={60}>60 mins (Standard)</option>
              <option value={90}>90 mins (Deep)</option>
            </select>
          </div>

          <button
            onClick={handleRunOptimization}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
          >
            {loading ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Simulating Physical Arena...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Explore Pareto Frontier</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {!result ? (
        loading ? (
          <div className="p-12 text-center bg-white border border-emerald-200/80 rounded-2xl shadow-soft space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto text-emerald-600">
              <Award className="w-6 h-6 animate-pulse" />
            </div>
            <div className="space-y-1">
              <h4 className="text-base font-bold text-slate-900">Simulating Pareto Optimal Multi-Objective Tradeoff...</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Benchmarking 5 candidate fuzzy deadband parameters across physical differential equations to construct the non-dominated Pareto frontier curve.
              </p>
            </div>
            <div className="max-w-xs mx-auto w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full w-3/4 animate-pulse rounded-full" />
            </div>
          </div>
        ) : (
          <div className="p-8 text-center bg-slate-50/70 border border-dashed border-slate-200 rounded-xl">
            <Layers className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h4 className="text-sm font-semibold text-slate-700">No Pareto Optimization Run Yet</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Click <strong>&quot;Explore Pareto Frontier&quot;</strong> above to simulate 5 candidate controller tuning configurations and map the non-dominated Pareto tradeoff curve.
            </p>
          </div>
        )
      ) : (
        <div className="space-y-6">
          {/* Recommendation Banner */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-50 via-teal-50/40 to-white border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider block">
                  Pareto Optimal Knee-Point Identified
                </span>
                <h4 className="text-sm sm:text-base font-bold text-slate-900">
                  {result.candidates.find(c => c.id === result.recommended_candidate)?.name} ($\alpha = {result.recommended_alpha}$)
                </h4>
                <p className="text-xs text-slate-600 mt-0.5">
                  Best composite multi-objective compromise: minimizes energy cost while keeping thermal deviation strictly bounded.
                </p>
              </div>
            </div>

            <button
              onClick={() => handleApplyOptimal(result.recommended_alpha)}
              disabled={appliedAlpha === result.recommended_alpha}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-emerald-600 text-white text-xs font-semibold rounded-lg shadow-sm transition-all shrink-0"
            >
              {appliedAlpha === result.recommended_alpha ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                  <span>Applied to Active Home Twin</span>
                </>
              ) : (
                <>
                  <Sliders className="w-4 h-4" />
                  <span>Apply Recommended Deadband</span>
                </>
              )}
            </button>
          </div>

          {/* Pareto Frontier Scatter Visualization */}
          <div className="bg-slate-50/70 border border-slate-200/90 rounded-xl p-4 sm:p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
                  Bi-Objective Pareto Frontier Map
                </h4>
                <span className="text-[11px] text-slate-500">
                  Ideal design lies in the bottom-left quadrant (Low Discomfort + Low Operating Cost)
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-600">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Pareto Frontier (Non-Dominated)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-400" /> Dominated Designs
                </span>
              </div>
            </div>

            {/* Scatter Plot Box */}
            <div className="relative w-full aspect-[21/9] min-h-[260px] bg-white rounded-2xl border border-slate-200/90 p-6 flex flex-col justify-between overflow-hidden shadow-2xs">
              {/* Axis Labels */}
              <div className="absolute top-3 left-6 text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <span>▲ Operating Electricity Cost ($)</span>
              </div>
              <div className="absolute bottom-2 right-6 text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <span>Thermal Discomfort Deviation (°C) ▶</span>
              </div>

              {/* Connected SVG Pareto Curve & Gridlines Overlay */}
              {(() => {
                const minCost = 0.15;
                const maxCost = 0.45;
                const minDisc = 0.10;
                const maxDisc = 0.60;

                const paretoCandidates = result.candidates
                  .filter((c) => c.is_pareto)
                  .sort((a, b) => a.discomfort_deg - b.discomfort_deg);

                const pts = paretoCandidates.map((c) => {
                  const xPct = Math.max(8, Math.min(92, ((c.discomfort_deg - minDisc) / (maxDisc - minDisc)) * 100));
                  const yPct = 100 - Math.max(15, Math.min(85, ((c.cost_usd - minCost) / (maxCost - minCost)) * 100));
                  return { xPct, yPct };
                });

                const curveD = pts.reduce((acc, pt, idx) => `${acc} ${idx === 0 ? "M" : "L"} ${pt.xPct}% ${pt.yPct}%`, "");

                return (
                  <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                    <defs>
                      <linearGradient id="paretoFrontierFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity="0.12" />
                        <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Gridlines */}
                    {[25, 50, 75].map((pct) => (
                      <g key={pct}>
                        <line x1="8%" y1={`${pct}%`} x2="92%" y2={`${pct}%`} stroke="#f1f5f9" strokeDasharray="3 3" />
                        <line x1={`${pct}%`} y1="12%" x2={`${pct}%`} y2="88%" stroke="#f1f5f9" strokeDasharray="3 3" />
                      </g>
                    ))}

                    {/* Connected Pareto Frontier Line */}
                    {curveD && (
                      <path
                        d={curveD}
                        fill="none"
                        stroke="#059669"
                        strokeWidth="2.5"
                        strokeDasharray="6 4"
                        strokeLinecap="round"
                      />
                    )}
                  </svg>
                );
              })()}

              {/* Data points mapping */}
              <div className="relative w-full h-full my-3 z-10">
                {result.candidates.map((cand) => {
                  const isRecommended = cand.id === result.recommended_candidate;
                  // Normalize positions across range
                  const minCost = 0.15;
                  const maxCost = 0.45;
                  const minDisc = 0.10;
                  const maxDisc = 0.60;

                  const leftPct = Math.max(10, Math.min(90, ((cand.discomfort_deg - minDisc) / (maxDisc - minDisc)) * 100));
                  const bottomPct = Math.max(15, Math.min(85, ((cand.cost_usd - minCost) / (maxCost - minCost)) * 100));

                  return (
                    <div
                      key={cand.id}
                      style={{ left: `${leftPct}%`, bottom: `${bottomPct}%` }}
                      className="absolute -translate-x-1/2 translate-y-1/2 group cursor-pointer"
                    >
                      {/* Point marker */}
                      <div className={`relative flex items-center justify-center rounded-full transition-all duration-200 hover:scale-125 ${
                        isRecommended 
                          ? "w-8 h-8 bg-emerald-500 text-white ring-4 ring-emerald-200 shadow-md animate-bounce"
                          : cand.is_pareto
                            ? "w-6 h-6 bg-emerald-600 text-white ring-2 ring-emerald-100 shadow-sm"
                            : "w-5 h-5 bg-slate-400 text-white ring-2 ring-slate-100"
                      }`}>
                        <span className="text-[10px] font-bold">α{cand.alpha}</span>
                      </div>

                      {/* Tooltip on hover */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-30 w-48 p-2.5 bg-slate-900 text-white text-[11px] rounded-xl shadow-xl pointer-events-none">
                        <div className="font-bold text-emerald-400 flex items-center justify-between">
                          <span>{cand.name}</span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">α = {cand.alpha}</span>
                        </div>
                        <div className="mt-1 space-y-0.5 text-slate-300">
                          <div>Cost: <strong className="text-white">${cand.cost_usd.toFixed(3)}</strong></div>
                          <div>Discomfort: <strong className="text-white">{cand.discomfort_deg.toFixed(2)}°C</strong></div>
                          <div>Compressor Cycles: <strong className="text-white">{cand.cycles} switches</strong></div>
                        </div>
                        <div className="text-[10px] text-emerald-300/80 mt-1.5 pt-1 border-t border-slate-800">
                          {cand.is_pareto ? "✓ Non-Dominated Pareto Optimal" : "• Dominated Configuration"}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Full Scorecard Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 border border-slate-200 rounded-xl overflow-hidden">
              <thead className="bg-slate-50 text-[11px] font-semibold text-slate-700 border-b border-slate-200 uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Candidate Config</th>
                  <th className="py-2.5 px-3">Deadband Factor</th>
                  <th className="py-2.5 px-3">Energy (kWh)</th>
                  <th className="py-2.5 px-3">Total Cost ($)</th>
                  <th className="py-2.5 px-3">Discomfort (°C)</th>
                  <th className="py-2.5 px-3">Cycles</th>
                  <th className="py-2.5 px-3">Pareto Status</th>
                  <th className="py-2.5 px-3 text-right">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {result.candidates.map((cand) => {
                  const isRec = cand.id === result.recommended_candidate;
                  return (
                    <tr 
                      key={cand.id}
                      className={isRec ? "bg-emerald-50/50 font-medium" : "hover:bg-slate-50/70"}
                    >
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          {isRec && <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                          <span className="text-slate-900 font-semibold">{cand.name}</span>
                          <span className="text-[10px] text-slate-400">({cand.tag})</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 font-mono font-semibold text-slate-800">
                        α = {cand.alpha.toFixed(1)}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-800">
                        {cand.energy_kwh.toFixed(3)}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-800">
                        ${cand.cost_usd.toFixed(3)}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`font-semibold ${cand.discomfort_deg <= 0.25 ? "text-emerald-600" : "text-amber-600"}`}>
                          {cand.discomfort_deg.toFixed(2)}°C
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-700">
                        {cand.cycles}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                          cand.is_pareto 
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                            : "bg-slate-100 text-slate-500 border-slate-200"
                        }`}>
                          {cand.is_pareto ? "Non-Dominated" : "Dominated"}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                        {cand.score}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
