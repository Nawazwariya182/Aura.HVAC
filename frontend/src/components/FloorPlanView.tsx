"use client";

import React, { useState, useEffect } from "react";
import { 
  Users, 
  Wind, 
  Flame, 
  Snowflake, 
  Plus, 
  Minus, 
  CheckCircle2, 
  AlertTriangle,
  Zap,
  Sparkles,
  RotateCcw,
  DoorOpen,
  DoorClosed,
  Moon,
  Laptop,
  Soup,
  ArrowRightLeft,
  SlidersHorizontal,
  Grid3X3,
  Waves,
  Sun,
  Droplets,
  Layers,
  Activity,
  Cpu,
  Settings,
  ChevronDown,
  Bed,
  UtensilsCrossed,
  Armchair,
  Monitor,
  Check,
  ChevronRight,
  ShieldAlert,
  SunMedium,
  ZapOff,
  UserPlus
} from "lucide-react";
import { ZoneData, toggleDisturbance, toggleDoor, toggleCircadian, applyCrisisScenario } from "@/lib/api";
import { ThermalConvectionMap } from "./ThermalConvectionMap";

interface FloorPlanViewProps {
  zones: Record<string, ZoneData>;
  onUpdateZone: (zoneId: string, updates: Partial<ZoneData>) => void;
  circadianMode?: boolean;
  tariffPrice?: number;
  solarKw?: number;
  ambientTemp?: number;
  solarIrradiance?: number;
  onReset?: () => void;
}

const DEFAULT_ZONES: Record<string, ZoneData> = {
  living_room: {
    zone_id: "living_room",
    name: "Living Room & Lounge",
    volume_m3: 120.0,
    temperature: 18.1,
    setpoint: 22.0,
    error: 3.9,
    occupants: 2,
    internal_load_w: 150.0,
    window_open: false,
    door_open: true,
    hvac_power_pct: 74.0,
    fan_speed_pct: 75.0,
    thermal_power_kw: 3.7,
    electrical_power_kw: 1.05,
    total_energy_kwh: 0.28,
    cop: 3.8,
    pmv: -0.2,
    ppd: 6.0,
    damper_cfm: 362,
    co2_ppm: 1099,
    acoustic_dba: 43.2,
    total_cost_usd: 0.05
  },
  master_bedroom: {
    zone_id: "master_bedroom",
    name: "Master Bedroom",
    volume_m3: 75.0,
    temperature: 16.9,
    setpoint: 16.0,
    error: -0.9,
    occupants: 1,
    internal_load_w: 50.0,
    window_open: false,
    door_open: true,
    hvac_power_pct: -28.0,
    fan_speed_pct: 35.0,
    thermal_power_kw: -0.9,
    electrical_power_kw: 0.26,
    total_energy_kwh: 0.08,
    cop: 4.0,
    pmv: -0.1,
    ppd: 5.0,
    damper_cfm: 260,
    co2_ppm: 2400,
    acoustic_dba: 36.0,
    total_cost_usd: 0.015
  },
  kitchen: {
    zone_id: "kitchen",
    name: "Kitchen & Dining",
    volume_m3: 85.0,
    temperature: 16.4,
    setpoint: 16.0,
    error: -0.4,
    occupants: 1,
    internal_load_w: 200.0,
    window_open: false,
    door_open: true,
    hvac_power_pct: 63.0,
    fan_speed_pct: 25.0,
    thermal_power_kw: 2.39,
    electrical_power_kw: 0.65,
    total_energy_kwh: 0.14,
    cop: 3.9,
    pmv: 0.0,
    ppd: 5.0,
    damper_cfm: 199,
    co2_ppm: 415,
    acoustic_dba: 32.3,
    total_cost_usd: 0.025
  },
  office: {
    zone_id: "office",
    name: "Home Office",
    volume_m3: 50.0,
    temperature: 18.9,
    setpoint: 22.5,
    error: 3.6,
    occupants: 1,
    internal_load_w: 300.0,
    window_open: false,
    door_open: true,
    hvac_power_pct: 63.0,
    fan_speed_pct: 70.0,
    thermal_power_kw: 1.57,
    electrical_power_kw: 0.44,
    total_energy_kwh: 0.12,
    cop: 3.7,
    pmv: -0.3,
    ppd: 7.0,
    damper_cfm: 341,
    co2_ppm: 415,
    acoustic_dba: 41.6,
    total_cost_usd: 0.022
  }
};

