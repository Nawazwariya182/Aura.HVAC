"""
FastAPI Backend Server for Smart Home Fuzzy Logic Temperature Control System.
Provides REST and WebSocket endpoints for real-time physics, rule explainability,
control surface generation, and benchmark analysis.
"""

from typing import Dict, Any, Optional, List
import asyncio
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from .fuzzy_engine import fuzzy_system, get_circadian_setpoint
from .physics_engine import simulator, run_benchmark_comparison, run_4way_control_arena, run_pareto_optimization

app = FastAPI(
    title="Smart Home Fuzzy Logic Control API",
    description="Cyber-Physical HVAC Multi-Zone Fuzzy Logic Thermal Control Engine",
    version="1.0.0"
)

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------------------------------------------------------
# Request Models
# -------------------------------------------------------------------------

class FuzzyEvaluateRequest(BaseModel):
    error: float = Field(..., description="Temperature error (Target - Current) in °C", ge=-15.0, le=15.0)
    derror: float = Field(0.0, description="Rate of change of error in °C/min", ge=-3.0, le=3.0)
    ambient: float = Field(20.0, description="Outdoor ambient temperature in °C", ge=-15.0, le=50.0)
    occupancy: float = Field(1.0, description="Room occupancy count (persons)", ge=0.0, le=10.0)
    tariff: Optional[float] = Field(0.18, description="Electricity tariff in $/kWh", ge=0.01, le=1.50)
    defuzz_method: Optional[str] = Field("centroid", description="centroid | bisector | mom | som | lom")


class ZoneUpdateRequest(BaseModel):
    zone_id: str
    setpoint: Optional[float] = None
    occupants: Optional[int] = None
    internal_load_w: Optional[float] = None
    window_open: Optional[bool] = None
    door_open: Optional[bool] = None


class EnvironmentUpdateRequest(BaseModel):
    ambient_temp: Optional[float] = None
    solar_irradiance: Optional[float] = None


class DisturbanceToggleRequest(BaseModel):
    zone_id: str
    disturbance_type: str
    active: bool
    watts: float = 500.0


class DoorToggleRequest(BaseModel):
    zone_id: str
    open_state: bool


class CircadianToggleRequest(BaseModel):
    enabled: bool


class AdaptDeadbandRequest(BaseModel):
    inertia_factor: float = Field(0.85, ge=0.5, le=1.5)


class BenchmarkRequest(BaseModel):
    duration_minutes: int = Field(120, ge=30, le=360)
    disturbance_at_min: int = Field(40, ge=10, le=200)
    ambient_shock: float = Field(5.0, ge=0.0, le=15.0)


class ArenaRunRequest(BaseModel):
    duration_minutes: int = Field(120, ge=30, le=360)
    disturbance_min: int = Field(35, ge=10, le=200)
    cold_shock_deg: float = Field(7.0, ge=0.0, le=20.0)


class CrisisScenarioRequest(BaseModel):
    scenario_id: str = Field(..., description="polar_vortex | heat_dome | kitchen_flare | brownout_cap | normal")


class ParetoOptimizeRequest(BaseModel):
    duration_minutes: int = Field(60, ge=30, le=180)


# -------------------------------------------------------------------------
# API Endpoints
# -------------------------------------------------------------------------

@app.get("/api/health")
def health_check():
    return {
        "status": "online",
        "engine": "SmartHomeFuzzySystem",
        "zones_count": len(simulator.zones),
        "rules_count": len(fuzzy_system.rules),
        "defuzz_method": fuzzy_system.defuzz_method
    }


@app.post("/api/fuzzy/evaluate")
def evaluate_fuzzy(req: FuzzyEvaluateRequest):
    inputs = {
        "error": req.error,
        "derror": req.derror,
        "ambient": req.ambient,
        "occupancy": req.occupancy,
        "tariff": req.tariff if req.tariff is not None else 0.18
    }
    detailed = fuzzy_system.evaluate_detailed(inputs, defuzz_method=req.defuzz_method)
    return detailed


@app.get("/api/fuzzy/membership-functions")
def get_membership_functions():
    return fuzzy_system.get_all_membership_curves()


@app.get("/api/fuzzy/surface")
def get_control_surface(
    var_x: str = "error",
    var_y: str = "derror",
    out_var: str = "power",
    grid_size: int = 25,
    ambient: float = 20.0,
    occupancy: float = 1.0,
    tariff: float = 0.18
):
    try:
        surface = fuzzy_system.generate_surface(
            var_x=var_x,
            var_y=var_y,
            out_var=out_var,
            grid_size=min(max(grid_size, 10), 45),
            ambient_fixed=ambient,
            occupancy_fixed=occupancy,
            tariff_fixed=tariff
        )
        return surface
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/api/fuzzy/rules")
def get_rule_matrix():
    return {
        "rules": fuzzy_system.get_rule_matrix(),
        "count": len(fuzzy_system.rules)
    }


@app.post("/api/fuzzy/tune")
def tune_fuzzy_engine(defuzz_method: str = "centroid"):
    valid = ["centroid", "bisector", "mom", "som", "lom"]
    if defuzz_method not in valid:
        raise HTTPException(status_code=400, detail=f"Invalid method. Choose from {valid}")
    fuzzy_system.defuzz_method = defuzz_method
    return {"status": "updated", "defuzz_method": defuzz_method}


