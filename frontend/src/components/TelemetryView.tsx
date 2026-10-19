"use client";

import React, { useState, useEffect } from "react";
import { 
  Activity, 
  Zap, 
  Gauge, 
  TrendingUp, 
  CheckCircle2, 
  Thermometer,
  Clock
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
import { SimulationState } from "@/lib/api";
import { SpotlightCard } from "./react-bits/SpotlightCard";
import { AnimatedCounter } from "./react-bits/AnimatedCounter";

interface TelemetryViewProps {
  simState: SimulationState | null;
}

interface TelemetryPoint {
  time: string;
  living_temp: number;
  bedroom_temp: number;
  kitchen_temp: number;
  office_temp: number;
  ambient_temp: number;
  living_power: number;
  total_kw: number;
}

export const TelemetryView: React.FC<TelemetryViewProps> = ({ simState }) => {
  const [history, setHistory] = useState<TelemetryPoint[]>([]);

  useEffect(() => {
    if (!simState) return;

    const z = simState.zones;
    if (!z.living_room) return;

    const point: TelemetryPoint = {
      time: simState.sim_time_formatted || "00:00",
      living_temp: z.living_room.temperature,
      bedroom_temp: z.master_bedroom ? z.master_bedroom.temperature : 20,
      kitchen_temp: z.kitchen ? z.kitchen.temperature : 21,
      office_temp: z.office ? z.office.temperature : 22,
      ambient_temp: simState.ambient_temp,
      living_power: z.living_room.hvac_power_pct,
      total_kw: simState.total_electrical_kw,
    };

    setHistory((prev) => {
      const updated = [...prev, point];
      return updated.slice(-30);
    });
  }, [simState]);

  if (!simState) {
    return (
      <div className="p-12 text-center text-slate-400 font-sans text-sm bg-white rounded-2xl border border-slate-200">
        Connecting to live thermal sensor stream...
      </div>
    );
  }

  const zones = Object.values(simState.zones);
  const avgPmv = zones.reduce((acc, curr) => acc + curr.pmv, 0) / (zones.length || 1);
  const estCost = simState.total_energy_kwh * 0.16;

  return (
    <div className="space-y-6">
      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SpotlightCard className="p-5 bg-white border border-slate-200 shadow-soft">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Grid Power Draw
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-extrabold text-sky-700">
              <AnimatedCounter value={simState.total_electrical_kw} decimals={2} suffix=" kW" />
            </span>
            <Zap className="w-5 h-5 text-sky-500" />
          </div>
          <span className="text-xs text-slate-500 mt-1 block font-medium">All compressors & fans</span>
        </SpotlightCard>

        <SpotlightCard className="p-5 bg-white border border-slate-200 shadow-soft">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Total Energy Used
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-extrabold text-amber-700">
              <AnimatedCounter value={simState.total_energy_kwh} decimals={3} suffix=" kWh" />
            </span>
            <TrendingUp className="w-5 h-5 text-amber-500" />
          </div>
          <span className="text-xs text-slate-500 mt-1 block font-medium">Est. Cost: ${estCost.toFixed(2)}</span>
        </SpotlightCard>

        <SpotlightCard className="p-5 bg-white border border-slate-200 shadow-soft">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Comfort Index
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-extrabold text-emerald-700">
              {Math.abs(avgPmv) <= 0.5 ? "Optimal" : avgPmv > 0.5 ? "Warm" : "Cool"}
            </span>
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          </div>
          <span className="text-xs text-slate-500 mt-1 block font-medium">PMV: {avgPmv.toFixed(2)}</span>
        </SpotlightCard>

        <SpotlightCard className="p-5 bg-white border border-slate-200 shadow-soft">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Outdoor Weather
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-extrabold text-slate-800">
              {simState.ambient_temp.toFixed(1)}°C
            </span>
            <Thermometer className="w-5 h-5 text-amber-500" />
          </div>
          <span className="text-xs text-slate-500 mt-1 block font-medium">Ambient condition</span>
        </SpotlightCard>
      </div>

      {/* Main Temperature History Graph */}
      <SpotlightCard className="p-6 bg-white border border-slate-200 shadow-soft space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Activity className="w-4 h-4 text-sky-600" />
              <span>Real-Time Room Temperature Curves</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Watch temperatures across the house automatically stabilize around your chosen setpoints.
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            Live Stream Active
          </span>
        </div>

        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="time" stroke="#94a3b8" fontSize={11} />
              <YAxis domain={["auto", "auto"]} stroke="#94a3b8" fontSize={11} unit="°C" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#ffffff",
                  borderColor: "#e2e8f0",
                  borderRadius: "12px",
                  fontSize: "12px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
              <Line type="monotone" dataKey="living_temp" name="Living Room" stroke="#0284c7" strokeWidth={2.5} dot={false} isAnimationActive={false} />
              <Line type="monotone" dataKey="bedroom_temp" name="Bedroom" stroke="#8b5cf6" strokeWidth={2} dot={false} isAnimationActive={false} />
              <Line type="monotone" dataKey="kitchen_temp" name="Kitchen" stroke="#ea580c" strokeWidth={2} dot={false} isAnimationActive={false} />
              <Line type="monotone" dataKey="office_temp" name="Office" stroke="#10b981" strokeWidth={2} dot={false} isAnimationActive={false} />
              <Line type="monotone" dataKey="ambient_temp" name="Outside" stroke="#94a3b8" strokeDasharray="4 4" strokeWidth={1.5} dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </SpotlightCard>

      {/* Grid: Heater Output & Power */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Heater Output */}
        <SpotlightCard className="p-5 bg-white border border-slate-200 shadow-soft space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Living Room Heat Pump Output (%)
            </h4>
            <span className="text-xs font-semibold text-amber-600">Smooth throttling</span>
          </div>
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="time" stroke="#94a3b8" fontSize={10} />
                <YAxis domain={[-100, 100]} stroke="#94a3b8" fontSize={10} unit="%" />
                <Tooltip contentStyle={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0", borderRadius: "8px", fontSize: "11px" }} />
                <Line type="stepAfter" dataKey="living_power" name="Power %" stroke="#ea580c" strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </SpotlightCard>

        {/* Electricity Draw */}
        <SpotlightCard className="p-5 bg-white border border-slate-200 shadow-soft space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Total Household Electrical Power (kW)
            </h4>
            <span className="text-xs font-semibold text-sky-600">Inverters + Fans</span>
          </div>
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="time" stroke="#94a3b8" fontSize={10} />
                <YAxis stroke="#94a3b8" fontSize={10} unit=" kW" />
                <Tooltip contentStyle={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0", borderRadius: "8px", fontSize: "11px" }} />
                <Line type="monotone" dataKey="total_kw" name="Total kW" stroke="#0284c7" strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </SpotlightCard>
      </div>
    </div>
  );
};

export default TelemetryView;
