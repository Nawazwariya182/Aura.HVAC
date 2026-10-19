"use client";

import React, { useState, useEffect } from "react";
import { 
  Trophy, 
  Award, 
  Play, 
  Clock, 
  Wind, 
  Snowflake, 
  Home, 
  Target, 
  Zap, 
  DollarSign, 
  Thermometer, 
  Settings, 
  Leaf, 
  BarChart3, 
  SlidersHorizontal, 
  ChevronLeft,
  Cpu,
  Sparkles
} from "lucide-react";
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from "recharts";
import { run4WayArena, ArenaRunResult } from "@/lib/api";
import { ParetoOptimizer } from "./ParetoOptimizer";

export const BenchmarkView: React.FC = () => {
  const [benchmarkTab, setBenchmarkTab] = useState<"arena" | "pareto">("arena");
  const [durationMin, setDurationMin] = useState<number>(120);
  const [disturbanceMin, setDisturbanceMin] = useState<number>(35);
  const [ambientShock, setAmbientShock] = useState<number>(7.0);
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<ArenaRunResult | null>(null);

  const handleRunArena = async () => {
    try {
      setLoading(true);
      const res = await run4WayArena({
        duration_minutes: durationMin,
        disturbance_min: disturbanceMin,
        cold_shock_deg: ambientShock,
      });
      setResult(res);
    } catch (err) {
      console.error("Arena benchmark error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!result) {
      handleRunArena();
    }
  }, []);

  const chartData = result
    ? result.series.time_minutes.map((t, idx) => ({
        time: `${t}m`,
        aura_fuzzy_temp: result.series.aura_fuzzy_temp[idx],
        std_fuzzy_temp: result.series.std_fuzzy_temp[idx],
        pid_temp: result.series.pid_temp[idx],
        bang_temp: result.series.bang_temp[idx],
        setpoint: result.setpoint,
        aura_fuzzy_power: result.series.aura_fuzzy_power[idx],
        std_fuzzy_power: result.series.std_fuzzy_power[idx],
        pid_power: result.series.pid_power[idx],
        bang_power: result.series.bang_power[idx],
      }))
    : [];

  return (
    <div className="space-y-6">
      {benchmarkTab === "pareto" ? (
        <div className="space-y-4">
          <button
            onClick={() => setBenchmarkTab("arena")}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 shadow-2xs transition-all cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back to 4-Way Control Arena</span>
          </button>
          <ParetoOptimizer />
        </div>
      ) : (
        <>
          {/* 1. HERO BANNER: Head-to-Head Algorithm Race with arena.png */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-50/70 via-white to-sky-50/40 border border-slate-200/90 p-6 sm:p-8 shadow-xs">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              {/* Left Column: Title, Subtitle & Action Buttons */}
              <div className="lg:col-span-5 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-amber-100 text-amber-600">
                    <Trophy className="w-3.5 h-3.5" />
                  </span>
                  <span className="text-[11px] font-bold uppercase tracking-widest text-amber-700 block font-departure">
                    4-WAY CONTROL ARENA
                  </span>
                </div>

                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-title text-slate-900 tracking-wide leading-tight">
                  Head-to-Head{" "}
                  <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    Algorithm Race
                  </span>
                </h1>

                <p className="text-xs sm:text-sm text-slate-600 max-w-xl font-medium leading-relaxed">
                  Watch 4 identical virtual rooms face the same physical weather shock simultaneously. Compare Bang-Bang Thermostat, Standard Textbook Fuzzy, Classical PID and Aura Economic Fuzzy in real time.
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <button
                    onClick={handleRunArena}
                    disabled={loading}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs transition-all shadow-sm disabled:opacity-50 cursor-pointer"
                  >
                    {loading ? (
                      <span className="animate-spin mr-1">⟳</span>
                    ) : (
                      <Play className="w-3.5 h-3.5 fill-current" />
                    )}
                    <span>{loading ? "Simulating Physics..." : "Start 4-Way Arena Race"}</span>
                  </button>

                  {/* <button
                    onClick={() => setBenchmarkTab("pareto")}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold text-xs transition-all shadow-2xs cursor-pointer"
                  >
                    <Award className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Pareto Frontier Multi-Objective Optimizer</span>
                  </button> */}
                </div>
              </div>

              {/* Center Column: arena.png 3D 4-Room Cutaway */}
              <div className="lg:col-span-4 flex justify-center">
                <div className="relative w-full max-w-sm rounded-2xl overflow-hidden shadow-soft-md border border-slate-200/80 bg-white/80 backdrop-blur-xs group">
                  <img
                    src="/images/arena.png"
                    alt="4-Way Control Arena Virtual House Cutaway"
                    className="w-full h-auto object-contain transform group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
              </div>

              {/* Right Column: Same Conditions for All Rooms Card */}
              <div className="lg:col-span-3">
                <div className="rounded-2xl bg-white/90 border border-slate-200/80 p-4 shadow-2xs space-y-3">
                  <h3 className="text-xs font-bold text-slate-800 pb-2 border-b border-slate-100 flex items-center justify-between">
                    <span>Same Conditions for All Rooms</span>
                  </h3>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="flex items-center gap-2 text-slate-500">
                        <Home className="w-3.5 h-3.5 text-blue-500" />
                        <span>Room Volume</span>
                      </span>
                      <span className="font-bold text-slate-900">85 m³</span>
                    </div>

                    <div className="flex items-center justify-between text-slate-600">
                      <span className="flex items-center gap-2 text-slate-500">
                        <Thermometer className="w-3.5 h-3.5 text-rose-500" />
                        <span>Initial Temperature</span>
                      </span>
                      <span className="font-bold text-slate-900">18°C</span>
                    </div>

                    <div className="flex items-center justify-between text-slate-600">
                      <span className="flex items-center gap-2 text-slate-500">
                        <Target className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Target Setpoint</span>
                      </span>
                      <span className="font-bold text-slate-900">22°C</span>
                    </div>

                    <div className="flex items-center justify-between text-slate-600">
                      <span className="flex items-center gap-2 text-slate-500">
                        <Snowflake className="w-3.5 h-3.5 text-sky-500" />
                        <span>Outdoor Weather</span>
                      </span>
                      <span className="font-bold text-sky-700">-{ambientShock.toFixed(0)}°C Plunge</span>
                    </div>

                    <div className="flex items-center justify-between text-slate-600">
                      <span className="flex items-center gap-2 text-slate-500">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        <span>Simulation Time</span>
                      </span>
                      <span className="font-bold text-slate-900">{durationMin} Minutes</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 2. THERMAL ARENA TEST PARAMETERS */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-blue-600" />
              <div>
                <h3 className="text-base font-bold text-slate-900 leading-tight">Thermal Arena Test Parameters</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Adjust global test conditions. All 4 rooms face the same environment.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Slider 1: Race Duration */}
              <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                      <Clock className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-bold text-slate-800">Race Duration</span>
                  </div>
                  <span className="text-sm font-black text-slate-900">{durationMin} Minutes</span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="120"
                  step="30"
                  value={durationMin}
                  onChange={(e) => setDurationMin(parseInt(e.target.value))}
                  className="w-full accent-blue-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-semibold">
                  <span>30</span>
                  <span>60</span>
                  <span>90</span>
                  <span>120</span>
                </div>
              </div>

              {/* Slider 2: Window Draft Disturbance */}
              <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600">
                      <Wind className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-bold text-slate-800">Window Draft Disturbance</span>
                  </div>
                  <span className="text-sm font-black text-slate-900">At Minute {disturbanceMin}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="60"
                  step="5"
                  value={disturbanceMin}
                  onChange={(e) => setDisturbanceMin(parseInt(e.target.value))}
                  className="w-full accent-blue-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-semibold">
                  <span>0</span>
                  <span>20</span>
                  <span>40</span>
                  <span>60</span>
                </div>
              </div>

              {/* Slider 3: Outdoor Cold Shock */}
              <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
                      <Snowflake className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-bold text-slate-800">Outdoor Cold Shock</span>
                  </div>
                  <span className="text-sm font-black text-sky-700">-{ambientShock.toFixed(0)}°C Plunge</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="15"
                  step="1"
                  value={ambientShock}
                  onChange={(e) => setAmbientShock(parseFloat(e.target.value))}
                  className="w-full accent-blue-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-semibold">
                  <span>-15°C</span>
                  <span>-10°C</span>
                  <span>-5°C</span>
                  <span>0°C</span>
                </div>
              </div>
            </div>
          </div>

          {/* 3. OFFICIAL RACE LEADERBOARD & ECONOMIC SCORECARD */}
          {result && (
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-5 sm:p-6 space-y-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-blue-600" />
                <div>
                  <h3 className="text-base font-bold text-slate-900 leading-tight">Official Race Leaderboard & Economic Scorecard</h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Real-time results updated every 2 seconds. Lower cost, lower overshoot, and stable control wins.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {result.scoreboard.map((entry, index) => {
                  const is1st = index === 0;
                  const is2nd = index === 1;
                  const is3rd = index === 2;
                  
                  const badgeColor = is1st
                    ? "bg-amber-100 text-amber-800 border-amber-300"
                    : is2nd
                    ? "bg-blue-100 text-blue-800 border-blue-300"
                    : is3rd
                    ? "bg-orange-100 text-orange-800 border-orange-300"
                    : "bg-rose-100 text-rose-800 border-rose-300";

                  const cardBg = is1st
                    ? "bg-emerald-50/20 border-emerald-200/90 shadow-soft"
                    : is2nd
                    ? "bg-blue-50/15 border-blue-200/80 shadow-soft"
                    : is3rd
                    ? "bg-amber-50/15 border-amber-200/80 shadow-soft"
                    : "bg-rose-50/15 border-rose-200/80 shadow-soft";

                  const sparkColor = is1st ? "#10b981" : is2nd ? "#0284c7" : is3rd ? "#f59e0b" : "#ef4444";

                  return (
                    <div
                      key={entry.controller}
                      className={`p-4 sm:p-5 rounded-2xl border transition-all ${cardBg} space-y-3.5`}
                    >
                      {/* Top Row: Rank Badge & Mini Sparkline Curve */}
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${badgeColor}`}>
                          {entry.badge}
                        </span>

                        {/* Smooth mini SVG sparkline */}
                        <svg className="w-16 h-6" viewBox="0 0 60 20" fill="none">
                          {is1st && (
                            <path d="M 0 15 Q 15 14, 30 6 T 60 5" stroke={sparkColor} strokeWidth="2" strokeLinecap="round" />
                          )}
                          {is2nd && (
                            <path d="M 0 16 Q 18 15, 32 8 T 60 7" stroke={sparkColor} strokeWidth="2" strokeLinecap="round" />
                          )}
                          {is3rd && (
                            <path d="M 0 16 Q 15 14, 25 3 Q 38 12, 60 8" stroke={sparkColor} strokeWidth="2" strokeLinecap="round" />
                          )}
                          {!is1st && !is2nd && !is3rd && (
                            <path d="M 0 15 L 12 15 L 12 4 L 24 4 L 24 16 L 36 16 L 36 4 L 48 4 L 48 16 L 60 16" stroke={sparkColor} strokeWidth="2" strokeLinecap="round" />
                          )}
                        </svg>
                      </div>

                      {/* Controller Title & Subtitle */}
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 leading-snug">
                          {entry.controller}
                        </h4>
                        <span className="text-[11px] text-slate-500 font-medium block">
                          {entry.tag}
                        </span>
                      </div>

                      {/* Metrics List */}
                      <div className="border-t border-slate-100 pt-3 space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5 text-slate-500">
                            <Zap className="w-3.5 h-3.5 text-amber-500" />
                            <span>Electricity Used</span>
                          </span>
                          <span className="font-bold text-slate-900">{entry.energy_kwh} kWh</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5 text-slate-500">
                            <DollarSign className="w-3.5 h-3.5 text-amber-500" />
                            <span>Total Utility Cost</span>
                          </span>
                          <span className="font-extrabold text-emerald-600">${entry.cost_usd.toFixed(3)}</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5 text-slate-500">
                            <Thermometer className="w-3.5 h-3.5 text-blue-500" />
                            <span>Temp Overshoot:</span>
                          </span>
                          <span className={`font-semibold ${entry.overshoot_deg > 0.5 ? "text-rose-600" : "text-emerald-600"}`}>
                            +{entry.overshoot_deg}°C
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5 text-slate-500">
                            <Settings className="w-3.5 h-3.5 text-purple-500" />
                            <span>Compressor Cycles:</span>
                          </span>
                          <span className={`font-semibold ${entry.cycles > 15 ? "text-amber-700" : "text-slate-700"}`}>
                            {entry.cycles} on/off
                          </span>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                          <span className="flex items-center gap-1.5 text-slate-500 font-medium">
                            <Leaf className="w-3.5 h-3.5 text-emerald-500" />
                            <span>Savings vs Bang-Bang</span>
                          </span>
                          <span className="font-extrabold text-emerald-600">
                            +{entry.savings_vs_bang_pct}%
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 4. DUAL DESKTOP COMPARISON CHARTS (2 COLUMNS) */}
          {result && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Chart 1: Temperature Tracking Curves */}
              <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-5 sm:p-6 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div className="flex items-center gap-2">
                    <Thermometer className="w-4 h-4 text-rose-500" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                        Temperature Tracking Curves (°C)
                      </h4>
                      <p className="text-[10px] text-slate-400">
                        All 4 rooms face the same -7°C outdoor shock at minute 0.
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 w-fit">
                    Target: 22.0°C
                  </span>
                </div>

                <div className="h-64 sm:h-72 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="time" stroke="#94a3b8" fontSize={10} />
                      <YAxis domain={["auto", "auto"]} stroke="#94a3b8" fontSize={10} unit="°C" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#ffffff",
                          borderColor: "#e2e8f0",
                          borderRadius: "12px",
                          fontSize: "11px",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                      <Line type="monotone" dataKey="aura_fuzzy_temp" name="Aura Economic Fuzzy" stroke="#059669" strokeWidth={3} dot={false} />
                      <Line type="monotone" dataKey="std_fuzzy_temp" name="Standard Mamdani" stroke="#0284c7" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="pid_temp" name="Classical PID" stroke="#d97706" strokeWidth={1.5} dot={false} />
                      <Line type="monotone" dataKey="bang_temp" name="Bang-Bang" stroke="#dc2626" strokeWidth={1.5} dot={false} strokeDasharray="3 3" />
                      <Line type="monotone" dataKey="setpoint" name="Target (22°C)" stroke="#94a3b8" strokeDasharray="4 4" strokeWidth={1.2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart 2: Actuator Power Profiles Graph */}
              <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-5 sm:p-6 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div className="flex items-center gap-2">
                    <Wind className="w-4 h-4 text-sky-500" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                        Actuator Power Profiles (0 - 100%)
                      </h4>
                      <p className="text-[10px] text-slate-400">
                        Compressor and blower effort over time. See chattering vs smooth control.
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 w-fit">
                    Chatter vs Throttling
                  </span>
                </div>

                <div className="h-64 sm:h-72 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="time" stroke="#94a3b8" fontSize={10} />
                      <YAxis domain={[-100, 100]} stroke="#94a3b8" fontSize={10} unit="%" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#ffffff",
                          borderColor: "#e2e8f0",
                          borderRadius: "12px",
                          fontSize: "11px",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                      <Line type="monotone" dataKey="aura_fuzzy_power" name="Aura Fuzzy %" stroke="#059669" strokeWidth={2.5} dot={false} />
                      <Line type="monotone" dataKey="std_fuzzy_power" name="Std Fuzzy %" stroke="#0284c7" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="pid_power" name="PID %" stroke="#d97706" strokeWidth={1.5} dot={false} />
                      <Line type="stepAfter" dataKey="bang_power" name="Bang-Bang %" stroke="#dc2626" strokeWidth={1.5} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {loading && !result && (
            <div className="p-12 text-center border border-slate-200/90 rounded-3xl bg-white shadow-soft space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-sky-50 border border-sky-200 flex items-center justify-center mx-auto text-sky-600">
                <Cpu className="w-6 h-6 animate-pulse" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-bold text-slate-900">Simulating 4-Way Thermal Arena...</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Running thermodynamic differential equations for Bang-Bang, Classical PID, Standard Mamdani, and Aura Economic Fuzzy across {durationMin} minutes with an outdoor plunge disturbance.
                </p>
              </div>
              <div className="max-w-xs mx-auto w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-sky-500 h-full w-2/3 animate-pulse rounded-full" />
              </div>
            </div>
          )}

          {!result && !loading && (
            <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-white text-slate-500 space-y-3">
              <Sparkles className="w-8 h-8 text-sky-500 mx-auto" />
              <h4 className="text-sm font-bold text-slate-800">Ready for Arena Race</h4>
              <p className="text-xs max-w-md mx-auto text-slate-500">
                Click &quot;Start 4-Way Arena Race&quot; above to watch the physics engine benchmark all four algorithms side-by-side with genuine thermodynamic equations.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default BenchmarkView;