@app.post("/api/fuzzy/adapt")
def adapt_deadband(req: AdaptDeadbandRequest):
    res = fuzzy_system.adapt_deadband(req.inertia_factor)
    return res


# -------------------------------------------------------------------------
# Simulation Endpoints
# -------------------------------------------------------------------------

@app.get("/api/simulation/state")
def get_simulation_state():
    readings = {z_id: z.to_dict() for z_id, z in simulator.zones.items()}
    total_kw = sum(z.electrical_power_kw for z in simulator.zones.values())
    total_kwh = sum(z.total_energy_kwh for z in simulator.zones.values())
    total_cost = sum(z.total_cost_usd for z in simulator.zones.values())
    current_hour = (simulator.sim_time_seconds / 3600.0) % 24.0
    if 11.0 <= current_hour <= 15.0 and simulator.solar_generation_kw > 2.0:
        tariff = 0.06
    elif 17.0 <= current_hour <= 21.0:
        tariff = 0.42
    else:
        tariff = simulator.tariff_price

    return {
        "sim_time_seconds": round(simulator.sim_time_seconds, 1),
        "sim_time_formatted": simulator.format_sim_time(),
        "ambient_temp": round(simulator.ambient_temp, 2),
        "solar_irradiance": round(simulator.solar_irradiance, 1),
        "tariff_price": round(tariff, 3),
        "solar_generation_kw": round(simulator.solar_generation_kw, 2),
        "circadian_mode": simulator.circadian_mode,
        "total_electrical_kw": round(total_kw, 3),
        "total_energy_kwh": round(total_kwh, 4),
        "total_cost_usd": round(total_cost, 3),
        "zones": readings
    }


@app.post("/api/simulation/step")
def step_simulation(dt_seconds: float = 5.0):
    clamped_dt = min(max(dt_seconds, 1.0), 60.0)
    return simulator.step(clamped_dt)


@app.post("/api/simulation/zone")
def update_zone(req: ZoneUpdateRequest):
    try:
        updated = simulator.update_zone_config(
            zone_id=req.zone_id,
            setpoint=req.setpoint,
            occupants=req.occupants,
            internal_load_w=req.internal_load_w,
            window_open=req.window_open,
            door_open=req.door_open
        )
        return {"status": "ok", "zone": updated}
    except KeyError as e:
        raise HTTPException(status_code=404, detail=str(e))


@app.post("/api/simulation/disturbance")
def toggle_disturbance(req: DisturbanceToggleRequest):
    if req.zone_id not in simulator.zones:
        raise HTTPException(status_code=404, detail="Zone not found")
    simulator.toggle_disturbance(req.zone_id, req.disturbance_type, req.active, req.watts)
    return {
        "status": "ok",
        "zone_id": req.zone_id,
        "disturbances": simulator.zones[req.zone_id].disturbances
    }


@app.post("/api/simulation/door")
def toggle_door(req: DoorToggleRequest):
    if req.zone_id not in simulator.zones:
        raise HTTPException(status_code=404, detail="Zone not found")
    simulator.toggle_door(req.zone_id, req.open_state)
    return {
        "status": "ok",
        "zone_id": req.zone_id,
        "door_open": simulator.zones[req.zone_id].door_open
    }


@app.post("/api/simulation/circadian")
def toggle_circadian(req: CircadianToggleRequest):
    simulator.circadian_mode = req.enabled
    return {
        "status": "ok",
        "circadian_mode": simulator.circadian_mode
    }


@app.post("/api/simulation/environment")
def update_environment(req: EnvironmentUpdateRequest):
    simulator.set_environment(
        ambient_temp=req.ambient_temp,
        solar_irradiance=req.solar_irradiance
    )
    return {"status": "ok", "ambient_temp": simulator.ambient_temp, "solar_irradiance": simulator.solar_irradiance}


@app.post("/api/simulation/reset")
def reset_simulation():
    simulator.reset()
    return {"status": "reset", "state": get_simulation_state()}


@app.post("/api/simulation/benchmark")
def run_benchmark(req: BenchmarkRequest):
    result = run_benchmark_comparison(
        duration_minutes=req.duration_minutes,
        disturbance_at_min=req.disturbance_at_min,
        ambient_shock=req.ambient_shock
    )
    return result


@app.post("/api/arena/run")
def run_arena(req: ArenaRunRequest):
    result = run_4way_control_arena(
        duration_minutes=req.duration_minutes,
        disturbance_min=req.disturbance_min,
        cold_shock_deg=req.cold_shock_deg
    )
    return result


@app.post("/api/simulation/crisis")
def set_crisis_scenario(req: CrisisScenarioRequest):
    res = simulator.apply_crisis_scenario(req.scenario_id)
    return {"status": "ok", "crisis": res, "state": get_simulation_state()}


@app.post("/api/fuzzy/optimize")
def optimize_fuzzy(req: ParetoOptimizeRequest):
    res = run_pareto_optimization(duration_minutes=req.duration_minutes)
    return res


# -------------------------------------------------------------------------
# Real-Time WebSocket Streaming
# -------------------------------------------------------------------------

@app.websocket("/api/simulation/ws")
async def simulation_websocket(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            # Step simulation by 5 seconds
            state = simulator.step(dt_seconds=5.0)
            await websocket.send_json(state)
            await asyncio.sleep(0.5) # Stream at 2Hz
    except WebSocketDisconnect:
        pass
    except Exception:
        pass
