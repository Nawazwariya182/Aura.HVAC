"use client";

import React, { useState } from "react";
import { Sun, CloudSnow, Flame, X, Check } from "lucide-react";
import { updateEnvironment } from "@/lib/api";

interface WeatherModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAmbient: number;
  currentSolar: number;
  onUpdated: (amb: number, sol: number) => void;
}

export const WeatherModal: React.FC<WeatherModalProps> = ({
  isOpen,
  onClose,
  currentAmbient,
  currentSolar,
  onUpdated,
}) => {
  const [ambient, setAmbient] = useState<number>(currentAmbient);
  const [solar, setSolar] = useState<number>(currentSolar);

  if (!isOpen) return null;

  const presets = [
    { label: "Freezing Blizzard", temp: -4.0, solar: 80, icon: <CloudSnow className="w-5 h-5 text-sky-500" /> },
    { label: "Cool Autumn", temp: 12.0, solar: 300, icon: <Sun className="w-5 h-5 text-amber-500" /> },
    { label: "Mild Spring Day", temp: 20.0, solar: 500, icon: <Sun className="w-5 h-5 text-emerald-500" /> },
    { label: "Scorching Heatwave", temp: 37.0, solar: 850, icon: <Flame className="w-5 h-5 text-rose-500" /> },
  ];

  const handleApply = async () => {
    try {
      await updateEnvironment({ ambient_temp: ambient, solar_irradiance: solar });
      onUpdated(ambient, solar);
      onClose();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="relative w-full max-w-md p-6 rounded-3xl bg-white border border-slate-200 shadow-2xl space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Sun className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Outside Weather & Season</h3>
              <p className="text-xs text-slate-500">Test how your home reacts to outdoor conditions</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Presets */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Click a Weather Scenario
          </span>
          <div className="grid grid-cols-2 gap-2">
            {presets.map((p) => (
              <button
                key={p.label}
                onClick={() => {
                  setAmbient(p.temp);
                  setSolar(p.solar);
                }}
                className={`flex items-center gap-2.5 p-3 rounded-2xl border text-left transition-all ${
                  ambient === p.temp
                    ? "bg-sky-50 border-sky-300 ring-2 ring-sky-100"
                    : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                }`}
              >
                {p.icon}
                <div>
                  <div className="font-bold text-slate-800 text-xs">{p.label}</div>
                  <div className="text-[11px] text-slate-500">{p.temp}°C outdoor</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Sliders */}
        <div className="space-y-4 pt-1">
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-700">Outside Temperature</span>
              <span className="font-bold text-amber-700 text-sm">{ambient.toFixed(1)}°C</span>
            </div>
            <input
              type="range"
              min="-10.0"
              max="45.0"
              step="0.5"
              value={ambient}
              onChange={(e) => setAmbient(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-700">Sunlight / Solar Radiation</span>
              <span className="font-bold text-sky-700 text-sm">{solar.toFixed(0)} W/m²</span>
            </div>
            <input
              type="range"
              min="0"
              max="1000"
              step="50"
              value={solar}
              onChange={(e) => setSolar(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 active:scale-95 text-white font-bold text-xs transition-all shadow-md"
          >
            <Check className="w-4 h-4" />
            <span>Apply Outdoor Weather</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default WeatherModal;
