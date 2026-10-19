"use client";

import React, { useState, useEffect, useCallback } from "react";
import Navbar from "@/components/Navbar";
import FloorPlanView from "@/components/FloorPlanView";
import FuzzyStudioView from "@/components/FuzzyStudioView";
import BenchmarkView from "@/components/BenchmarkView";
import WeatherModal from "@/components/WeatherModal";
import FuzzyTheoryModal from "@/components/FuzzyTheoryModal";
import Particles from "@/components/react-bits/Particles";
import { 
  fetchSimulationState, 
  updateZoneConfig, 
  resetSimulation, 
  subscribeSimulationWs,
  SimulationState, 
  ZoneData 
} from "@/lib/api";

const INITIAL_SIM_STATE: SimulationState = {
  sim_time_seconds: 0,
  sim_time_formatted: "12:00",
  ambient_temp: 16.0,
  solar_irradiance: 300.0,
  tariff_price: 0.18,
  solar_generation_kw: 3.2,
  circadian_mode: false,
  crisis_scenario: "normal",
  total_electrical_kw: 1.13,
  total_energy_kwh: 0.35,
  total_cost_usd: 0.063,
  zones: {
    living_room: {
      zone_id: "living_room",
      name: "Living Room & Lounge",
      volume_m3: 120.0,
      temperature: 20.0,
      setpoint: 22.0,
      error: 2.0,
      occupants: 2,
      internal_load_w: 150.0,
      window_open: false,
      door_open: false,
      hvac_power_pct: 35.0,
      fan_speed_pct: 40.0,
      thermal_power_kw: 1.75,
      electrical_power_kw: 0.52,
      total_energy_kwh: 0.12,
      cop: 3.8,
      pmv: -0.2,
      ppd: 6.0,
      damper_cfm: 240,
      co2_ppm: 460,
      acoustic_dba: 32,
      total_cost_usd: 0.02
    },
    master_bedroom: {
      zone_id: "master_bedroom",
      name: "Master Bedroom",
      volume_m3: 75.0,
      temperature: 19.5,
      setpoint: 20.5,
      error: 1.0,
      occupants: 1,
      internal_load_w: 50.0,
      window_open: false,
      door_open: false,
      hvac_power_pct: 20.0,
      fan_speed_pct: 25.0,
      thermal_power_kw: 0.64,
      electrical_power_kw: 0.18,
      total_energy_kwh: 0.06,
      cop: 4.0,
      pmv: -0.1,
      ppd: 5.0,
      damper_cfm: 180,
      co2_ppm: 430,
      acoustic_dba: 28,
      total_cost_usd: 0.01
    },
    kitchen: {
      zone_id: "kitchen",
      name: "Kitchen & Dining",
      volume_m3: 85.0,
      temperature: 21.0,
      setpoint: 21.5,
      error: 0.5,
      occupants: 1,
      internal_load_w: 200.0,
      window_open: false,
      door_open: false,
      hvac_power_pct: 10.0,
      fan_speed_pct: 20.0,
      thermal_power_kw: 0.38,
      electrical_power_kw: 0.11,
      total_energy_kwh: 0.08,
      cop: 3.9,
      pmv: 0.0,
      ppd: 5.0,
      damper_cfm: 170,
      co2_ppm: 490,
      acoustic_dba: 29,
      total_cost_usd: 0.015
    },
    office: {
      zone_id: "office",
      name: "Home Office",
      volume_m3: 50.0,
      temperature: 20.5,
      setpoint: 22.5,
      error: 2.0,
      occupants: 1,
      internal_load_w: 300.0,
      window_open: false,
      door_open: false,
      hvac_power_pct: 45.0,
      fan_speed_pct: 50.0,
      thermal_power_kw: 1.12,
      electrical_power_kw: 0.32,
      total_energy_kwh: 0.09,
      cop: 3.7,
      pmv: -0.3,
      ppd: 7.0,
      damper_cfm: 275,
      co2_ppm: 520,
      acoustic_dba: 34,
      total_cost_usd: 0.018
    }
  }
};

