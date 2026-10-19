"use client";

import React from "react";
import { 
  Home, 
  Cpu, 
  Activity, 
  Zap, 
  Sun, 
  RotateCcw, 
  Sparkles,
  Clock,
  BookOpen
} from "lucide-react";
import Image from "next/image";

interface NavbarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isConnected: boolean;
  simTimeFormatted: string;
  ambientTemp: number;
  totalKw: number;
  onReset: () => void;
  onToggleWeatherModal: () => void;
  onOpenTheoryModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  isConnected,
  simTimeFormatted,
  ambientTemp,
  onReset,
  onToggleWeatherModal,
  onOpenTheoryModal,
}) => {
  const tabs = [
    { id: "floorplan", label: "Home Twin", icon: <Home className="w-3.5 h-3.5" /> },
    { id: "fuzzy_studio", label: "Fuzzy Studio", icon: <Cpu className="w-3.5 h-3.5" /> },
    { id: "benchmark", label: "4-Way Arena", icon: <Zap className="w-3.5 h-3.5" /> },
    { id: "theory", label: "Theory", icon: <BookOpen className="w-3.5 h-3.5" /> },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-md shadow-xs font-departure">
      <div className="max-w-[1720px] w-full mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        {/* Left: Brand Identity, Live Status & Clock */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center justify-center w-11 h-11 rounded-xl  text-white shadow-xs overflow-hidden p-1">
            <Image src="/images/logo.png" alt="Logo" width={36} height={36} className="w-full h-full object-cover" />
          </div>

          <span className="text-base font-bold tracking-tight text-slate-900 font-departure">
            AURA<span className="text-blue-600">.HVAC</span>
          </span>

          {/* Live Status Pill */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200/90 text-emerald-700 text-xs font-medium font-departure">
            <span className={`w-2 h-2 rounded-full ${isConnected ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`} />
            <span>Live (2Hz)</span>
          </div>

          {/* Clock Pill */}
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold font-departure">
            <Clock className="w-3 h-3 text-slate-500" />
            <span>{simTimeFormatted || "03:01"}</span>
          </div>
        </div>

        {/* Center: Navigation Pill Bar */}
        <div className="hidden lg:flex items-center gap-1 p-1 bg-slate-100/80 border border-slate-200/80 rounded-xl font-departure">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  if (tab.id === "theory") {
                    onOpenTheoryModal();
                  } else {
                    onTabChange(tab.id);
                  }
                }}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all font-departure ${
                  isActive
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right: Weather Pill & Reset Button */}
        <div className="flex items-center gap-2 shrink-0 font-departure">
          <button
            onClick={onToggleWeatherModal}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50/70 hover:bg-amber-100 border border-amber-200/80 text-xs font-medium transition-all shadow-xs active:scale-95 font-departure"
            title="Click to view outdoor weather details"
          >
            <Sun className="w-4 h-4 text-amber-500 fill-amber-400" />
            <span className="font-bold text-slate-900">{ambientTemp.toFixed(1)}°C</span>
            <span className="text-[10px] text-slate-500 font-medium hidden sm:inline">Outside</span>
          </button>

          <button
            onClick={onReset}
            className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 transition-all shadow-xs active:scale-95"
            title="Reset simulation to default baseline"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mobile / Tablet Horizontal Tab Bar */}
      <div className="lg:hidden flex items-center justify-around border-t border-slate-200/80 px-2 py-1.5 bg-slate-50/90 overflow-x-auto font-departure">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                if (tab.id === "theory") {
                  onOpenTheoryModal();
                } else {
                  onTabChange(tab.id);
                }
              }}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg transition-all whitespace-nowrap font-departure ${
                isActive
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};

export default Navbar;
