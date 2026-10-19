"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  Cpu, 
  Sliders, 
  Layers, 
  Info, 
  CheckCircle, 
  TrendingUp, 
  RotateCcw, 
  Sparkles, 
  ArrowRight, 
  Flame, 
  Snowflake, 
  Wind, 
  HelpCircle, 
  Sun, 
  Users,
  Target,
  Thermometer,
  Activity,
  Play,
  SlidersHorizontal,
  Lightbulb,
  Crosshair,
  TrendingDown,
  ChevronDown
} from "lucide-react";
import { 
  evaluateFuzzy, 
  fetchMembershipFunctions, 
  fetchControlSurface, 
  adaptFuzzyDeadband,
  FuzzyEvaluationResult,
  MembershipCurvesData,
  ControlSurfaceData 
} from "@/lib/api";

export const FuzzyStudioView: React.FC = () => {
  // Input parameters state matching the mockup
  const [roomTemp, setRoomTemp] = useState<number>(18.1);
  const [setpoint, setSetpoint] = useState<number>(22.0);
  const [trend, setTrend] = useState<"cooling" | "steady" | "warming">("steady");
  const [ambient, setAmbient] = useState<number>(12.5);
  const [occupancy, setOccupancy] = useState<number>(2);
  const [tariff, setTariff] = useState<number>(0.18);
  const [defuzzMethod, setDefuzzMethod] = useState<string>("centroid");
  const [updateRate, setUpdateRate] = useState<string>("2 Hz (500ms)");
  const [fuzzyModel, setFuzzyModel] = useState<string>("Mamdani (Min-Max)");
  const [ruleBase, setRuleBase] = useState<string>("Default (45 Rules)");

  // Advanced features state
  const [inertiaFactor, setInertiaFactor] = useState<number>(0.85);
  const [adaptationRecord, setAdaptationRecord] = useState<any>(null);
  const [adapting, setAdapting] = useState<boolean>(false);

  // Output evaluation state
  const [evaluation, setEvaluation] = useState<FuzzyEvaluationResult | null>(null);
  const [curves, setCurves] = useState<MembershipCurvesData | null>(null);
  const [surface, setSurface] = useState<ControlSurfaceData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<"interactive" | "rules" | "curves" | "defuzz" | "surface" | "adaptation">("interactive");
  const [selectedCurveVar, setSelectedCurveVar] = useState<string>("error");
  const [hoveredPreviewPoint, setHoveredPreviewPoint] = useState<{ time: number; temp: number } | null>(null);
  const [surfaceHoverCell, setSurfaceHoverCell] = useState<{ xVal: number; yVal: number; zVal: number } | null>(null);

  // Computed error and rate of change
  const error = useMemo(() => Number((setpoint - roomTemp).toFixed(1)), [setpoint, roomTemp]);
  const derror = useMemo(() => {
    if (trend === "cooling") return -0.5;
    if (trend === "warming") return 0.5;
    return 0.0;
  }, [trend]);

  // Load initial membership functions
  useEffect(() => {
    async function loadInitial() {
      try {
        setLoading(true);
        const [mfx, surf] = await Promise.all([
          fetchMembershipFunctions(),
          fetchControlSurface({ grid_size: 21, ambient, occupancy }),
        ]);
        setCurves(mfx);
        setSurface(surf);
      } catch (err) {
        console.error("Failed to load fuzzy studio data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadInitial();
  }, []);

  // Run evaluation whenever inputs change
  useEffect(() => {
    let active = true;
    async function runEval() {
      try {
        const res = await evaluateFuzzy({
          error,
          derror,
          ambient,
          occupancy,
          tariff,
          defuzz_method: defuzzMethod,
        });
        if (active) setEvaluation(res);
      } catch (err) {
        console.error("Evaluation error:", err);
      }
    }
    runEval();
    return () => {
      active = false;
    };
  }, [error, derror, ambient, occupancy, tariff, defuzzMethod]);

  const handleReset = () => {
    setRoomTemp(18.1);
    setSetpoint(22.0);
    setTrend("steady");
    setAmbient(12.5);
    setOccupancy(2);
    setDefuzzMethod("centroid");
  };

  const handleApplyPreset = (preset: {
    room: number;
    target: number;
    amb: number;
    tr: "cooling" | "steady" | "warming";
    occ: number;
  }) => {
    setRoomTemp(preset.room);
    setSetpoint(preset.target);
    setAmbient(preset.amb);
    setTrend(preset.tr);
    setOccupancy(preset.occ);
  };

  const handleAdaptDeadband = async () => {
    try {
      setAdapting(true);
      const res = await adaptFuzzyDeadband(inertiaFactor);
      setAdaptationRecord(res);
      const mfx = await fetchMembershipFunctions();
      setCurves(mfx);
    } catch (e) {
      console.error(e);
    } finally {
      setAdapting(false);
    }
  };

  const crispPower = evaluation?.outputs?.power?.crisp_value ?? 35.0;
  const crispFan = evaluation?.outputs?.fan_speed?.crisp_value ?? 30.0;
  const activeRules = evaluation?.fired_rules ?? [];
  const topRule = activeRules[0] || {
    rule_id: 17,
    firing_strength: 0.68,
    explanation: "IF room is Cold AND outside is Cold THEN heater is Medium AND fan is Low"
  };
  const otherRules = activeRules.slice(1, 4);

  // Verdict calculation
  const getFuzzyVerdict = () => {
    if (crispPower > 40) {
      return {
        title: "Heat Pump High",
        desc: `The room is cold (${Math.abs(error).toFixed(1)}°C below setpoint). The heat pump operates at high output with brisk circulation to reach thermal comfort quickly.`,
        badgeColor: "bg-red-50 text-red-700 border-red-200",
        icon: <Flame className="w-3.5 h-3.5 text-red-500" />
      };
    }
    if (crispPower > 5) {
      return {
        title: "Heat Pump Moderate",
        desc: `The room is slightly cold (${Math.abs(error).toFixed(1)}°C below setpoint). Outdoor temperature is ${ambient}°C and occupancy is ${occupancy}. The fuzzy logic is applying ${crispPower.toFixed(0)}% heat pump power with ${crispFan.toFixed(0)}% fan speed to warm up gently without overheating.`,
        badgeColor: "bg-amber-50 text-amber-800 border-amber-200",
        icon: <Flame className="w-3.5 h-3.5 text-amber-500" />
      };
    }
    if (crispPower < -40) {
      return {
        title: "AC Cooling High",
        desc: `The room is significantly above setpoint (${error.toFixed(1)}°C error). Full inverter cooling and high airflow are engaged to remove heat rapidly.`,
        badgeColor: "bg-sky-50 text-sky-700 border-sky-200",
        icon: <Snowflake className="w-3.5 h-3.5 text-sky-500" />
      };
    }
    if (crispPower < -5) {
      return {
        title: "AC Cooling Gentle",
        desc: `The room is mildly warm. The compressor operates at gentle modulation (${Math.abs(crispPower).toFixed(0)}%) with whisper airflow for high energy efficiency.`,
        badgeColor: "bg-sky-50 text-sky-700 border-sky-200",
        icon: <Snowflake className="w-3.5 h-3.5 text-sky-500" />
      };
    }
    return {
      title: "Comfort Zone (Standby)",
      desc: "Room temperature is precisely aligned with your target setpoint. The system maintains equilibrium in eco standby mode.",
      badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
      icon: <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
    };
  };

  const verdict = getFuzzyVerdict();

  // Simulation preview forecast line calculation
  const previewPoints = useMemo(() => {
    const pts = [];
    const t0 = roomTemp;
    const target = setpoint;
    // Exponential curve approaching setpoint based on crispPower
    for (let i = 0; i <= 60; i += 10) {
      const alpha = 1 - Math.exp(-i / (35 + (100 - Math.min(100, Math.abs(crispPower))) * 0.3));
      const val = t0 + (target - t0) * alpha;
      pts.push({ time: i, temp: Number(val.toFixed(2)) });
    }
    return pts;
  }, [roomTemp, setpoint, crispPower]);

  return (
    <div className="space-y-6">
      {/* 1. HERO BANNER: Intelligent Comfort Control */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-50/70 via-white to-sky-50/50 border border-slate-200/90 p-6 sm:p-8 shadow-xs">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Left Text & Subtitle */}
          <div className="lg:col-span-6 space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-4 rounded-full bg-blue-600 block" />
              <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400 block font-departure">
                FUZZY LOGIC STUDIO
              </span>
            </div>
            
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-title text-slate-900 tracking-wide leading-tight">
              Intelligent{" "}
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Comfort Control
              </span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 max-w-xl font-medium leading-relaxed">
              Design, test and visualize how fuzzy logic controls the temperature, blower fan and heat pump in real time. Adjust conditions, see rule firing, and understand the decision.
            </p>
          </div>

          {/* Right: Isometric 3D Visual + 3 Info Tiles */}
          <div className="lg:col-span-6 flex flex-col sm:flex-row items-center justify-end gap-4">
            {/* 3D Isometric Fuzzy Surface Image */}
            <div className="relative w-52 h-40 sm:w-60 sm:h-44 rounded-2xl overflow-hidden shadow-soft-md border border-slate-200/80 bg-white/70 backdrop-blur-xs group">
              <img
                src="/images/fuzzy_surface_hero.jpg"
                alt="3D Fuzzy Inference Surface with IF/THEN Logic"
                className="w-full h-full object-contain p-1 transform group-hover:scale-105 transition-transform duration-500"
              />
            </div>

            {/* 3 Status Info Tiles */}
            <div className="flex flex-col gap-2 w-full sm:w-auto min-w-[210px]">
              <div className="flex items-center gap-2.5 p-2 px-3 rounded-xl bg-white/90 border border-slate-200/80 shadow-2xs">
                <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
                  <Cpu className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-900 block leading-tight">Fuzzy Inference</span>
                  <span className="text-[9px] text-slate-500 font-medium">Mamdani (Min-Max)</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 p-2 px-3 rounded-xl bg-white/90 border border-slate-200/80 shadow-2xs">
                <div className="w-7 h-7 rounded-lg bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600 shrink-0">
                  <Activity className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-900 block leading-tight">Inputs</span>
                  <span className="text-[9px] text-slate-500 font-medium">Temp Error, ΔError, Outdoor, Occ</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 p-2 px-3 rounded-xl bg-white/90 border border-slate-200/80 shadow-2xs">
                <div className="w-7 h-7 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-900 block leading-tight">Outputs</span>
                  <span className="text-[9px] text-slate-500 font-medium">Heat Pump Power, Blower Fan</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. SUBTABS ROW */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setActiveTab("interactive")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "interactive"
              ? "bg-blue-600 text-white shadow-xs"
              : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200"
          }`}
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>Interactive Tester</span>
        </button>

        <button
          onClick={() => setActiveTab("rules")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "rules"
              ? "bg-blue-600 text-white shadow-xs"
              : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200"
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Fired Rules ({activeRules.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("curves")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "curves"
              ? "bg-blue-600 text-white shadow-xs"
              : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200"
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Fuzzy Sets (Curves)</span>
        </button>

        <button
          onClick={() => setActiveTab("defuzz")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "defuzz"
              ? "bg-blue-600 text-white shadow-xs"
              : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200"
          }`}
        >
          <Crosshair className="w-3.5 h-3.5" />
          <span>Defuzzification</span>
        </button>

        <button
          onClick={() => setActiveTab("surface")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "surface"
              ? "bg-blue-600 text-white shadow-xs"
              : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200"
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Control Surface (3D/2D)</span>
        </button>

        <button
          onClick={() => setActiveTab("adaptation")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "adaptation"
              ? "bg-blue-600 text-white shadow-xs"
              : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200"
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Self-Tuning Deadband</span>
        </button>
      </div>

      {/* 3. MAIN DASHBOARD CONTENT */}
      {activeTab === "interactive" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* COLUMN 1: TEST CONDITIONS (LEFT - 4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-5 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-blue-600" />
                  <h3 className="text-base font-bold text-slate-900">Test Conditions</h3>
                </div>
                <button
                  onClick={handleReset}
                  className="flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 transition-all"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              </div>

              <p className="text-[11px] text-slate-500 -mt-2">
                Adjust real-world conditions to see how the fuzzy controller responds.
              </p>

              {/* Slider 1: Room Temperature */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-500">
                      <Thermometer className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-bold text-slate-800">Room Temperature</span>
                  </div>
                  <span className="text-base font-black text-slate-900">{roomTemp.toFixed(1)}°C</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="35"
                  step="0.1"
                  value={roomTemp}
                  onChange={(e) => setRoomTemp(parseFloat(e.target.value))}
                  className="w-full accent-blue-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-semibold">
                  <span>10°C</span>
                  <span>35°C</span>
                </div>
              </div>

              {/* Slider 2: Target Setpoint */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-500">
                      <Target className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-bold text-slate-800">Target Setpoint</span>
                  </div>
                  <span className="text-base font-black text-slate-900">{setpoint.toFixed(1)}°C</span>
                </div>
                <input
                  type="range"
                  min="16"
                  max="28"
                  step="0.5"
                  value={setpoint}
                  onChange={(e) => setSetpoint(parseFloat(e.target.value))}
                  className="w-full accent-blue-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-semibold">
                  <span>16°C</span>
                  <span>28°C</span>
                </div>
              </div>

              {/* Toggle 3: Temperature Trend */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-500">
                    <TrendingUp className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-bold text-slate-800">Temperature Trend</span>
                </div>
                <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100/90 border border-slate-200/80 rounded-xl">
                  <button
                    onClick={() => setTrend("cooling")}
                    className={`py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                      trend === "cooling" ? "bg-white text-blue-600 shadow-xs border border-blue-200" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Cooling Down
                  </button>
                  <button
                    onClick={() => setTrend("steady")}
                    className={`py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                      trend === "steady" ? "bg-white text-blue-600 shadow-xs border border-blue-200" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Steady
                  </button>
                  <button
                    onClick={() => setTrend("warming")}
                    className={`py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                      trend === "warming" ? "bg-white text-blue-600 shadow-xs border border-blue-200" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Warming Up
                  </button>
                </div>
              </div>

              {/* Slider 4: Outdoor Temperature */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-500">
                      <Sun className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-bold text-slate-800">Outdoor Temperature</span>
                  </div>
                  <span className="text-base font-black text-slate-900">{ambient.toFixed(1)}°C</span>
                </div>
                <input
                  type="range"
                  min="-10"
                  max="45"
                  step="0.5"
                  value={ambient}
                  onChange={(e) => setAmbient(parseFloat(e.target.value))}
                  className="w-full accent-blue-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-semibold">
                  <span>-10°C</span>
                  <span>45°C</span>
                </div>
              </div>

              {/* Slider 5: People in Room */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-500">
                      <Users className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-bold text-slate-800">People in Room</span>
                  </div>
                  <span className="text-base font-black text-slate-900">{occupancy} persons</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="6"
                  step="1"
                  value={occupancy}
                  onChange={(e) => setOccupancy(parseInt(e.target.value))}
                  className="w-full accent-blue-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-semibold">
                  <span>0</span>
                  <span>6</span>
                </div>
              </div>

              {/* Scenario Presets Grid */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Scenario Presets</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <button
                    onClick={() => handleApplyPreset({ room: 16.5, target: 22.0, amb: 2.0, tr: "cooling", occ: 2 })}
                    className="p-2 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200 text-left transition-all flex items-center gap-1.5 text-[11px] font-bold text-slate-700"
                  >
                    <Snowflake className="w-3 h-3 text-sky-500 shrink-0" />
                    <span>Winter Chill</span>
                  </button>

                  <button
                    onClick={() => handleApplyPreset({ room: 26.5, target: 21.0, amb: 34.0, tr: "warming", occ: 3 })}
                    className="p-2 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200 text-left transition-all flex items-center gap-1.5 text-[11px] font-bold text-slate-700"
                  >
                    <Sun className="w-3 h-3 text-amber-500 shrink-0" />
                    <span>Summer Heat</span>
                  </button>

                  <button
                    onClick={() => handleApplyPreset({ room: 23.5, target: 22.0, amb: 25.0, tr: "steady", occ: 1 })}
                    className="p-2 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200 text-left transition-all flex items-center gap-1.5 text-[11px] font-bold text-slate-700"
                  >
                    <Sun className="w-3 h-3 text-amber-600 shrink-0" />
                    <span>Solar Surplus</span>
                  </button>

                  <button
                    onClick={() => handleApplyPreset({ room: 22.0, target: 22.0, amb: 21.0, tr: "steady", occ: 2 })}
                    className="p-2 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200 text-left transition-all flex items-center gap-1.5 text-[11px] font-bold text-slate-700"
                  >
                    <CheckCircle className="w-3 h-3 text-emerald-500 shrink-0" />
                    <span>Comfort Zone</span>
                  </button>

                  <button
                    onClick={() => handleApplyPreset({ room: 28.5, target: 20.0, amb: 39.0, tr: "warming", occ: 4 })}
                    className="p-2 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200 text-left transition-all flex items-center gap-1.5 text-[11px] font-bold text-slate-700"
                  >
                    <Flame className="w-3 h-3 text-red-500 shrink-0" />
                    <span>Heatwave</span>
                  </button>

                  <button
                    onClick={() => handleApplyPreset({ room: 17.5, target: 22.5, amb: 6.0, tr: "cooling", occ: 1 })}
                    className="p-2 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200 text-left transition-all flex items-center gap-1.5 text-[11px] font-bold text-slate-700"
                  >
                    <Wind className="w-3 h-3 text-sky-500 shrink-0" />
                    <span>Cold Draft</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* COLUMN 2: MIDDLE (OUTPUTS, INFERENCE PROCESS, PREVIEW - 5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            {/* Top Card: Fuzzy Control Output */}
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Fuzzy Control Output</h3>
                  <p className="text-[11px] text-slate-500">Real-time controller response based on current conditions.</p>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${verdict.badgeColor}`}>
                  {verdict.icon}
                  <span>{verdict.title}</span>
                </div>
              </div>

              {/* Two Output Panels: Heat Pump Power & Blower Fan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Panel 1: Heat Pump Power */}
                <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                    <Flame className="w-4 h-4 text-orange-500" />
                    <span>Heat Pump Power</span>
                  </div>

                  <div className="flex items-baseline justify-between">
                    <span className="text-3xl font-black text-slate-900">
                      {Math.abs(crispPower).toFixed(1)}%
                    </span>
                    <span className="text-xs text-slate-500 font-bold">
                      {(Math.abs(crispPower) * 0.02).toFixed(2)} kW <span className="text-slate-400 font-normal">of 2.0 kW</span>
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 rounded-full ${
                        crispPower >= 0 ? "bg-orange-500" : "bg-sky-500"
                      }`}
                      style={{ width: `${Math.min(100, Math.abs(crispPower))}%` }}
                    />
                  </div>

                  <div className="flex justify-between text-[9px] text-slate-400 font-bold">
                    <span>0% (Off)</span>
                    <span>50% (Moderate)</span>
                    <span>100% (Max)</span>
                  </div>
                </div>

                {/* Panel 2: Blower Fan */}
                <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                    <Wind className="w-4 h-4 text-sky-500" />
                    <span>Blower Fan</span>
                  </div>

                  <div className="flex items-baseline justify-between">
                    <span className="text-3xl font-black text-slate-900">
                      {crispFan.toFixed(0)}%
                    </span>
                    <span className="text-xs text-slate-500 font-bold">
                      {(crispFan * 8).toFixed(0)} CFM <span className="text-slate-400 font-normal">of 800 CFM</span>
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className="h-full bg-sky-500 transition-all duration-300 rounded-full"
                      style={{ width: `${crispFan}%` }}
                    />
                  </div>

                  <div className="flex justify-between text-[9px] text-slate-400 font-bold">
                    <span>Low Draft</span>
                    <span>Medium Circulation</span>
                    <span>Turbo Boost</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Middle Card: Fuzzy Inference Process */}
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-5 space-y-4">
              <div>
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-blue-600" />
                  <h3 className="text-base font-bold text-slate-900">Fuzzy Inference Process</h3>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Live visualization of how inputs are fuzzified, rules are applied and output is defuzzified.
                </p>
              </div>

              {/* Generated 5-Step Fuzzy Inference Pipeline Image */}
              <div className="relative rounded-2xl overflow-hidden border border-slate-200/90 bg-white shadow-2xs group">
                <img
                  src="/images/fuzzy_inference_flow.jpg"
                  alt="Sequential 5-Step Fuzzy Logic Inference Pipeline"
                  className="w-full h-auto object-cover transform group-hover:scale-[1.01] transition-transform duration-300"
                />
              </div>

              {/* Connected Live Telemetry Indicators for all 5 stages */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1 text-[10px]">
                <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-200/80 space-y-0.5">
                  <span className="font-extrabold text-blue-900 block text-[9px] uppercase tracking-wider">1. Crisp Inputs</span>
                  <div className="text-slate-700 font-semibold leading-tight">
                    <div>Error: <strong className="text-blue-700">{error > 0 ? `+${error}` : error}°C</strong></div>
                    <div>Δe: <strong className="text-blue-700">{derror > 0 ? `+${derror}` : derror}°C/m</strong></div>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/80 space-y-0.5">
                  <span className="font-extrabold text-amber-900 block text-[9px] uppercase tracking-wider">2. Fuzzification</span>
                  <div className="text-slate-700 font-semibold leading-tight">
                    <div>Target: <strong className="text-amber-700">{setpoint.toFixed(1)}°C</strong></div>
                    <div>Room: <strong className="text-amber-700">{roomTemp.toFixed(1)}°C</strong></div>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-orange-50/70 border border-orange-200/80 space-y-0.5">
                  <span className="font-extrabold text-orange-900 block text-[9px] uppercase tracking-wider">3. Rule Evaluation</span>
                  <div className="text-slate-700 font-semibold leading-tight">
                    <div>Active: <strong className="text-orange-700">{activeRules.length} Rules</strong></div>
                    <div>Rule Base: <strong className="text-orange-700">45 Rules</strong></div>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 space-y-0.5">
                  <span className="font-extrabold text-emerald-900 block text-[9px] uppercase tracking-wider">4. Aggregation</span>
                  <div className="text-slate-700 font-semibold leading-tight">
                    <div>Method: <strong className="text-emerald-700">Mamdani Max</strong></div>
                    <div>Shape: <strong className="text-emerald-700">Multi-Modal</strong></div>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-purple-50/70 border border-purple-200/80 space-y-0.5">
                  <span className="font-extrabold text-purple-900 block text-[9px] uppercase tracking-wider">5. Defuzzification</span>
                  <div className="text-slate-700 font-semibold leading-tight">
                    <div>Method: <strong className="text-purple-700">{defuzzMethod.toUpperCase()}</strong></div>
                    <div>Crisp: <strong className="text-purple-700">{crispPower.toFixed(0)}% Power</strong></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Card: Temperature Trend (Simulation Preview) */}
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-5 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-600" />
                  <h3 className="text-base font-bold text-slate-900">Temperature Trend (Simulation Preview)</h3>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Live
                  </span>
                </div>

                {/* Legend */}
                <div className="flex items-center gap-3 text-xs font-semibold text-slate-600">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                    Room Temperature
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3.5 h-0.5 bg-amber-500 border-t border-dashed border-amber-600" />
                    Setpoint ({setpoint.toFixed(0)}°C)
                  </span>
                </div>
              </div>

              {/* SVG Dynamic Forecast Chart */}
              <div className="relative w-full h-44 bg-slate-50/50 rounded-2xl border border-slate-200/80 p-2 select-none overflow-hidden">
                {(() => {
                  const allTemps = [roomTemp, setpoint, ambient, ...previewPoints.map((p) => p.temp)];
                  const minDomain = Math.floor(Math.min(...allTemps) - 1.5);
                  const maxDomain = Math.ceil(Math.max(...allTemps) + 1.5);
                  const domainSpan = Math.max(4.0, maxDomain - minDomain);
                  const mapY = (t: number) => 125 - ((t - minDomain) / domainSpan) * 105;

                  const stepX = (490 - 55) / Math.max(1, previewPoints.length - 1);
                  const setpointY = mapY(setpoint);

                  let pathD = `M 55 ${mapY(previewPoints[0].temp)}`;
                  previewPoints.slice(1).forEach((pt, idx) => {
                    const x = 55 + (idx + 1) * stepX;
                    const y = mapY(pt.temp);
                    pathD += ` L ${x} ${y}`;
                  });

                  const areaD = `${pathD} L 490 130 L 55 130 Z`;

                  const gridTicks = [
                    { label: `${maxDomain.toFixed(0)}°C`, y: 15 },
                    { label: `${(minDomain + domainSpan * 0.66).toFixed(0)}°C`, y: 50 },
                    { label: `${(minDomain + domainSpan * 0.33).toFixed(0)}°C`, y: 85 },
                    { label: `${minDomain.toFixed(0)}°C`, y: 120 },
                  ];

                  return (
                    <svg className="w-full h-full" viewBox="0 0 500 140" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="chartAreaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.32" />
                          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>

                      {/* Horizontal grid lines */}
                      {gridTicks.map((grid, idx) => (
                        <g key={idx}>
                          <line x1="45" y1={grid.y} x2="490" y2={grid.y} stroke="#e2e8f0" strokeDasharray="3 3" />
                          <text x="12" y={grid.y + 3.5} fill="#94a3b8" fontSize="9.5" fontWeight="bold">
                            {grid.label}
                          </text>
                        </g>
                      ))}

                      {/* Setpoint Reference Line (dashed orange) */}
                      <line
                        x1="45"
                        y1={setpointY}
                        x2="490"
                        y2={setpointY}
                        stroke="#f59e0b"
                        strokeWidth="1.75"
                        strokeDasharray="4 3"
                      />

                      {/* Forecast Area & Line */}
                      <path d={areaD} fill="url(#chartAreaGrad)" />
                      <path d={pathD} fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

                      {/* Data dots with hover */}
                      {previewPoints.map((pt, idx) => {
                        const cx = 55 + idx * stepX;
                        const cy = mapY(pt.temp);
                        const isHovered = hoveredPreviewPoint?.time === pt.time;
                        return (
                          <g key={idx} className="cursor-pointer">
                            <circle
                              cx={cx}
                              cy={cy}
                              r={isHovered ? "5" : "3"}
                              fill={isHovered ? "#2563eb" : "#ffffff"}
                              stroke="#2563eb"
                              strokeWidth="2"
                              onMouseEnter={() => setHoveredPreviewPoint(pt)}
                              onMouseLeave={() => setHoveredPreviewPoint(null)}
                            />
                            {isHovered && (
                              <g>
                                <rect
                                  x={cx - 36}
                                  y={cy - 24}
                                  width="72"
                                  height="18"
                                  rx="5"
                                  fill="#0f172a"
                                />
                                <text
                                  x={cx}
                                  y={cy - 12}
                                  fill="#ffffff"
                                  fontSize="9"
                                  fontWeight="bold"
                                  textAnchor="middle"
                                >
                                  {pt.temp.toFixed(1)}°C ({pt.time}m)
                                </text>
                              </g>
                            )}
                          </g>
                        );
                      })}
                    </svg>
                  );
                })()}

                {/* X-Axis Labels */}
                <div className="flex justify-between pl-12 pr-3 text-[10px] text-slate-400 font-bold -mt-2">
                  <span>Now</span>
                  <span>+10 min</span>
                  <span>+20 min</span>
                  <span>+30 min</span>
                  <span>+40 min</span>
                  <span>+50 min</span>
                  <span>+60 min</span>
                </div>
              </div>
            </div>
          </div>

          {/* COLUMN 3: RIGHT (EXPLANATION, TOP RULE, ACTIVE RULES, CONTROLLER SETTINGS) */}
          <div className="lg:col-span-3 space-y-4">
            {/* Card 1: AI Decision Explanation */}
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">AI Decision Explanation</h3>
              </div>
              <p className="text-[11px] text-slate-500 -mt-1">
                Plain-language explanation of the current fuzzy decision.
              </p>

              <div className="p-3.5 rounded-2xl bg-sky-50/70 border border-sky-200/80 flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0 mt-0.5">
                  <Lightbulb className="w-4 h-4 text-blue-600" />
                </div>
                <p className="text-xs text-slate-700 leading-relaxed font-medium">
                  {verdict.desc}
                </p>
              </div>
            </div>

            {/* Card 2: Top Firing Rule */}
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-blue-600" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Top Firing Rule</h4>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-blue-600">Rule #{topRule.rule_id}</span>
                  <span className="text-[11px] font-bold text-slate-500">
                    Strength: {(topRule.firing_strength ?? 0.68).toFixed(2)}
                  </span>
                </div>
                <p className="text-xs text-slate-700 leading-snug font-medium">
                  {topRule.explanation}
                </p>
              </div>
            </div>

            {/* Card 3: Other Active Rules */}
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900">Other Active Rules</h4>
                <button
                  onClick={() => setActiveTab("rules")}
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-0.5"
                >
                  <span>View All</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              <div className="space-y-2">
                {(otherRules.length > 0 ? otherRules : [
                  { rule_id: 12, firing_strength: 0.42, explanation: "IF error is Negative AND trend is Rising..." },
                  { rule_id: 5, firing_strength: 0.31, explanation: "IF occupancy is Medium AND outside is Cold..." },
                  { rule_id: 23, firing_strength: 0.18, explanation: "IF error is Negative Small AND outside is Moderate..." },
                ]).map((r, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-blue-600">Rule #{r.rule_id}</span>
                      <span className="text-[10px] text-slate-500 font-bold">Strength: {(r.firing_strength ?? 0.3).toFixed(2)}</span>
                    </div>
                    <p className="text-[11px] text-slate-600 truncate">
                      {r.explanation}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Card 4: Controller Settings */}
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-blue-600" />
                <h4 className="text-xs font-bold text-slate-900">Controller Settings</h4>
              </div>

              <div className="space-y-2.5 text-xs">
                {/* Setting 1: Fuzzy Model */}
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Fuzzy Model</span>
                  <div className="relative">
                    <select
                      value={fuzzyModel}
                      onChange={(e) => setFuzzyModel(e.target.value)}
                      className="text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 pr-6 cursor-pointer appearance-none"
                    >
                      <option value="Mamdani (Min-Max)">Mamdani (Min-Max)</option>
                      <option value="Takagi-Sugeno">Takagi-Sugeno</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {/* Setting 2: Output Method */}
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Output Method</span>
                  <div className="relative">
                    <select
                      value={defuzzMethod}
                      onChange={(e) => setDefuzzMethod(e.target.value)}
                      className="text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 pr-6 cursor-pointer appearance-none"
                    >
                      <option value="centroid">Centroid</option>
                      <option value="bisector">Bisector</option>
                      <option value="mom">MOM</option>
                      <option value="som">SOM</option>
                      <option value="lom">LOM</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {/* Setting 3: Update Rate */}
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Update Rate</span>
                  <div className="relative">
                    <select
                      value={updateRate}
                      onChange={(e) => setUpdateRate(e.target.value)}
                      className="text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 pr-6 cursor-pointer appearance-none"
                    >
                      <option value="2 Hz (500ms)">2 Hz (500ms)</option>
                      <option value="1 Hz (1000ms)">1 Hz (1000ms)</option>
                      <option value="5 Hz (200ms)">5 Hz (200ms)</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {/* Setting 4: Rule Base */}
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Rule Base</span>
                  <div className="relative">
                    <select
                      value={ruleBase}
                      onChange={(e) => setRuleBase(e.target.value)}
                      className="text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 pr-6 cursor-pointer appearance-none"
                    >
                      <option value="Default (45 Rules)">Default (45 Rules)</option>
                      <option value="Aggressive (45 Rules)">Aggressive (45 Rules)</option>
                      <option value="Eco Conservation (45 Rules)">Eco Conservation (45 Rules)</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ALL FIRED RULES */}
      {activeTab === "rules" && (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">All Active Rules for Current Conditions</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                The fuzzy inference engine aggregates these active rules simultaneously based on input membership values.
              </p>
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              {activeRules.length} Rules Active
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[600px] overflow-y-auto pr-1">
            {activeRules.map((rule) => (
              <div
                key={rule.rule_id}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition-all text-xs space-y-2"
              >
                <div className="flex items-center justify-between font-bold">
                  <span className="text-blue-600">Rule #{rule.rule_id}</span>
                  <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200 text-[11px]">
                    Strength: {(rule.firing_strength * 100).toFixed(0)}%
                  </span>
                </div>
                <p className="text-slate-700 font-medium leading-relaxed">
                  {rule.explanation}
                </p>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-600 h-full rounded-full transition-all"
                    style={{ width: `${rule.firing_strength * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: MEMBERSHIP CURVES */}
      {activeTab === "curves" && curves && (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Fuzzy Membership Functions (Fuzzification)
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                These overlapping continuous linguistic sets map physical sensor readings into degrees of truth ($\mu \in [0.0, 1.0]$).
              </p>
            </div>

            {/* Variable Selector Tabs */}
            <div className="flex flex-wrap gap-1.5 p-1 bg-slate-100/90 rounded-2xl border border-slate-200/80 text-xs font-bold">
              {[
                { id: "error", label: "Error (ΔT)", icon: "ΔT" },
                { id: "derror", label: "Rate (Δe/Δt)", icon: "d/dt" },
                { id: "ambient", label: "Outdoor Temp", icon: "Tamb" },
                { id: "occupancy", label: "Occupancy", icon: "Occ" },
                { id: "tariff", label: "Grid Tariff", icon: "$/kWh" },
                { id: "power", label: "Power (Output)", icon: "kW" },
                { id: "fan_speed", label: "Fan Speed (Output)", icon: "CFM" },
              ].map((v) => (
                <button
                  key={v.id}
                  onClick={() => setSelectedCurveVar(v.id)}
                  className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                    selectedCurveVar === v.id
                      ? "bg-blue-600 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900 bg-transparent"
                  }`}
                >
                  <span>{v.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Dynamic SVG Curve Plotter */}
          {(() => {
            const activeVarObj =
              curves.inputs[selectedCurveVar] || curves.outputs[selectedCurveVar];

            if (!activeVarObj) {
              return (
                <div className="p-8 text-center text-slate-400 text-xs">
                  Loading variable data...
                </div>
              );
            }

            const [uMin, uMax] = activeVarObj.universe;
            const universeSpan = Math.max(0.001, uMax - uMin);
            const termsEntries = Object.entries(activeVarObj.terms);

            // Determine current active value
            let currentVal = error;
            if (selectedCurveVar === "derror") currentVal = derror;
            if (selectedCurveVar === "ambient") currentVal = ambient;
            if (selectedCurveVar === "occupancy") currentVal = occupancy;
            if (selectedCurveVar === "tariff") currentVal = tariff;
            if (selectedCurveVar === "power") currentVal = crispPower;
            if (selectedCurveVar === "fan_speed") currentVal = crispFan;

            const TERM_COLORS = [
              "#2563eb", // blue
              "#06b6d4", // cyan
              "#10b981", // emerald
              "#f59e0b", // amber
              "#ef4444", // rose
              "#8b5cf6", // purple
              "#ec4899", // pink
            ];

            const mapX = (x: number) => 55 + ((x - uMin) / universeSpan) * 560;
            const mapY = (y: number) => 170 - y * 135;
            const stepDown = Math.max(1, Math.floor(activeVarObj.x.length / 85));

            // Closest index in universe x
            const currIdx = activeVarObj.x.reduce(
              (best, curr, i, arr) =>
                Math.abs(curr - currentVal) < Math.abs(arr[best] - currentVal) ? i : best,
              0
            );

            const cursorX = Math.max(55, Math.min(615, mapX(currentVal)));

            return (
              <div className="space-y-6">
                <div className="relative w-full aspect-[21/8] min-h-[220px] bg-slate-50/50 rounded-2xl border border-slate-200/90 p-4 select-none overflow-hidden">
                  <svg className="w-full h-full" viewBox="0 0 650 200" preserveAspectRatio="none">
                    <defs>
                      {termsEntries.map(([tKey], idx) => {
                        const col = TERM_COLORS[idx % TERM_COLORS.length];
                        return (
                          <linearGradient
                            key={tKey}
                            id={`grad-term-${tKey}`}
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop offset="0%" stopColor={col} stopOpacity="0.22" />
                            <stop offset="100%" stopColor={col} stopOpacity="0.0" />
                          </linearGradient>
                        );
                      })}
                    </defs>

                    {/* Horizontal grid lines for membership truth [0.0, 0.25, 0.5, 0.75, 1.0] */}
                    {[0, 0.25, 0.5, 0.75, 1.0].map((truth) => {
                      const y = mapY(truth);
                      return (
                        <g key={truth}>
                          <line x1="55" y1={y} x2="615" y2={y} stroke="#e2e8f0" strokeDasharray="3 3" />
                          <text x="14" y={y + 3.5} fill="#94a3b8" fontSize="9.5" fontWeight="bold">
                            μ={truth.toFixed(2)}
                          </text>
                        </g>
                      );
                    })}

                    {/* Universe vertical ticks */}
                    {[0, 0.25, 0.5, 0.75, 1.0].map((pct) => {
                      const val = uMin + universeSpan * pct;
                      const x = 55 + pct * 560;
                      return (
                        <g key={pct}>
                          <line x1={x} y1="35" x2={x} y2="175" stroke="#f1f5f9" strokeDasharray="2 2" />
                          <text x={x} y="192" fill="#94a3b8" fontSize="9.5" fontWeight="bold" textAnchor="middle">
                            {val.toFixed(1)}{activeVarObj.unit}
                          </text>
                        </g>
                      );
                    })}

                    {/* Continuous Term Curves */}
                    {termsEntries.map(([tKey, term], idx) => {
                      const col = TERM_COLORS[idx % TERM_COLORS.length];
                      const pts: Array<{ x: number; y: number }> = [];

                      for (let i = 0; i < activeVarObj.x.length; i += stepDown) {
                        pts.push({
                          x: mapX(activeVarObj.x[i]),
                          y: mapY(term.y[i] ?? 0),
                        });
                      }
                      // ensure last point included
                      const lastIdx = activeVarObj.x.length - 1;
                      pts.push({
                        x: mapX(activeVarObj.x[lastIdx]),
                        y: mapY(term.y[lastIdx] ?? 0),
                      });

                      const pathD = pts.reduce(
                        (acc, pt, pIdx) => `${acc} ${pIdx === 0 ? "M" : "L"} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`,
                        ""
                      );
                      const areaD = `${pathD} L ${mapX(uMax).toFixed(1)} 170 L ${mapX(uMin).toFixed(1)} 170 Z`;

                      return (
                        <g key={tKey}>
                          <path d={areaD} fill={`url(#grad-term-${tKey})`} />
                          <path
                            d={pathD}
                            fill="none"
                            stroke={col}
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </g>
                      );
                    })}

                    {/* CURRENT OPERATING VALUE VERTICAL CURSOR LINE */}
                    <line
                      x1={cursorX}
                      y1="25"
                      x2={cursorX}
                      y2="175"
                      stroke="#dc2626"
                      strokeWidth="2"
                      strokeDasharray="4 2"
                    />

                    {/* Active intersection dots on cursor line */}
                    {termsEntries.map(([tKey, term], idx) => {
                      const truth = term.y[currIdx] ?? 0;
                      if (truth <= 0.02) return null;
                      const dotY = mapY(truth);
                      const col = TERM_COLORS[idx % TERM_COLORS.length];
                      return (
                        <g key={tKey}>
                          <circle cx={cursorX} cy={dotY} r="4.5" fill={col} stroke="#ffffff" strokeWidth="2" />
                          <rect
                            x={Math.min(540, cursorX + 8)}
                            y={dotY - 10}
                            width="68"
                            height="18"
                            rx="4"
                            fill="#0f172a"
                            opacity="0.9"
                          />
                          <text
                            x={Math.min(540, cursorX + 8) + 34}
                            y={dotY + 2.5}
                            fill="#ffffff"
                            fontSize="9"
                            fontWeight="bold"
                            textAnchor="middle"
                          >
                            μ = {truth.toFixed(2)}
                          </text>
                        </g>
                      );
                    })}

                    {/* Top cursor pill */}
                    <rect
                      x={Math.max(10, Math.min(540, cursorX - 45))}
                      y="5"
                      width="90"
                      height="20"
                      rx="6"
                      fill="#dc2626"
                    />
                    <text
                      x={Math.max(10, Math.min(540, cursorX - 45)) + 45}
                      y="18.5"
                      fill="#ffffff"
                      fontSize="9.5"
                      fontWeight="black"
                      textAnchor="middle"
                    >
                      Now: {currentVal > 0 ? `+${currentVal.toFixed(1)}` : currentVal.toFixed(1)}{activeVarObj.unit}
                    </text>
                  </svg>
                </div>

                {/* Term Membership Truth Cards Grid */}
                <div>
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                    Active Linguistic Truth Degrees at Current State
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {termsEntries.map(([tKey, term], idx) => {
                      const col = TERM_COLORS[idx % TERM_COLORS.length];
                      const truth = term.y[currIdx] ?? 0;
                      const isActive = truth > 0.05;

                      return (
                        <div
                          key={tKey}
                          className={`p-3.5 rounded-2xl border transition-all ${
                            isActive
                              ? "bg-white border-blue-300 ring-2 ring-blue-100 shadow-xs"
                              : "bg-slate-50/70 border-slate-200/80"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span
                                className="w-3 h-3 rounded-full shrink-0 shadow-2xs"
                                style={{ backgroundColor: col }}
                              />
                              <span className="text-xs font-bold text-slate-900">{tKey}</span>
                            </div>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                isActive
                                  ? "bg-blue-50 text-blue-700 border-blue-200"
                                  : "bg-slate-100 text-slate-400 border-slate-200"
                              }`}
                            >
                              μ = {truth.toFixed(2)}
                            </span>
                          </div>

                          <div className="text-[11px] text-slate-600 font-medium mb-2.5">
                            {term.label}
                          </div>

                          <div className="w-full bg-slate-200/80 h-2 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-300"
                              style={{
                                width: `${truth * 100}%`,
                                backgroundColor: col,
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* TAB 4: DEFUZZIFICATION COMPARISON & LIVE SHAPE */}
      {activeTab === "defuzz" && (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <Crosshair className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Defuzzification Aggregated Shape & Method Comparison
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Calculates the final crisp actuator command using the continuous center of gravity formula: z* = ∫(z · μ(z) dz) / ∫(μ(z) dz).
              </p>
            </div>
            <div className="px-3 py-1 rounded-full bg-purple-50 border border-purple-200 text-purple-700 text-xs font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-purple-600 animate-pulse" />
              <span>Active: {defuzzMethod.toUpperCase()}</span>
            </div>
          </div>

          {/* Live Aggregated Output Shape & Centroid Cut Line */}
          {(() => {
            const outPower = evaluation?.outputs?.power;
            const xPts = outPower?.x || [];
            const aggMfx = outPower?.aggregated_mfx || [];
            const crispVal = crispPower;

            const uMin = -100;
            const uMax = 100;
            const mapX = (x: number) => 55 + ((x - uMin) / 200) * 560;
            const mapY = (y: number) => 170 - y * 135;

            let pathD = "";
            if (xPts.length > 0 && aggMfx.length > 0) {
              const step = Math.max(1, Math.floor(xPts.length / 90));
              const pts: Array<{ x: number; y: number }> = [];
              for (let i = 0; i < xPts.length; i += step) {
                pts.push({ x: mapX(xPts[i]), y: mapY(aggMfx[i] ?? 0) });
              }
              const last = xPts.length - 1;
              pts.push({ x: mapX(xPts[last]), y: mapY(aggMfx[last] ?? 0) });

              pathD = pts.reduce(
                (acc, pt, idx) => `${acc} ${idx === 0 ? "M" : "L"} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`,
                ""
              );
            }

            const areaD = pathD ? `${pathD} L ${mapX(100).toFixed(1)} 170 L ${mapX(-100).toFixed(1)} 170 Z` : "";
            const crispX = Math.max(55, Math.min(615, mapX(crispVal)));

            return (
              <div className="space-y-4">
                <div className="relative w-full aspect-[21/8] min-h-[220px] bg-slate-50/50 rounded-2xl border border-slate-200/90 p-4 select-none overflow-hidden">
                  <svg className="w-full h-full" viewBox="0 0 650 200" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="defuzzShapeGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#9333ea" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.05" />
                      </linearGradient>
                    </defs>

                    {/* Gridlines */}
                    {[0, 0.25, 0.5, 0.75, 1.0].map((truth) => {
                      const y = mapY(truth);
                      return (
                        <g key={truth}>
                          <line x1="55" y1={y} x2="615" y2={y} stroke="#e2e8f0" strokeDasharray="3 3" />
                          <text x="14" y={y + 3.5} fill="#94a3b8" fontSize="9.5" fontWeight="bold">
                            μ={truth.toFixed(2)}
                          </text>
                        </g>
                      );
                    })}

                    {/* Universe Ticks */}
                    {[-100, -50, 0, 50, 100].map((val) => {
                      const x = mapX(val);
                      return (
                        <g key={val}>
                          <line x1={x} y1="35" x2={x} y2="175" stroke="#f1f5f9" strokeDasharray="2 2" />
                          <text x={x} y="192" fill="#94a3b8" fontSize="9.5" fontWeight="bold" textAnchor="middle">
                            {val > 0 ? `+${val}%` : `${val}%`}
                          </text>
                        </g>
                      );
                    })}

                    {/* Aggregated Fuzzy Polygon */}
                    {areaD && <path d={areaD} fill="url(#defuzzShapeGrad)" />}
                    {pathD && (
                      <path
                        d={pathD}
                        fill="none"
                        stroke="#9333ea"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    )}

                    {/* Crisp Centroid Vertical Line */}
                    <line
                      x1={crispX}
                      y1="25"
                      x2={crispX}
                      y2="175"
                      stroke="#9333ea"
                      strokeWidth="2.5"
                      strokeDasharray="4 2"
                    />

                    {/* Center of Gravity Circle */}
                    <circle cx={crispX} cy="100" r="5" fill="#9333ea" stroke="#ffffff" strokeWidth="2" />

                    {/* Top Defuzzified Crisp Banner */}
                    <rect
                      x={Math.max(10, Math.min(460, crispX - 90))}
                      y="5"
                      width="180"
                      height="20"
                      rx="6"
                      fill="#9333ea"
                    />
                    <text
                      x={Math.max(10, Math.min(460, crispX - 90)) + 90}
                      y="18.5"
                      fill="#ffffff"
                      fontSize="9.5"
                      fontWeight="black"
                      textAnchor="middle"
                    >
                      Crisp Output: {crispVal > 0 ? `+${crispVal.toFixed(1)}%` : `${crispVal.toFixed(1)}%`} ({(crispVal * 0.02).toFixed(2)} kW)
                    </text>
                  </svg>
                </div>
              </div>
            );
          })()}

          {/* Interactive Method Comparison Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {[
              {
                id: "centroid",
                title: "Centroid (COG)",
                desc: "Calculates the exact center of area under the aggregated output polygon. Provides silky continuous actuator modulation with zero hunting.",
                active: defuzzMethod === "centroid",
              },
              {
                id: "bisector",
                title: "Bisector",
                desc: "Finds the vertical dividing line that splits the total integral area under the curve into two mathematically equal halves.",
                active: defuzzMethod === "bisector",
              },
              {
                id: "mom",
                title: "Mean of Maximum (MOM)",
                desc: "Averages all output points where the membership function reaches peak maximal plateau value. Quicker response, slightly more stepwise.",
                active: defuzzMethod === "mom",
              },
            ].map((m) => (
              <div
                key={m.id}
                onClick={() => setDefuzzMethod(m.id)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  m.active
                    ? "bg-purple-50/70 border-purple-500 ring-2 ring-purple-200 shadow-sm"
                    : "bg-slate-50 border-slate-200 hover:border-slate-300"
                }`}
              >
                <span className="text-sm font-bold text-slate-900 block mb-1">{m.title}</span>
                <p className="text-xs text-slate-600 leading-relaxed">{m.desc}</p>
                <div className="mt-3 pt-2 border-t border-slate-200/80 flex items-center justify-between text-xs font-bold text-purple-600">
                  <span>{m.active ? "Active In-Flight Method" : "Click to select"}</span>
                  {m.active && <CheckCircle className="w-4 h-4" />}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: 3D/2D CONTROL SURFACE */}
      {activeTab === "surface" && (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Fuzzy Control Surface: Transfer Characteristic Map
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Maps the non-linear transfer function between <strong>Temperature Error (ΔT)</strong>, <strong>Rate of Change (Δe/Δt)</strong>, and <strong>Heat Pump Power Output (%)</strong>.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-500" /> Cool
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-300" /> Off
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500" /> Heat
              </span>
            </div>
          </div>

          {/* Interactive Heatmap Surface Matrix */}
          {surface ? (
            <div className="space-y-4">
              <div className="relative w-full overflow-x-auto bg-slate-50/50 rounded-2xl border border-slate-200 p-4">
                <div className="min-w-[500px]">
                  <div className="flex justify-between text-[11px] font-bold text-slate-500 pb-2 border-b border-slate-200">
                    <span>▲ Warming Fast (-1.0°C/m)</span>
                    <span className="text-slate-800 font-extrabold uppercase">Rate of Change (Δe/Δt)</span>
                    <span>Cooling Fast (+1.0°C/m) ▼</span>
                  </div>

                  {/* 21x21 Heatmap Grid */}
                  <div
                    className="gap-0.5 my-2"
                    style={{
                      display: "grid",
                      gridTemplateColumns: `repeat(${surface.x.length}, minmax(0, 1fr))`,
                    }}
                  >
                    {surface.z.map((row, j) =>
                      row.map((val, i) => {
                        const xVal = surface.x[i];
                        const yVal = surface.y[j];
                        const isClosest =
                          Math.abs(xVal - error) < 0.3 && Math.abs(yVal - derror) < 0.15;

                        // Color scale: -100 to 100
                        let bg = "#f8fafc";
                        if (val > 10) {
                          const intensity = Math.min(1, val / 100);
                          bg = `rgba(249, 115, 22, ${0.15 + intensity * 0.8})`;
                        } else if (val < -10) {
                          const intensity = Math.min(1, Math.abs(val) / 100);
                          bg = `rgba(14, 165, 233, ${0.15 + intensity * 0.8})`;
                        }

                        return (
                          <div
                            key={`${i}-${j}`}
                            style={{ backgroundColor: bg }}
                            onMouseEnter={() =>
                              setSurfaceHoverCell({ xVal, yVal, zVal: val })
                            }
                            onMouseLeave={() => setSurfaceHoverCell(null)}
                            className={`aspect-square rounded-xs cursor-pointer transition-all hover:scale-125 hover:z-20 relative ${
                              isClosest ? "ring-2 ring-blue-600 ring-offset-1 z-10 animate-pulse" : ""
                            }`}
                          />
                        );
                      })
                    )}
                  </div>

                  <div className="flex justify-between text-[11px] font-bold text-slate-500 pt-2 border-t border-slate-200">
                    <span>◀ Too Hot (-5.0°C)</span>
                    <span className="text-slate-800 font-extrabold uppercase">Temperature Error (Target − Room)</span>
                    <span>Too Cold (+5.0°C) ▶</span>
                  </div>
                </div>
              </div>

              {/* Inspector Card */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <span className="text-slate-500 font-medium">Inspected Operating Point:</span>
                  <div className="font-bold text-slate-900 text-sm mt-0.5">
                    {surfaceHoverCell ? (
                      <span>
                        Error: {surfaceHoverCell.xVal.toFixed(1)}°C | Rate: {surfaceHoverCell.yVal.toFixed(2)}°C/min → Power:{" "}
                        <strong className={surfaceHoverCell.zVal >= 0 ? "text-orange-600" : "text-sky-600"}>
                          {surfaceHoverCell.zVal > 0 ? `+${surfaceHoverCell.zVal.toFixed(1)}%` : `${surfaceHoverCell.zVal.toFixed(1)}%`}
                        </strong>
                      </span>
                    ) : (
                      <span>
                        Current Room State: Error: {error > 0 ? `+${error}` : error}°C | Rate: {derror > 0 ? `+${derror}` : derror}°C/min → Output:{" "}
                        <strong className={crispPower >= 0 ? "text-orange-600" : "text-sky-600"}>
                          {crispPower > 0 ? `+${crispPower.toFixed(1)}%` : `${crispPower.toFixed(1)}%`}
                        </strong>
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-[11px] text-slate-500">
                  Fixed Ambient: <strong>{ambient}°C</strong> | Occupancy: <strong>{occupancy}</strong>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-400 text-xs">
              Loading 3D control surface mesh...
            </div>
          )}
        </div>
      )}

      {/* TAB 5: SELF-TUNING DEADBAND */}
      {activeTab === "adaptation" && (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">Self-Tuning Comfort Deadband</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Automatically adapts the fuzzy deadband width based on building thermal inertia (insulation, envelope capacitance).
              </p>
            </div>
            <button
              onClick={handleAdaptDeadband}
              disabled={adapting}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-xs transition-all disabled:opacity-50"
            >
              {adapting ? "Calibrating..." : "Auto-Tune Envelope"}
            </button>
          </div>

          <div className="space-y-2 max-w-md">
            <div className="flex justify-between text-xs font-bold text-slate-800">
              <span>Building Thermal Inertia Factor</span>
              <span>{inertiaFactor.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="1.5"
              step="0.05"
              value={inertiaFactor}
              onChange={(e) => setInertiaFactor(parseFloat(e.target.value))}
              className="w-full accent-blue-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-bold">
              <span>0.5 (Lightweight Wood Frame)</span>
              <span>1.0 (Standard Brick)</span>
              <span>1.5 (High-Mass Concrete)</span>
            </div>
          </div>

          {adaptationRecord && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-1">
              <span className="font-bold block">Envelope Adaptation Calibrated:</span>
              <p>
                Adjusted error deadband to ±{adaptationRecord.new_deadband_deg?.toFixed(2) ?? "0.35"}°C. Compressor short-cycling reduced by {adaptationRecord.short_cycle_reduction_pct ?? 18}%.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FuzzyStudioView;