export default function Home() {
  const [activeTab, setActiveTab] = useState<string>("floorplan");
  const [simState, setSimState] = useState<SimulationState>(INITIAL_SIM_STATE);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isWeatherModalOpen, setIsWeatherModalOpen] = useState<boolean>(false);
  const [isTheoryModalOpen, setIsTheoryModalOpen] = useState<boolean>(false);

  // Initialize and connect real-time telemetry stream
  useEffect(() => {
    // 1. Initial snapshot fetch
    fetchSimulationState()
      .then((data) => setSimState(data))
      .catch((err) => console.error("Initial fetch error:", err));

    // 2. WebSocket streaming subscription
    const unsubscribe = subscribeSimulationWs(
      (data) => {
        setSimState(data);
      },
      (connected) => {
        setIsConnected(connected);
      }
    );

    return () => {
      unsubscribe();
    };
  }, []);

  // Zone update handler
  const handleUpdateZone = useCallback(async (zoneId: string, updates: Partial<ZoneData>) => {
    try {
      await updateZoneConfig({
        zone_id: zoneId,
        setpoint: updates.setpoint,
        occupants: updates.occupants,
        internal_load_w: updates.internal_load_w,
        window_open: updates.window_open,
        door_open: updates.door_open,
      });

      // Optimistically update local state for instantaneous responsiveness
      setSimState((prev) => {
        if (!prev || !prev.zones[zoneId]) return prev;
        return {
          ...prev,
          zones: {
            ...prev.zones,
            [zoneId]: {
              ...prev.zones[zoneId],
              ...updates,
            },
          },
        };
      });
    } catch (err) {
      console.error("Failed to update zone:", err);
    }
  }, []);

  // Reset simulation handler
  const handleReset = useCallback(async () => {
    try {
      const res = await resetSimulation();
      if (res.state) setSimState(res.state);
    } catch (err) {
      console.error("Failed to reset:", err);
    }
  }, []);

  const ambientTemp = simState?.ambient_temp ?? 18.0;
  const totalKw = simState?.total_electrical_kw ?? 0.0;
  const simTimeFormatted = simState?.sim_time_formatted ?? "00:00";

  return (
    <main className="relative min-h-screen flex flex-col bg-background text-foreground">
      {/* Background Micro-thermal Particles (React Bits) */}
      <Particles
        particleCount={35}
        speed={0.3}
        particleColors={["#06b6d4", "#38bdf8", "#f59e0b", "#10b981"]}
        className="opacity-40"
      />

      {/* Main Header / Top Navigation */}
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isConnected={isConnected}
        simTimeFormatted={simTimeFormatted}
        ambientTemp={ambientTemp}
        totalKw={totalKw}
        onReset={handleReset}
        onToggleWeatherModal={() => setIsWeatherModalOpen(true)}
        onOpenTheoryModal={() => setIsTheoryModalOpen(true)}
      />

      {/* Dynamic Content Views */}
      <div className="relative z-10 flex-1 max-w-[1720px] w-full mx-auto p-3 sm:p-5 lg:p-8 pb-24 md:pb-8 space-y-6">
        {activeTab === "floorplan" && (
          <FloorPlanView
            zones={simState?.zones || {}}
            onUpdateZone={handleUpdateZone}
            circadianMode={simState?.circadian_mode ?? false}
            tariffPrice={simState?.tariff_price ?? 0.18}
            solarKw={simState?.solar_generation_kw ?? 3.2}
            ambientTemp={ambientTemp}
            solarIrradiance={simState?.solar_irradiance ?? 320}
            onReset={handleReset}
          />
        )}

        {activeTab === "fuzzy_studio" && <FuzzyStudioView />}

        {activeTab === "benchmark" && <BenchmarkView />}
      </div>

      {/* Weather Shock / Presets Modal */}
      <WeatherModal
        isOpen={isWeatherModalOpen}
        onClose={() => setIsWeatherModalOpen(false)}
        currentAmbient={ambientTemp}
        currentSolar={simState?.solar_irradiance ?? 250}
        onUpdated={(amb, sol) => {
          setSimState((prev) => (prev ? { ...prev, ambient_temp: amb, solar_irradiance: sol } : prev));
        }}
      />

      {/* Mathematical & Architectural Theory Modal */}
      <FuzzyTheoryModal
        isOpen={isTheoryModalOpen}
        onClose={() => setIsTheoryModalOpen(false)}
      />
    </main>
  );
}
