"use client";

import React, { useState } from "react";
import { 
  AlertTriangle, 
  Snowflake, 
  SunMedium, 
  Flame, 
  ZapOff, 
  RotateCcw,
  ShieldAlert,
  CheckCircle2,
  Cpu
} from "lucide-react";
import { applyCrisisScenario } from "@/lib/api";

interface CrisisSandboxProps {
  currentScenario?: string;
  onScenarioApplied?: (scenarioId: string) => void;
}

export function CrisisSandbox({ currentScenario = "normal", onScenarioApplied }: CrisisSandboxProps) {
  const [activeScenario, setActiveScenario] = useState<string>(currentScenario);
  const [loading, setLoading] = useState<string | null>(null);

  const scenarios = [
    {
      id: "normal",
      name: "Mild Spring Baseline",
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" />,
      ambient: "16.0°C",
      tariff: "$0.18/kWh",
      tag: "Nominal",
      tagBg: "bg-emerald-50 text-emerald-700 border-emerald-200",
      description: "Standard equilibrium conditions. Rooftop solar generates 3.2 kW."
    },
    {
      id: "polar_vortex",
      name: "Polar Vortex Deep Freeze",
      icon: <Snowflake className="w-4 h-4 text-sky-600 animate-spin" />,
      ambient: "-12.0°C",
      tariff: "$0.24/kWh",
      tag: "Extreme Cold",
      tagBg: "bg-sky-50 text-sky-700 border-sky-200",
      description: "Severe envelope infiltration with open office window. Heat pump COP drops; fuzzy rules pre-heat."
    },
    {
      id: "heat_dome",
      name: "Summer Heat Dome",
      icon: <SunMedium className="w-4 h-4 text-amber-600 animate-pulse" />,
      ambient: "41.5°C",
      tariff: "$0.52/kWh",
      tag: "Peak Tariff",
      tagBg: "bg-amber-50 text-amber-700 border-amber-200",
      description: "High utility peak stress. Fuzzy tariff rule sheds non-essential cooling and maximizes solar self-consumption."
    },
    {
      id: "kitchen_flare",
      name: "Kitchen Stove Flare (+1.5kW)",
      icon: <Flame className="w-4 h-4 text-red-600 animate-bounce" />,
      ambient: "24.0°C",
      tariff: "$0.18/kWh",
      tag: "Thermal Surge",
      tagBg: "bg-red-50 text-red-700 border-red-200",
      description: "Commercial range burner injects localized heat. Convective airflow diffuses heat across open lounge doorway."
    },
    {
      id: "brownout_cap",
      name: "Grid Brownout / Demand Response",
      icon: <ZapOff className="w-4 h-4 text-violet-600" />,
      ambient: "34.0°C",
      tariff: "$0.44/kWh",
      tag: "Grid Curtailment",
      tagBg: "bg-violet-50 text-violet-700 border-violet-200",
      description: "Utility initiates emergency power curtailment. Fuzzy logic prioritizes occupied master bedroom over empty rooms."
    }
  ];

  const handleSelectScenario = async (scenarioId: string) => {
    setLoading(scenarioId);
    try {
      await applyCrisisScenario(scenarioId);
      setActiveScenario(scenarioId);
      if (onScenarioApplied) onScenarioApplied(scenarioId);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 sm:p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 mb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-900">
              Cyber-Physical Stress &amp; Crisis Test Suite
            </h4>
            <p className="text-xs text-slate-500">
              Inject multi-variable boundary disturbances into the live thermodynamic differential equation engine.
            </p>
          </div>
        </div>

        <button
          onClick={() => handleSelectScenario("normal")}
          disabled={loading !== null || activeScenario === "normal"}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 rounded-lg transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset to Normal Baseline</span>
        </button>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {scenarios.map((sc) => {
          const isSelected = activeScenario === sc.id;
          return (
            <button
              key={sc.id}
              onClick={() => handleSelectScenario(sc.id)}
              disabled={loading !== null}
              className={`text-left p-3 rounded-xl border transition-all relative flex flex-col justify-between ${
                isSelected 
                  ? "bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-slate-900/20" 
                  : "bg-slate-50/70 hover:bg-white text-slate-800 border-slate-200/80 hover:border-slate-300"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-1.5 rounded-lg ${isSelected ? "bg-slate-800 text-white" : "bg-white shadow-xs"}`}>
                    {sc.icon}
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                    isSelected ? "bg-slate-800 text-slate-200 border-slate-700" : sc.tagBg
                  }`}>
                    {sc.tag}
                  </span>
                </div>

                <div className="text-xs font-semibold leading-snug">
                  {sc.name}
                </div>

                <p className={`text-[11px] mt-1 line-clamp-2 ${isSelected ? "text-slate-300" : "text-slate-500"}`}>
                  {sc.description}
                </p>
              </div>

              <div className={`mt-3 pt-2 border-t flex items-center justify-between text-[10px] ${
                isSelected ? "border-slate-800 text-slate-300" : "border-slate-200/70 text-slate-500"
              }`}>
                <span>Amb: <strong className={isSelected ? "text-white" : "text-slate-700"}>{sc.ambient}</strong></span>
                <span>Tariff: <strong className={isSelected ? "text-white" : "text-slate-700"}>{sc.tariff}</strong></span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
