"use client";

import React from "react";
import { 
  Flame, 
  Snowflake, 
  Wind, 
  DoorOpen, 
  DoorClosed, 
  Volume2, 
  Activity, 
  Soup, 
  Laptop, 
  Users,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { ZoneData } from "@/lib/api";

interface ThermalConvectionMapProps {
  zones: Record<string, ZoneData>;
  selectedZoneId: string;
  onSelectZone: (zoneId: string) => void;
  onToggleDoor: (zoneId: string) => void;
}

export function ThermalConvectionMap({
  zones,
  selectedZoneId,
  onSelectZone,
  onToggleDoor
}: ThermalConvectionMapProps) {
  const living = zones["living_room"] || {
    temperature: 20.0,
    setpoint: 22.0,
    door_open: true,
    hvac_power_pct: 35,
    damper_cfm: 240,
    co2_ppm: 460,
    acoustic_dba: 32,
    disturbances: {}
  };

  const kitchen = zones["kitchen"] || {
    temperature: 21.0,
    setpoint: 21.5,
    door_open: true,
    hvac_power_pct: 10,
    damper_cfm: 200,
    co2_ppm: 490,
    acoustic_dba: 29,
    disturbances: {}
  };

  const bedroom = zones["master_bedroom"] || {
    temperature: 19.5,
    setpoint: 20.5,
    door_open: true,
    hvac_power_pct: 20,
    damper_cfm: 180,
    co2_ppm: 430,
    acoustic_dba: 28,
    disturbances: {}
  };

  const office = zones["office"] || {
    temperature: 20.5,
    setpoint: 22.5,
    door_open: true,
    hvac_power_pct: 45,
    damper_cfm: 270,
    co2_ppm: 520,
    acoustic_dba: 34,
    disturbances: {}
  };

  // Helper for temperature color theme
  const getTempGradient = (temp: number) => {
    if (temp < 19.5) {
      return {
        fill: "url(#coolGradient)",
        border: "border-sky-300",
        badge: "bg-sky-50 text-sky-700 border-sky-200",
        glow: "rgba(2, 132, 199, 0.15)"
      };
    }
    if (temp <= 22.5) {
      return {
        fill: "url(#comfortGradient)",
        border: "border-emerald-300",
        badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
        glow: "rgba(16, 185, 129, 0.15)"
      };
    }
    return {
      fill: "url(#warmGradient)",
      border: "border-amber-300",
      badge: "bg-amber-50 text-amber-700 border-amber-200",
      glow: "rgba(245, 158, 11, 0.15)"
    };
  };

  // Convective flow between living room and target room
  const getConvectiveFlux = (sourceTemp: number, targetTemp: number, doorOpen: boolean) => {
    if (!doorOpen) return { flux: 0, text: "Airlock Closed", active: false };
    const delta = sourceTemp - targetTemp;
    const fluxKw = Math.abs(delta) / 1.2;
    return {
      flux: fluxKw,
      text: delta > 0.2 ? `Diffusing Heat -> (${fluxKw.toFixed(2)} kW)` : delta < -0.2 ? `<- Absorbing Heat (${fluxKw.toFixed(2)} kW)` : "Thermal Balance",
      direction: delta > 0 ? "outgoing" : "incoming",
      active: Math.abs(delta) > 0.2
    };
  };

  const kitchenFlux = getConvectiveFlux(living.temperature, kitchen.temperature, kitchen.door_open);
  const bedroomFlux = getConvectiveFlux(living.temperature, bedroom.temperature, bedroom.door_open);
  const officeFlux = getConvectiveFlux(living.temperature, office.temperature, office.door_open);

  return (
    <div className="relative w-full bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 sm:p-6 overflow-hidden">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <h3 className="text-base sm:text-lg font-title text-slate-800 tracking-wide">
              Live Thermodynamic Diffusion &amp; Convection Field
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Inter-zone convective airflow (R_door = 1.2 °C/kW), motorized VAV dampers, and localized thermal plumes.
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-xs font-medium text-slate-600">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-sky-200 border border-sky-400" />
            <span>&lt; 19.5°C</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-emerald-200 border border-emerald-400" />
            <span>20–22.5°C</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-amber-200 border border-amber-400" />
            <span>&gt; 22.5°C</span>
          </div>
        </div>
      </div>

      {/* SVG Canvas Map */}
      <div className="relative w-full aspect-[16/10] min-h-[380px] sm:min-h-[460px] bg-slate-50/70 rounded-xl border border-slate-200/80 overflow-hidden select-none">
        <svg 
          viewBox="0 0 900 560" 
          className="w-full h-full"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            {/* Room background gradients */}
            <radialGradient id="coolGradient" cx="50%" cy="50%" r="65%">
              <stop offset="0%" stopColor="#e0f2fe" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#bae6fd" stopOpacity="0.4" />
            </radialGradient>
            <radialGradient id="comfortGradient" cx="50%" cy="50%" r="65%">
              <stop offset="0%" stopColor="#ecfdf5" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#a7f3d0" stopOpacity="0.4" />
            </radialGradient>
            <radialGradient id="warmGradient" cx="50%" cy="50%" r="65%">
              <stop offset="0%" stopColor="#fffbeb" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#fde68a" stopOpacity="0.4" />
            </radialGradient>

            {/* Radiant Heat Pulse Pattern */}
            <radialGradient id="stoveFlare" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.8" />
              <stop offset="60%" stopColor="#f59e0b" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
            </radialGradient>

            {/* Conduit Corridor Texture */}
            <pattern id="conduitPattern" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 0 10 L 20 10" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="2 4" />
            </pattern>
          </defs>

          {/* 1. CENTRAL CORRIDOR & CONVECTIVE CONDUITS */}
          {/* Corridor from Living to Kitchen (Horizontal top) */}
          <rect x="420" y="90" width="80" height="80" fill="url(#conduitPattern)" rx="4" />
          {/* Corridor from Living to Bedroom (Vertical left) */}
          <rect x="180" y="240" width="80" height="70" fill="url(#conduitPattern)" rx="4" />
          {/* Corridor from Living to Office (Diagonal / Center right) */}
          <rect x="420" y="380" width="80" height="70" fill="url(#conduitPattern)" rx="4" />

          {/* Dynamic Convective Airflow Streamlines */}
          {/* Living <-> Kitchen stream */}
          {kitchen.door_open && (
            <g className="animate-pulse">
              <line 
                x1="410" y1="130" x2="510" y2="130" 
                stroke={living.temperature > kitchen.temperature ? "#f59e0b" : "#0284c7"} 
                strokeWidth="4" 
                strokeDasharray="6 6"
              >
                <animate attributeName="stroke-dashoffset" from="24" to="0" dur="1.2s" repeatCount="indefinite" />
              </line>
            </g>
          )}

          {/* Living <-> Bedroom stream */}
          {bedroom.door_open && (
            <g className="animate-pulse">
              <line 
                x1="220" y1="230" x2="220" y2="320" 
                stroke={living.temperature > bedroom.temperature ? "#f59e0b" : "#0284c7"} 
                strokeWidth="4" 
                strokeDasharray="6 6"
              >
                <animate attributeName="stroke-dashoffset" from="24" to="0" dur="1.2s" repeatCount="indefinite" />
              </line>
            </g>
          )}

          {/* Living <-> Office stream */}
          {office.door_open && (
            <g className="animate-pulse">
              <line 
                x1="460" y1="370" x2="460" y2="460" 
                stroke={living.temperature > office.temperature ? "#f59e0b" : "#0284c7"} 
                strokeWidth="4" 
                strokeDasharray="6 6"
              >
                <animate attributeName="stroke-dashoffset" from="24" to="0" dur="1.2s" repeatCount="indefinite" />
              </line>
            </g>
          )}

          {/* 2. ZONE 1: LIVING ROOM & LOUNGE (Top-Left) */}
          <g 
            onClick={() => onSelectZone("living_room")}
            className="cursor-pointer transition-all duration-200"
          >
            <rect 
              x="30" y="30" width="390" height="210" rx="16" 
              fill={getTempGradient(living.temperature).fill}
              stroke={selectedZoneId === "living_room" ? "#0284c7" : "#cbd5e1"}
              strokeWidth={selectedZoneId === "living_room" ? "3.5" : "1.5"}
            />
            {/* Party disturbance flare */}
            {Boolean(living.disturbances?.["party_group"]) && (
              <circle cx="225" cy="135" r="75" fill="url(#stoveFlare)" opacity="0.4" className="animate-ping" />
            )}
          </g>

          {/* 3. ZONE 2: KITCHEN & DINING (Top-Right) */}
          <g 
            onClick={() => onSelectZone("kitchen")}
            className="cursor-pointer transition-all duration-200"
          >
            <rect 
              x="500" y="30" width="370" height="210" rx="16" 
              fill={getTempGradient(kitchen.temperature).fill}
              stroke={selectedZoneId === "kitchen" ? "#0284c7" : "#cbd5e1"}
              strokeWidth={selectedZoneId === "kitchen" ? "3.5" : "1.5"}
            />
            {/* Stove heat plume */}
            {Boolean(kitchen.disturbances?.["cooking_stove"] || kitchen.disturbances?.["commercial_range"]) && (
              <circle cx="685" cy="135" r="80" fill="url(#stoveFlare)" opacity="0.5" className="animate-pulse" />
            )}
          </g>

          {/* 4. ZONE 3: MASTER BEDROOM (Bottom-Left) */}
          <g 
            onClick={() => onSelectZone("master_bedroom")}
            className="cursor-pointer transition-all duration-200"
          >
            <rect 
              x="30" y="310" width="390" height="220" rx="16" 
              fill={getTempGradient(bedroom.temperature).fill}
              stroke={selectedZoneId === "master_bedroom" ? "#0284c7" : "#cbd5e1"}
              strokeWidth={selectedZoneId === "master_bedroom" ? "3.5" : "1.5"}
            />
          </g>

          {/* 5. ZONE 4: HOME OFFICE (Bottom-Right) */}
          <g 
            onClick={() => onSelectZone("office")}
            className="cursor-pointer transition-all duration-200"
          >
            <rect 
              x="500" y="310" width="370" height="220" rx="16" 
              fill={getTempGradient(office.temperature).fill}
              stroke={selectedZoneId === "office" ? "#0284c7" : "#cbd5e1"}
              strokeWidth={selectedZoneId === "office" ? "3.5" : "1.5"}
            />
            {/* Gaming PC disturbance glow */}
            {Boolean(office.disturbances?.["gaming_pc"]) && (
              <circle cx="685" cy="420" r="65" fill="url(#stoveFlare)" opacity="0.35" className="animate-pulse" />
            )}
          </g>
        </svg>

        {/* HTML OVERLAYS ON TOP OF SVG FOR CRISP TYPOGRAPHY & TOUCH CONTROLS */}

        {/* TOP-LEFT: LIVING ROOM OVERLAY */}
        <div 
          onClick={() => onSelectZone("living_room")}
          className={`absolute top-4 left-4 w-[42%] max-w-[370px] p-3 sm:p-4 rounded-xl cursor-pointer transition-all ${
            selectedZoneId === "living_room" ? "bg-white/95 shadow-md ring-2 ring-sky-500" : "bg-white/80 hover:bg-white/95 shadow-sm"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-semibold text-slate-900 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-slate-500" /> Living Room
            </span>
            <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${getTempGradient(living.temperature).badge}`}>
              {living.temperature.toFixed(1)}°C
            </span>
          </div>

          <div className="grid grid-cols-3 gap-1.5 mt-2.5 pt-2 border-t border-slate-100 text-[11px] text-slate-600">
            <div>
              <span className="text-[10px] text-slate-400 block">Target</span>
              <span className="font-semibold text-slate-800">{living.setpoint.toFixed(1)}°C</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">Damper</span>
              <span className="font-semibold text-slate-800">{living.damper_cfm ?? 240} CFM</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">CO2</span>
              <span className="font-semibold text-emerald-600">{living.co2_ppm ?? 450} ppm</span>
            </div>
          </div>

          {Boolean(living.disturbances?.["party_group"]) && (
            <div className="mt-2 text-[10px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded flex items-center gap-1">
              <Users className="w-3 h-3 text-amber-600" /> Gathering (+400W Load)
            </div>
          )}
        </div>

        {/* TOP-RIGHT: KITCHEN OVERLAY */}
        <div 
          onClick={() => onSelectZone("kitchen")}
          className={`absolute top-4 right-4 w-[40%] max-w-[350px] p-3 sm:p-4 rounded-xl cursor-pointer transition-all ${
            selectedZoneId === "kitchen" ? "bg-white/95 shadow-md ring-2 ring-sky-500" : "bg-white/80 hover:bg-white/95 shadow-sm"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-semibold text-slate-900 flex items-center gap-1.5">
              <Soup className="w-3.5 h-3.5 text-slate-500" /> Kitchen &amp; Dining
            </span>
            <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${getTempGradient(kitchen.temperature).badge}`}>
              {kitchen.temperature.toFixed(1)}°C
            </span>
          </div>

          <div className="grid grid-cols-3 gap-1.5 mt-2.5 pt-2 border-t border-slate-100 text-[11px] text-slate-600">
            <div>
              <span className="text-[10px] text-slate-400 block">Target</span>
              <span className="font-semibold text-slate-800">{kitchen.setpoint.toFixed(1)}°C</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">Damper</span>
              <span className="font-semibold text-slate-800">{kitchen.damper_cfm ?? 200} CFM</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">Acoustic</span>
              <span className="font-semibold text-slate-800">{kitchen.acoustic_dba ?? 29} dBA</span>
            </div>
          </div>

          {Boolean(kitchen.disturbances?.["cooking_stove"] || kitchen.disturbances?.["commercial_range"]) && (
            <div className="mt-2 text-[10px] font-medium text-red-700 bg-red-50 px-2 py-0.5 rounded flex items-center gap-1 animate-pulse">
              <Flame className="w-3 h-3 text-red-600" /> Stove Active (+900W Flare)
            </div>
          )}
        </div>

        {/* BOTTOM-LEFT: MASTER BEDROOM OVERLAY */}
        <div 
          onClick={() => onSelectZone("master_bedroom")}
          className={`absolute bottom-4 left-4 w-[42%] max-w-[370px] p-3 sm:p-4 rounded-xl cursor-pointer transition-all ${
            selectedZoneId === "master_bedroom" ? "bg-white/95 shadow-md ring-2 ring-sky-500" : "bg-white/80 hover:bg-white/95 shadow-sm"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-semibold text-slate-900 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-slate-500" /> Master Bedroom
            </span>
            <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${getTempGradient(bedroom.temperature).badge}`}>
              {bedroom.temperature.toFixed(1)}°C
            </span>
          </div>

          <div className="grid grid-cols-3 gap-1.5 mt-2.5 pt-2 border-t border-slate-100 text-[11px] text-slate-600">
            <div>
              <span className="text-[10px] text-slate-400 block">Target</span>
              <span className="font-semibold text-slate-800">{bedroom.setpoint.toFixed(1)}°C</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">Damper</span>
              <span className="font-semibold text-slate-800">{bedroom.damper_cfm ?? 180} CFM</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">Quietness</span>
              <span className="font-semibold text-emerald-600">{bedroom.acoustic_dba ?? 28} dBA</span>
            </div>
          </div>
        </div>

        {/* BOTTOM-RIGHT: HOME OFFICE OVERLAY */}
        <div 
          onClick={() => onSelectZone("office")}
          className={`absolute bottom-4 right-4 w-[40%] max-w-[350px] p-3 sm:p-4 rounded-xl cursor-pointer transition-all ${
            selectedZoneId === "office" ? "bg-white/95 shadow-md ring-2 ring-sky-500" : "bg-white/80 hover:bg-white/95 shadow-sm"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-semibold text-slate-900 flex items-center gap-1.5">
              <Laptop className="w-3.5 h-3.5 text-slate-500" /> Home Office
            </span>
            <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${getTempGradient(office.temperature).badge}`}>
              {office.temperature.toFixed(1)}°C
            </span>
          </div>

          <div className="grid grid-cols-3 gap-1.5 mt-2.5 pt-2 border-t border-slate-100 text-[11px] text-slate-600">
            <div>
              <span className="text-[10px] text-slate-400 block">Target</span>
              <span className="font-semibold text-slate-800">{office.setpoint.toFixed(1)}°C</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">Damper</span>
              <span className="font-semibold text-slate-800">{office.damper_cfm ?? 270} CFM</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">CO2</span>
              <span className="font-semibold text-slate-800">{office.co2_ppm ?? 520} ppm</span>
            </div>
          </div>

          {Boolean(office.disturbances?.["gaming_pc"]) && (
            <div className="mt-2 text-[10px] font-medium text-violet-700 bg-violet-50 px-2 py-0.5 rounded flex items-center gap-1">
              <Laptop className="w-3 h-3 text-violet-600" /> High Compute (+450W Load)
            </div>
          )}
        </div>

        {/* INTER-DOOR INTERACTIVE BUTTONS IN CORRIDORS */}
        {/* Kitchen Door Toggle Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleDoor("kitchen");
          }}
          className={`absolute top-[22%] left-[50%] -translate-x-1/2 -translate-y-1/2 px-2.5 py-1 rounded-full text-[11px] font-semibold border flex items-center gap-1 shadow-sm transition-all ${
            kitchen.door_open
              ? "bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100"
              : "bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200"
          }`}
          title="Click to toggle internal doorway between Living Room and Kitchen"
        >
          {kitchen.door_open ? <DoorOpen className="w-3 h-3 text-emerald-600" /> : <DoorClosed className="w-3 h-3 text-slate-500" />}
          <span>{kitchen.door_open ? "Door Open" : "Door Closed"}</span>
        </button>

        {/* Bedroom Door Toggle Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleDoor("master_bedroom");
          }}
          className={`absolute top-[48%] left-[22%] -translate-x-1/2 -translate-y-1/2 px-2.5 py-1 rounded-full text-[11px] font-semibold border flex items-center gap-1 shadow-sm transition-all ${
            bedroom.door_open
              ? "bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100"
              : "bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200"
          }`}
          title="Click to toggle doorway between Living Room and Master Bedroom"
        >
          {bedroom.door_open ? <DoorOpen className="w-3 h-3 text-emerald-600" /> : <DoorClosed className="w-3 h-3 text-slate-500" />}
          <span>{bedroom.door_open ? "Door Open" : "Door Closed"}</span>
        </button>

        {/* Office Door Toggle Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleDoor("office");
          }}
          className={`absolute top-[48%] right-[22%] translate-x-1/2 -translate-y-1/2 px-2.5 py-1 rounded-full text-[11px] font-semibold border flex items-center gap-1 shadow-sm transition-all ${
            office.door_open
              ? "bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100"
              : "bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200"
          }`}
          title="Click to toggle doorway between Living Room and Home Office"
        >
          {office.door_open ? <DoorOpen className="w-3 h-3 text-emerald-600" /> : <DoorClosed className="w-3 h-3 text-slate-500" />}
          <span>{office.door_open ? "Door Open" : "Door Closed"}</span>
        </button>
      </div>

      {/* Real-time convective flow status bar */}
      <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
        <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-2 flex items-center justify-between">
          <span className="text-slate-500">Living ⇄ Kitchen:</span>
          <span className={`font-semibold ${kitchenFlux.active ? "text-amber-600" : "text-slate-600"}`}>
            {kitchenFlux.text}
          </span>
        </div>
        <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-2 flex items-center justify-between">
          <span className="text-slate-500">Living ⇄ Bedroom:</span>
          <span className={`font-semibold ${bedroomFlux.active ? "text-sky-600" : "text-slate-600"}`}>
            {bedroomFlux.text}
          </span>
        </div>
        <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-2 flex items-center justify-between">
          <span className="text-slate-500">Living ⇄ Office:</span>
          <span className={`font-semibold ${officeFlux.active ? "text-violet-600" : "text-slate-600"}`}>
            {officeFlux.text}
          </span>
        </div>
      </div>
    </div>
  );
}