export const FloorPlanView: React.FC<FloorPlanViewProps> = ({
  zones,
  onUpdateZone,
  circadianMode = false,
  ambientTemp = 12.5,
  solarIrradiance = 320,
  onReset
}) => {
  const effectiveZones = Object.keys(zones || {}).length > 0 ? zones : DEFAULT_ZONES;
  const [selectedZoneId, setSelectedZoneId] = useState<string>("master_bedroom");
  const [localCircadian, setLocalCircadian] = useState<boolean>(circadianMode);
  const [viewMode, setViewMode] = useState<"blueprint" | "thermal_flow">("blueprint");
  const [selectedConsoleTab, setSelectedConsoleTab] = useState<"control" | "sensors" | "fuzzy" | "settings">("control");
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [activeCrisis, setActiveCrisis] = useState<string>("normal");
  const [zoneHistories, setZoneHistories] = useState<Record<string, number[]>>({});

  useEffect(() => {
    setZoneHistories((prev) => {
      const next = { ...prev };
      Object.entries(effectiveZones).forEach(([id, z]) => {
        const existing = next[id] || [
          Number((z.temperature - 0.25).toFixed(2)),
          Number((z.temperature - 0.15).toFixed(2)),
          Number((z.temperature - 0.05).toFixed(2)),
          Number(z.temperature.toFixed(2))
        ];
        const updated = [...existing, Number(z.temperature.toFixed(2))];
        if (updated.length > 24) updated.shift();
        next[id] = updated;
      });
      return next;
    });
  }, [effectiveZones]);

  const activeZone = effectiveZones[selectedZoneId] || effectiveZones["master_bedroom"] || Object.values(effectiveZones)[0];

  // Disturbance Toggles
  const isStoveActive = Boolean(effectiveZones["kitchen"]?.disturbances?.["cooking_stove"]);
  const isPCActive = Boolean(effectiveZones["office"]?.disturbances?.["gaming_pc"]);
  const isPartyActive = Boolean(effectiveZones["living_room"]?.disturbances?.["party_group"]);

  const handleToggleStove = async () => {
    setActionLoading("stove");
    try {
      await toggleDisturbance({
        zone_id: "kitchen",
        disturbance_type: "cooking_stove",
        active: !isStoveActive,
        watts: 900.0
      });
      onUpdateZone("kitchen", {
        disturbances: !isStoveActive 
          ? { ...(effectiveZones["kitchen"]?.disturbances || {}), cooking_stove: 900 }
          : Object.fromEntries(Object.entries(effectiveZones["kitchen"]?.disturbances || {}).filter(([k]) => k !== "cooking_stove"))
      });
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(null);
    }
  };

  const handleTogglePC = async () => {
    setActionLoading("pc");
    try {
      await toggleDisturbance({
        zone_id: "office",
        disturbance_type: "gaming_pc",
        active: !isPCActive,
        watts: 450.0
      });
      onUpdateZone("office", {
        disturbances: !isPCActive 
          ? { ...(effectiveZones["office"]?.disturbances || {}), gaming_pc: 450 }
          : Object.fromEntries(Object.entries(effectiveZones["office"]?.disturbances || {}).filter(([k]) => k !== "gaming_pc"))
      });
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleParty = async () => {
    setActionLoading("party");
    try {
      await toggleDisturbance({
        zone_id: "living_room",
        disturbance_type: "party_group",
        active: !isPartyActive,
        watts: 400.0
      });
      onUpdateZone("living_room", {
        disturbances: !isPartyActive 
          ? { ...(effectiveZones["living_room"]?.disturbances || {}), party_group: 400 }
          : Object.fromEntries(Object.entries(effectiveZones["living_room"]?.disturbances || {}).filter(([k]) => k !== "party_group"))
      });
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleCircadian = async () => {
    const next = !localCircadian;
    setLocalCircadian(next);
    setActionLoading("circadian");
    try {
      await toggleCircadian(next);
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleDoor = async (zoneId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const target = effectiveZones[zoneId];
    if (!target) return;
    const nextState = !target.door_open;
    setActionLoading(`door_${zoneId}`);
    try {
      await toggleDoor({ zone_id: zoneId, open_state: nextState });
      onUpdateZone(zoneId, { door_open: nextState });
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleWindow = async (zoneId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const target = effectiveZones[zoneId];
    if (!target) return;
    const nextState = !target.window_open;
    onUpdateZone(zoneId, { window_open: nextState });
  };

  const handleApplyCrisis = async (scenarioId: string) => {
    setActiveCrisis(scenarioId);
    setActionLoading(scenarioId);
    try {
      await applyCrisisScenario(scenarioId);
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (zone: ZoneData) => {
    const diff = zone.setpoint - zone.temperature;
    if (Math.abs(diff) <= 0.4) {
      return {
        label: "Optimal",
        bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
        icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
      };
    }
    if (diff > 0.4) {
      return {
        label: `Heating (${Math.abs(zone.hvac_power_pct).toFixed(0)}%)`,
        bg: "bg-amber-50 text-amber-800 border-amber-200/90",
        icon: <Flame className="w-3.5 h-3.5 text-amber-600" />
      };
    }
    return {
      label: `Cooling (${Math.abs(zone.hvac_power_pct).toFixed(0)}%)`,
      bg: "bg-sky-50 text-sky-800 border-sky-200/90",
      icon: <Snowflake className="w-3.5 h-3.5 text-sky-600" />
    };
  };

  const getZoneIcon = (id: string) => {
    switch (id) {
      case "living_room": return <Armchair className="w-4 h-4 text-amber-700" />;
      case "master_bedroom": return <Bed className="w-4 h-4 text-blue-700" />;
      case "kitchen": return <UtensilsCrossed className="w-4 h-4 text-orange-700" />;
      case "office": return <Monitor className="w-4 h-4 text-amber-700" />;
      default: return <Bed className="w-4 h-4 text-slate-700" />;
    }
  };

  const getZoneIconBg = (id: string) => {
    switch (id) {
      case "living_room": return "bg-amber-100/80 border-amber-200";
      case "master_bedroom": return "bg-blue-100/80 border-blue-200";
      case "kitchen": return "bg-orange-100/80 border-orange-200";
      case "office": return "bg-amber-100/80 border-amber-200";
      default: return "bg-slate-100 border-slate-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. HERO BANNER: Your Home, Simulated in Real Time */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-50/70 via-white to-sky-50/50 border border-slate-200/90 p-6 sm:p-8 shadow-xs">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Left Text & Feature Badges */}
          <div className="lg:col-span-7 space-y-4">
            <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400 block font-departure">
              LIVE DIGITAL TWIN
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-title text-slate-900 tracking-wide leading-tight">
              Your Home, Simulated in{" "}
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Real Time
              </span>
            </h1>
            <p className="text-sm sm:text-base text-slate-600 max-w-xl font-medium leading-relaxed">
              A cyber-physical digital twin of a 4-zone residential house running real thermodynamics equations with fuzzy logic control.
            </p>

            {/* Feature Badges Row */}
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                4 Zones
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold">
                <Activity className="w-3.5 h-3.5 text-blue-600" />
                2Hz Live Data
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-xs font-bold">
                <Cpu className="w-3.5 h-3.5 text-purple-600" />
                Fuzzy Logic Control
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-50 text-pink-700 border border-pink-200 text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5 text-pink-600" />
                Real Physics
              </span>
            </div>
          </div>

          {/* Right: Modern House Hero Graphic with Weather Widget */}
          <div className="lg:col-span-5 relative flex items-center justify-center">
            <div className="relative w-full max-w-md rounded-2xl overflow-hidden border border-slate-200/80 shadow-md group">
              <img
                src="/images/hero.jpg"
                alt="Modern Smart Home Digital Twin"
                className="w-full h-52 sm:h-56 object-cover object-center transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/30 via-transparent to-transparent pointer-events-none" />

              {/* Floating Weather Overlay Widget */}
              <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl p-3 shadow-lg max-w-[175px]">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                    <Sun className="w-5 h-5 text-amber-500 fill-amber-400 animate-spin-slow" />
                  </div>
                  <div>
                    <span className="text-[9px] font-bold uppercase text-slate-400 block tracking-wider leading-none">
                      Outdoor Weather
                    </span>
                    <span className="text-base font-black text-slate-900 leading-tight">
                      {ambientTemp.toFixed(1)}°C
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium block">
                      Clear Sky
                    </span>
                  </div>
                </div>

                <div className="mt-2.5 pt-2 border-t border-slate-100 text-[10px] text-slate-600 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Wind className="w-3 h-3 text-sky-500" /> Wind
                    </span>
                    <span className="font-bold text-slate-800">8 km/h</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Droplets className="w-3 h-3 text-blue-500" /> Humidity
                    </span>
                    <span className="font-bold text-slate-800">42%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Sun className="w-3 h-3 text-amber-500" /> Solar
                    </span>
                    <span className="font-bold text-slate-800">{solarIrradiance.toFixed(0)} W/m²</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. CYBER-PHYSICAL DISTURBANCE DOCK */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600 shrink-0">
              <ShieldAlert className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-title text-slate-900 tracking-wide">
                Cyber-Physical Disturbance Dock
              </h2>
              <p className="text-xs text-slate-500">
                Inject authentic thermal disturbances to see how the fuzzy logic engine compensates in real time.
              </p>
            </div>
          </div>

          {onReset && (
            <button
              onClick={onReset}
              className="text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all self-end sm:self-auto"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset to Baseline</span>
            </button>
          )}
        </div>

        {/* 4 Disturbance Cards in a Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Stove */}
          <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:border-slate-300 transition-all shadow-2xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-red-50 border border-red-200 flex items-center justify-center text-red-600 shrink-0">
                <Soup className="w-4 h-4 text-red-500" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 block leading-tight">
                  Stove (+900W)
                </span>
                <span className="text-[10px] text-slate-500">Kitchen heat source</span>
              </div>
            </div>

            <button
              onClick={handleToggleStove}
              disabled={actionLoading === "stove"}
              className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                isStoveActive ? "bg-blue-600" : "bg-slate-300"
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full bg-white block shadow-xs transition-transform ${
                  isStoveActive ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Gaming PC */}
          <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:border-slate-300 transition-all shadow-2xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
                <Laptop className="w-4 h-4 text-blue-500" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 block leading-tight">
                  Gaming PC (+450W)
                </span>
                <span className="text-[10px] text-slate-500">Office equipment load</span>
              </div>
            </div>

            <button
              onClick={handleTogglePC}
              disabled={actionLoading === "pc"}
              className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                isPCActive ? "bg-blue-600" : "bg-slate-300"
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full bg-white block shadow-xs transition-transform ${
                  isPCActive ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Party */}
          <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:border-slate-300 transition-all shadow-2xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-pink-50 border border-pink-200 flex items-center justify-center text-pink-600 shrink-0">
                <Users className="w-4 h-4 text-pink-500" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 block leading-tight">
                  Party (+400W)
                </span>
                <span className="text-[10px] text-slate-500">Extra occupancy heat</span>
              </div>
            </div>

            <button
              onClick={handleToggleParty}
              disabled={actionLoading === "party"}
              className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                isPartyActive ? "bg-blue-600" : "bg-slate-300"
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full bg-white block shadow-xs transition-transform ${
                  isPartyActive ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Circadian Wave */}
          <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:border-slate-300 transition-all shadow-2xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600 shrink-0">
                <Moon className="w-4 h-4 text-purple-500" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 block leading-tight">
                  Circadian Wave
                </span>
                <span className="text-[10px] text-slate-500">Sleep schedule mode</span>
              </div>
            </div>

            <button
              onClick={handleToggleCircadian}
              disabled={actionLoading === "circadian"}
              className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                localCircadian ? "bg-blue-600" : "bg-slate-300"
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full bg-white block shadow-xs transition-transform ${
                  localCircadian ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* 3. CRISIS TEST SUITE */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4 sm:p-5 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <h3 className="text-base font-title text-slate-900 tracking-wide">
              Crisis Test Suite
            </h3>
            <p className="text-xs text-slate-500">
              Inject extreme environmental conditions into the live simulation.
            </p>
          </div>
        </div>

        {/* 5 Crisis Buttons */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          <button
            onClick={() => handleApplyCrisis("normal")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
              activeCrisis === "normal"
                ? "bg-emerald-50 text-emerald-800 border-emerald-300 ring-2 ring-emerald-200"
                : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <div className="text-left leading-none">
              <span className="block text-[11px] font-bold">Mild Spring</span>
              <span className="text-[9px] text-slate-500 font-semibold">Baseline</span>
            </div>
          </button>

          <button
            onClick={() => handleApplyCrisis("polar_vortex")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
              activeCrisis === "polar_vortex"
                ? "bg-sky-50 text-sky-800 border-sky-300 ring-2 ring-sky-200"
                : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
            }`}
          >
            <Snowflake className="w-3.5 h-3.5 text-sky-600" />
            <div className="text-left leading-none">
              <span className="block text-[11px] font-bold">Polar Vortex</span>
              <span className="text-[9px] text-slate-500 font-semibold">-12.0°C</span>
            </div>
          </button>

          <button
            onClick={() => handleApplyCrisis("heat_dome")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
              activeCrisis === "heat_dome"
                ? "bg-amber-50 text-amber-800 border-amber-300 ring-2 ring-amber-200"
                : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
            }`}
          >
            <SunMedium className="w-3.5 h-3.5 text-amber-600" />
            <div className="text-left leading-none">
              <span className="block text-[11px] font-bold">Summer Heat Dome</span>
              <span className="text-[9px] text-slate-500 font-semibold">+41.5°C</span>
            </div>
          </button>

          <button
            onClick={() => handleApplyCrisis("kitchen_flare")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
              activeCrisis === "kitchen_flare"
                ? "bg-red-50 text-red-800 border-red-300 ring-2 ring-red-200"
                : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-red-600" />
            <div className="text-left leading-none">
              <span className="block text-[11px] font-bold">Thermal Surge</span>
              <span className="text-[9px] text-slate-500 font-semibold">Rapid Heating</span>
            </div>
          </button>

          <button
            onClick={() => handleApplyCrisis("brownout_cap")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
              activeCrisis === "brownout_cap"
                ? "bg-purple-50 text-purple-800 border-purple-300 ring-2 ring-purple-200"
                : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
            }`}
          >
            <ZapOff className="w-3.5 h-3.5 text-purple-600" />
            <div className="text-left leading-none">
              <span className="block text-[11px] font-bold">Grid Brownout</span>
              <span className="text-[9px] text-slate-500 font-semibold">Demand Response</span>
            </div>
          </button>
        </div>
      </div>

      {/* 4. MAIN LAYOUT: Architectural Floor Plan (Left) + Zone Control Console (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: 3D Architectural Blueprint Canvas & Summary Cards */}
        <div className="lg:col-span-8 space-y-4">
          {/* Header Switch: Blueprint Matrix vs 2D Thermal Convection */}
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center p-1 bg-slate-100/90 rounded-xl border border-slate-200/80 shadow-2xs">
              <button
                onClick={() => setViewMode("blueprint")}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all ${
                  viewMode === "blueprint"
                    ? "bg-white text-blue-600 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Grid3X3 className="w-3.5 h-3.5" />
                <span>Blueprint Matrix</span>
              </button>

              <button
                onClick={() => setViewMode("thermal_flow")}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all ${
                  viewMode === "thermal_flow"
                    ? "bg-white text-blue-600 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Waves className="w-3.5 h-3.5" />
                <span>2D Thermal Convection</span>
              </button>
            </div>
          </div>

          {/* Interactive 3D Architectural Canvas */}
          {viewMode === "thermal_flow" ? (
            <ThermalConvectionMap
              zones={effectiveZones}
              selectedZoneId={selectedZoneId}
              onSelectZone={setSelectedZoneId}
              onToggleDoor={handleToggleDoor}
            />
          ) : (
            <div className="relative rounded-3xl overflow-hidden border border-slate-200/90 shadow-md bg-slate-900/5 aspect-[16/11] sm:aspect-[16/9.5] w-full select-none">
              {/* Photorealistic 3D Top-Down Cutaway Floorplan Render */}
              <img
                src="/images/house_floorplan_topdown.png"
                alt="Architectural 3D Floorplan"
                className="w-full h-full object-cover object-center pointer-events-none"
              />

              {/* Convective Heat Diffusion Arrows Overlay */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" viewBox="0 0 1000 600">
                <defs>
                  <linearGradient id="warmHeatGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#f97316" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="#fbbf24" stopOpacity="0.7" />
                  </linearGradient>
                  <linearGradient id="coolHeatGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="#818cf8" stopOpacity="0.7" />
                  </linearGradient>
                </defs>

                {/* Animated Curved Flow: Kitchen <-> Living Room */}
                {effectiveZones["kitchen"]?.door_open && (
                  <path
                    d="M 360 230 C 440 220, 460 250, 520 250"
                    fill="none"
                    stroke="url(#warmHeatGradient)"
                    strokeWidth="4"
                    strokeDasharray="6 4"
                    className="animate-pulse"
                  />
                )}

                {/* Animated Curved Flow: Living Room <-> Hallway <-> Bedroom */}
                {effectiveZones["master_bedroom"]?.door_open && (
                  <path
                    d="M 520 310 C 470 340, 480 400, 520 420"
                    fill="none"
                    stroke="url(#coolHeatGradient)"
                    strokeWidth="4"
                    strokeDasharray="6 4"
                    className="animate-pulse"
                  />
                )}

                {/* Animated Curved Flow: Hallway <-> Office */}
                {effectiveZones["office"]?.door_open && (
                  <path
                    d="M 450 360 C 410 390, 380 400, 360 410"
                    fill="none"
                    stroke="url(#coolHeatGradient)"
                    strokeWidth="3.5"
                    strokeDasharray="6 4"
                  />
                )}
              </svg>

              {/* 4 Interactive Floating Zone Cards positioned over the 4 rooms */}
              {/* 1. TOP-LEFT: Kitchen & Dining */}
              {(() => {
                const z = effectiveZones["kitchen"];
                const badge = getStatusBadge(z);
                const isSelected = selectedZoneId === "kitchen";
                return (
                  <div
                    onClick={() => setSelectedZoneId("kitchen")}
                    className={`absolute top-[6%] left-[4%] w-[42%] max-w-[230px] rounded-2xl bg-white/95 backdrop-blur-md p-3 border cursor-pointer transition-all duration-300 shadow-md ${
                      isSelected ? "border-blue-500 ring-2 ring-blue-400 shadow-lg scale-[1.02]" : "border-slate-200/90 hover:border-slate-300 hover:shadow-lg"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <UtensilsCrossed className="w-3.5 h-3.5 text-orange-600" />
                        <span className="text-[11px] font-bold text-slate-900 leading-none">Kitchen & Dining</span>
                      </div>
                    </div>
                    <div className="mb-2">
                      <span className={`inline-flex items-center gap-1 text-[9px] font-extrabold px-2 py-0.5 rounded-full border ${badge.bg}`}>
                        {badge.icon}
                        {badge.label}
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between">
                      <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                        {z.temperature.toFixed(1)}°C
                      </span>
                      <span className="text-xs text-slate-400 font-bold flex items-center gap-1">
                        ❖ {z.setpoint.toFixed(1)}°C
                      </span>
                    </div>
                    <div className="mt-1 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500 font-medium">
                      <span>{z.damper_cfm ?? 199} CFM</span>
                      <span className="text-emerald-700 font-bold">{z.co2_ppm ?? 415} ppm</span>
                    </div>
                  </div>
                );
              })()}

              {/* 2. TOP-RIGHT: Living Room & Lounge */}
              {(() => {
                const z = effectiveZones["living_room"];
                const badge = getStatusBadge(z);
                const isSelected = selectedZoneId === "living_room";
                return (
                  <div
                    onClick={() => setSelectedZoneId("living_room")}
                    className={`absolute top-[6%] right-[4%] w-[42%] max-w-[230px] rounded-2xl bg-white/95 backdrop-blur-md p-3 border cursor-pointer transition-all duration-300 shadow-md ${
                      isSelected ? "border-blue-500 ring-2 ring-blue-400 shadow-lg scale-[1.02]" : "border-slate-200/90 hover:border-slate-300 hover:shadow-lg"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <Armchair className="w-3.5 h-3.5 text-amber-700" />
                        <span className="text-[11px] font-bold text-slate-900 leading-none">Living Room & Lounge</span>
                      </div>
                    </div>
                    <div className="mb-2">
                      <span className={`inline-flex items-center gap-1 text-[9px] font-extrabold px-2 py-0.5 rounded-full border ${badge.bg}`}>
                        {badge.icon}
                        {badge.label}
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between">
                      <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                        {z.temperature.toFixed(1)}°C
                      </span>
                      <span className="text-xs text-slate-400 font-bold flex items-center gap-1">
                        ❖ {z.setpoint.toFixed(1)}°C
                      </span>
                    </div>
                    <div className="mt-1 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500 font-medium">
                      <span>{z.damper_cfm ?? 362} CFM</span>
                      <span className="text-amber-700 font-bold">{z.co2_ppm ?? 1099} ppm</span>
                    </div>
                  </div>
                );
              })()}

              {/* 3. BOTTOM-LEFT: Home Office */}
              {(() => {
                const z = effectiveZones["office"];
                const badge = getStatusBadge(z);
                const isSelected = selectedZoneId === "office";
                return (
                  <div
                    onClick={() => setSelectedZoneId("office")}
                    className={`absolute bottom-[6%] left-[4%] w-[42%] max-w-[230px] rounded-2xl bg-white/95 backdrop-blur-md p-3 border cursor-pointer transition-all duration-300 shadow-md ${
                      isSelected ? "border-blue-500 ring-2 ring-blue-400 shadow-lg scale-[1.02]" : "border-slate-200/90 hover:border-slate-300 hover:shadow-lg"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <Monitor className="w-3.5 h-3.5 text-amber-600" />
                        <span className="text-[11px] font-bold text-slate-900 leading-none">Home Office</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                    <div className="mb-2">
                      <span className={`inline-flex items-center gap-1 text-[9px] font-extrabold px-2 py-0.5 rounded-full border ${badge.bg}`}>
                        {badge.icon}
                        {badge.label}
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between">
                      <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                        {z.temperature.toFixed(1)}°C
                      </span>
                      <span className="text-xs text-slate-400 font-bold flex items-center gap-1">
                        ❖ {z.setpoint.toFixed(1)}°C
                      </span>
                    </div>
                    <div className="mt-1 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500 font-medium">
                      <span>{z.damper_cfm ?? 341} CFM</span>
                      <span className="text-emerald-700 font-bold">{z.co2_ppm ?? 415} ppm</span>
                    </div>
                  </div>
                );
              })()}

              {/* 4. BOTTOM-RIGHT: Master Bedroom */}
              {(() => {
                const z = effectiveZones["master_bedroom"];
                const badge = getStatusBadge(z);
                const isSelected = selectedZoneId === "master_bedroom";
                return (
                  <div
                    onClick={() => setSelectedZoneId("master_bedroom")}
                    className={`absolute bottom-[6%] right-[4%] w-[42%] max-w-[230px] rounded-2xl bg-white/95 backdrop-blur-md p-3 border cursor-pointer transition-all duration-300 shadow-md ${
                      isSelected ? "border-blue-500 ring-2 ring-blue-400 shadow-lg scale-[1.02]" : "border-slate-200/90 hover:border-slate-300 hover:shadow-lg"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <Bed className="w-3.5 h-3.5 text-blue-600" />
                        <span className="text-[11px] font-bold text-slate-900 leading-none">Master Bedroom</span>
                      </div>
                    </div>
                    <div className="mb-2">
                      <span className={`inline-flex items-center gap-1 text-[9px] font-extrabold px-2 py-0.5 rounded-full border ${badge.bg}`}>
                        {badge.icon}
                        {badge.label}
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between">
                      <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                        {z.temperature.toFixed(1)}°C
                      </span>
                      <span className="text-xs text-slate-400 font-bold flex items-center gap-1">
                        ❖ {z.setpoint.toFixed(1)}°C
                      </span>
                    </div>
                    <div className="mt-1 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500 font-medium">
                      <span>{z.damper_cfm ?? 260} CFM</span>
                      <span className="text-red-700 font-bold">{z.co2_ppm ?? 2400} ppm</span>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Underneath Floorplan Canvas: 4 Zone Summary Cards with Micro Sparklines */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { id: "living_room", name: "Living Room & Lounge", icon: <Armchair className="w-4 h-4 text-amber-700" />, iconBg: "bg-amber-100", stroke: "#f59e0b" },
              { id: "master_bedroom", name: "Master Bedroom", icon: <Bed className="w-4 h-4 text-blue-700" />, iconBg: "bg-blue-100", stroke: "#3b82f6" },
              { id: "kitchen", name: "Kitchen & Dining", icon: <UtensilsCrossed className="w-4 h-4 text-orange-700" />, iconBg: "bg-orange-100", stroke: "#f97316" },
              { id: "office", name: "Home Office", icon: <Monitor className="w-4 h-4 text-amber-700" />, iconBg: "bg-amber-100", stroke: "#f59e0b" },
            ].map((room) => {
              const z = effectiveZones[room.id];
              const isSelected = selectedZoneId === room.id;
              const diff = z.setpoint - z.temperature;
              const isHeat = diff > 0.4;
              return (
                <div
                  key={room.id}
                  onClick={() => setSelectedZoneId(room.id)}
                  className={`p-3.5 rounded-2xl border bg-white cursor-pointer transition-all shadow-2xs hover:shadow-xs ${
                    isSelected ? "border-blue-500 ring-2 ring-blue-100" : "border-slate-200/90 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-7 h-7 rounded-lg ${room.iconBg} flex items-center justify-center shrink-0`}>
                      {room.icon}
                    </div>
                    <div className="overflow-hidden">
                      <span className="text-[11px] font-bold text-slate-900 block truncate">
                        {room.name}
                      </span>
                      <span className="text-[9px] font-bold text-slate-500 flex items-center gap-1">
                        {isHeat ? <Flame className="w-2.5 h-2.5 text-amber-500" /> : <Snowflake className="w-2.5 h-2.5 text-sky-500" />}
                        {isHeat ? "Heating" : "Cooling"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-baseline gap-1.5 mb-1.5">
                    <span className="text-lg font-black text-slate-900">
                      {z.temperature.toFixed(1)}°C
                    </span>
                    <span className="text-xs text-slate-400 font-semibold">
                      / {z.setpoint.toFixed(1)}°C
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 mb-2 font-medium">
                    <span>{z.damper_cfm ?? 250} CFM</span>
                    <span>{z.co2_ppm ?? 430} ppm</span>
                    <span>{z.acoustic_dba ?? 35} dBA</span>
                  </div>

                  {/* Dynamic Live Temperature Sparkline Graph */}
                  {(() => {
                    const history = zoneHistories[z.zone_id] || [z.temperature - 0.2, z.temperature - 0.1, z.temperature];
                    const minVal = Math.min(...history, z.setpoint - 0.8);
                    const maxVal = Math.max(...history, z.setpoint + 0.8);
                    const range = Math.max(0.5, maxVal - minVal);
                    const pts = history.map((val, idx) => {
                      const x = (idx / Math.max(1, history.length - 1)) * 92 + 4;
                      const y = 17 - ((val - minVal) / range) * 13;
                      return { x, y, val };
                    });
                    const lastPt = pts[pts.length - 1] || { x: 96, y: 10 };
                    const pathD = pts.reduce((acc, pt, idx) => `${acc} ${idx === 0 ? "M" : "L"} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`, "");
                    const areaD = `${pathD} L ${lastPt.x.toFixed(1)} 20 L ${pts[0]?.x.toFixed(1) || 4} 20 Z`;
                    const delta = history.length > 1 ? (history[history.length - 1] - history[0]) : 0;
                    const trendText = Math.abs(delta) < 0.05 ? "Steady" : delta > 0 ? `+${delta.toFixed(1)}°C` : `${delta.toFixed(1)}°C`;

                    return (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[9px] text-slate-400 font-semibold">
                          <span>Live Thermal History</span>
                          <span className={delta > 0.05 ? "text-amber-600 font-bold" : delta < -0.05 ? "text-sky-600 font-bold" : "text-emerald-600 font-bold"}>
                            {trendText}
                          </span>
                        </div>
                        <div className="relative w-full h-5 overflow-visible">
                          <svg className="w-full h-full overflow-visible" viewBox="0 0 100 20" preserveAspectRatio="none">
                            <defs>
                              <linearGradient id={`sparkGrad-${z.zone_id}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={room.stroke} stopOpacity="0.25" />
                                <stop offset="100%" stopColor={room.stroke} stopOpacity="0.0" />
                              </linearGradient>
                            </defs>
                            <path d={areaD} fill={`url(#sparkGrad-${z.zone_id})`} />
                            <path
                              d={pathD}
                              fill="none"
                              stroke={room.stroke}
                              strokeWidth="1.75"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                            <circle cx={lastPt.x} cy={lastPt.y} r="2" fill={room.stroke} />
                            <circle cx={lastPt.x} cy={lastPt.y} r="3.5" fill="none" stroke={room.stroke} strokeWidth="1" className="animate-ping opacity-60" />
                          </svg>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT COLUMN: Zone Control Console & Quick Actions */}
        <div className="lg:col-span-4 space-y-4">
          {/* Card 1: Zone Control Console */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-5 space-y-5">
            <h3 className="text-base font-title text-slate-900 tracking-wide">
              Zone Control Console
            </h3>

            {/* Room Selector Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200/90 text-left hover:bg-slate-100/70 transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center border ${getZoneIconBg(activeZone.zone_id)}`}>
                    {getZoneIcon(activeZone.zone_id)}
                  </div>
                  <span className="text-sm font-bold text-slate-900">
                    {activeZone.name}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Active
                  </span>
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </div>
              </button>

              {/* Dropdown Options */}
              {isDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 z-30 bg-white border border-slate-200 rounded-2xl shadow-lg p-1 space-y-0.5">
                  {Object.values(effectiveZones).map((z) => (
                    <button
                      key={z.zone_id}
                      onClick={() => {
                        setSelectedZoneId(z.zone_id);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left text-xs font-bold transition-all ${
                        selectedZoneId === z.zone_id ? "bg-blue-50 text-blue-700" : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {getZoneIcon(z.zone_id)}
                        <span>{z.name}</span>
                      </div>
                      {selectedZoneId === z.zone_id && <Check className="w-4 h-4 text-blue-600" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Sub-Navigation Tabs: Control | Sensors | Fuzzy AI | Settings */}
            <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100/90 rounded-xl border border-slate-200/80 text-center">
              {[
                { id: "control", label: "Control" },
                { id: "sensors", label: "Sensors" },
                { id: "fuzzy", label: "Fuzzy AI" },
                { id: "settings", label: "Settings" },
              ].map((subTab) => (
                <button
                  key={subTab.id}
                  onClick={() => setSelectedConsoleTab(subTab.id as any)}
                  className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                    selectedConsoleTab === subTab.id
                      ? "bg-blue-600 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {subTab.label}
                </button>
              ))}
            </div>

            {/* Sub-Tab Content: CONTROL (Default) */}
            {selectedConsoleTab === "control" && (
              <div className="space-y-4">
                {/* Temperature Control Box */}
                <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                    Temperature Control
                  </span>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                        <Activity className="w-4 h-4" />
                      </div>
                      <span className="text-3xl font-black text-slate-900 tracking-tight">
                        {activeZone.setpoint.toFixed(1)}°C
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => onUpdateZone(activeZone.zone_id, { setpoint: activeZone.setpoint - 0.5 })}
                        className="w-8 h-8 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 flex items-center justify-center font-bold text-base active:scale-95 transition-all shadow-2xs"
                        title="Decrease by 0.5°C"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => onUpdateZone(activeZone.zone_id, { setpoint: activeZone.setpoint + 0.5 })}
                        className="w-8 h-8 rounded-xl bg-blue-600 text-white hover:bg-blue-500 flex items-center justify-center font-bold text-base active:scale-95 transition-all shadow-xs"
                        title="Increase by 0.5°C"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Slider Bar */}
                  <div className="pt-1">
                    <input
                      type="range"
                      min="10.0"
                      max="30.0"
                      step="0.5"
                      value={activeZone.setpoint}
                      onChange={(e) => onUpdateZone(activeZone.zone_id, { setpoint: parseFloat(e.target.value) })}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 font-bold mt-1">
                      <span>10°C</span>
                      <span>30°C</span>
                    </div>
                  </div>

                  {/* Preset Pills */}
                  <div className="grid grid-cols-4 gap-1.5 pt-1">
                    {[
                      { label: "Eco 19°C", val: 19.0 },
                      { label: "Sleep 20°C", val: 20.0 },
                      { label: "Comfort 22°C", val: 22.0 },
                      { label: "Warm 24°C", val: 24.0 },
                    ].map((p) => (
                      <button
                        key={p.label}
                        onClick={() => onUpdateZone(activeZone.zone_id, { setpoint: p.val })}
                        className={`py-1.5 rounded-lg text-[11px] font-bold border transition-all text-center ${
                          activeZone.setpoint === p.val
                            ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                            : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Occupancy Section */}
                <div className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200/80 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Users className="w-4 h-4 text-slate-500" />
                    <div>
                      <span className="text-xs font-bold text-slate-900 block leading-tight">
                        Occupancy
                      </span>
                      <span className="text-[10px] text-slate-500">
                        Number of people in room (body heat: 100W each)
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onUpdateZone(activeZone.zone_id, { occupants: Math.max(0, activeZone.occupants - 1) })}
                      className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs hover:bg-slate-100 shadow-2xs"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-5 text-center font-black text-slate-900 text-sm">
                      {activeZone.occupants}
                    </span>
                    <button
                      onClick={() => onUpdateZone(activeZone.zone_id, { occupants: Math.min(8, activeZone.occupants + 1) })}
                      className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs hover:bg-slate-100 shadow-2xs"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Door & Window Section */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                    Door & Window
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {/* Door Button */}
                    <button
                      onClick={(e) => handleToggleDoor(activeZone.zone_id, e)}
                      className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-1 ${
                        activeZone.door_open
                          ? "bg-emerald-50/80 border-emerald-200 text-emerald-800"
                          : "bg-slate-50 border-slate-200 text-slate-700"
                      }`}
                    >
                      {activeZone.door_open ? (
                        <DoorOpen className="w-5 h-5 text-emerald-600" />
                      ) : (
                        <DoorClosed className="w-5 h-5 text-slate-400" />
                      )}
                      <span className="text-[10px] text-slate-500 font-semibold uppercase">Door</span>
                      <span className="text-xs font-black">
                        {activeZone.door_open ? "Open" : "Closed"}
                      </span>
                    </button>

                    {/* Window Button */}
                    <button
                      onClick={(e) => handleToggleWindow(activeZone.zone_id, e)}
                      className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-1 ${
                        activeZone.window_open
                          ? "bg-red-50/80 border-red-200 text-red-800"
                          : "bg-slate-50 border-slate-200 text-slate-700"
                      }`}
                    >
                      <AlertTriangle className={`w-5 h-5 ${activeZone.window_open ? "text-red-600" : "text-slate-400"}`} />
                      <span className="text-[10px] text-slate-500 font-semibold uppercase">Window</span>
                      <span className="text-xs font-black">
                        {activeZone.window_open ? "Draft: Open" : "Shut"}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Sub-Tab Content: SENSORS */}
            {selectedConsoleTab === "sensors" && (
              <div className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Airflow & VAV Damper:</span>
                  <span className="font-bold text-slate-900">{activeZone.damper_cfm ?? 250} CFM ({activeZone.fan_speed_pct.toFixed(0)}%)</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Compressor Electrical Draw:</span>
                  <span className="font-bold text-blue-600">{activeZone.electrical_power_kw.toFixed(2)} kW</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Heat Pump COP:</span>
                  <span className="font-bold text-emerald-600">{activeZone.cop.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">CO₂ Air Quality:</span>
                  <span className="font-bold text-slate-900">{activeZone.co2_ppm ?? 430} ppm</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Acoustic Sound Level:</span>
                  <span className="font-bold text-slate-900">{activeZone.acoustic_dba ?? 35} dBA</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">ISO 7730 PMV / PPD:</span>
                  <span className="font-bold text-slate-900">PMV: {activeZone.pmv.toFixed(1)} ({activeZone.ppd.toFixed(0)}% Dissatisfied)</span>
                </div>
              </div>
            )}

            {/* Sub-Tab Content: FUZZY AI */}
            {selectedConsoleTab === "fuzzy" && (
              <div className="p-3.5 rounded-2xl bg-blue-50/60 border border-blue-200/80 space-y-2 text-xs">
                <span className="font-bold text-blue-900 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  Mamdani Decision Verdict:
                </span>
                <p className="text-slate-600 leading-relaxed text-[11px]">
                  Fuzzy rules are modulating thermal power to {activeZone.hvac_power_pct.toFixed(0)}% and fan speed to {activeZone.fan_speed_pct.toFixed(0)}%. Equilibrium target is maintained with zero overshoot.
                </p>
                <div className="pt-2 border-t border-blue-200/60 flex justify-between text-[11px]">
                  <span className="text-slate-500">Temperature Error:</span>
                  <span className="font-bold text-blue-800">{(activeZone.setpoint - activeZone.temperature).toFixed(2)}°C</span>
                </div>
              </div>
            )}

            {/* Sub-Tab Content: SETTINGS */}
            {selectedConsoleTab === "settings" && (
              <div className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Room Volume:</span>
                  <span className="font-bold text-slate-900">{activeZone.volume_m3} m³</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Base Thermal Resistance:</span>
                  <span className="font-bold text-slate-900">2.6 °C/kW</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Doorway Convection:</span>
                  <span className="font-bold text-emerald-600">Active (1.2 °C/kW)</span>
                </div>
              </div>
            )}
          </div>

          {/* Card 2: Quick Actions */}
          {/* <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-5 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Quick Actions
            </h4>

            <div className="grid grid-cols-4 gap-2"> */}
              {/* Add Occupant */}
              {/* <button
                onClick={() => onUpdateZone(activeZone.zone_id, { occupants: Math.min(8, activeZone.occupants + 1) })}
                className="p-2.5 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 flex flex-col items-center justify-center gap-1 transition-all active:scale-95 text-center"
                title="Add Occupant"
              >
                <UserPlus className="w-4 h-4 text-blue-600" />
                <span className="text-[10px] font-bold leading-tight">Add Occupant</span>
              </button> */}

              {/* Open Door */}
              {/* <button
                onClick={(e) => handleToggleDoor(activeZone.zone_id, e)}
                className="p-2.5 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 flex flex-col items-center justify-center gap-1 transition-all active:scale-95 text-center"
                title="Toggle Door"
              >
                <DoorOpen className="w-4 h-4 text-emerald-600" />
                <span className="text-[10px] font-bold leading-tight">Open Door</span>
              </button> */}

              {/* Open Window */}
              {/* <button
                onClick={(e) => handleToggleWindow(activeZone.zone_id, e)}
                className="p-2.5 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 flex flex-col items-center justify-center gap-1 transition-all active:scale-95 text-center"
                title="Toggle Window"
              >
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span className="text-[10px] font-bold leading-tight">Open Window</span>
              </button> */}

              {/* Reset Zone */}
              {/* <button
                onClick={() => onUpdateZone(activeZone.zone_id, { setpoint: 21.0, occupants: 1, window_open: false, door_open: true })}
                className="p-2.5 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 flex flex-col items-center justify-center gap-1 transition-all active:scale-95 text-center"
                title="Reset Zone"
              >
                <RotateCcw className="w-4 h-4 text-slate-600" />
                <span className="text-[10px] font-bold leading-tight">Reset Zone</span>
              </button>
            </div>
          </div> */}
        </div>
      </div>
    </div>
  );
};

export default FloorPlanView;
