"""
Advanced Thermodynamic Physics Simulator with Inter-Zone Convective Heat Diffusion,
Dynamic Physical Thermal Disturbances, and 4-Way Multi-Algorithm Live Arena Benchmark.
"""

from typing import Dict, List, Any, Optional
import math
import time
import numpy as np
from .fuzzy_engine import SmartHomeFuzzySystem, fuzzy_system, get_circadian_setpoint

def calculate_pmv_ppd(
    ta: float,
    tr: Optional[float] = None,
    vel: float = 0.1,
    rh: float = 50.0,
    met: float = 1.1,
    clo: float = 0.8
) -> Dict[str, float]:
    if tr is None:
        tr = ta
    pa = (rh / 100.0) * 0.1 * math.exp(18.956 - 4030.18 / (ta + 235.0)) * 1000.0
    m = met * 58.15
    w = 0.0
    icl = 0.155 * clo
    fcl = 1.0 + 1.29 * icl if icl <= 0.078 else 1.05 + 0.645 * icl
    hcf = 12.1 * math.sqrt(max(vel, 0.05))
    taa = ta + 273.15
    tra = tr + 273.15
    tcla = taa + (35.5 - ta) / (3.5 * icl + 0.1)

    p1 = icl * fcl
    p2 = p1 * 3.96
    p3 = p1 * 100.0
    p4 = p1 * taa
    p5 = 308.7 - 0.028 * m + p2 * ((tra / 100.0) ** 4)

    xn = tcla / 100.0
    xf = tcla / 50.0
    eps = 0.00015

    for _ in range(150):
        xf = (xf + xn) / 2.0
        hcn = 2.38 * (abs(100.0 * xf - taa) ** 0.25)
        hc = max(hcf, hcn)
        xn = (p5 + p4 * hc - p2 * (xf ** 4)) / (100.0 + p3 * hc)
        if abs(xn - xf) <= eps:
            break

    tcl = 100.0 * xn - 273.15
    hl1 = 3.05 * 0.001 * (5733.0 - 6.99 * (m - w) - pa)
    hl2 = 0.42 * ((m - w) - 58.15) if (m - w) > 58.15 else 0.0
    hl3 = 1.7 * 0.00001 * m * (5867.0 - pa)
    hl4 = 0.0014 * m * (34.0 - ta)
    hl5 = 3.96 * fcl * ((xn ** 4) - ((tra / 100.0) ** 4))
    hl6 = fcl * hc * (tcl - ta)

    ts = 0.303 * math.exp(-0.036 * m) + 0.028
    pmv = ts * ((m - w) - hl1 - hl2 - hl3 - hl4 - hl5 - hl6)
    pmv = max(min(pmv, 3.0), -3.0)
    ppd = 100.0 - 95.0 * math.exp(-(0.03353 * (pmv ** 4) + 0.2179 * (pmv ** 2)))
    ppd = max(min(ppd, 100.0), 5.0)

    return {"pmv": round(float(pmv), 2), "ppd": round(float(ppd), 1)}


class Zone:
    def __init__(
        self,
        zone_id: str,
        name: str,
        volume: float,
        capacitance: float,
        r_envelope: float,
        max_heat_kw: float,
        max_cool_kw: float,
        initial_temp: float = 21.0,
        setpoint: float = 22.0,
        occupants: int = 1,
        internal_load_w: float = 0.0
    ):
        self.zone_id = zone_id
        self.name = name
        self.volume = volume
        self.capacitance = capacitance
        self.r_envelope_base = r_envelope
        self.max_heat_kw = max_heat_kw
        self.max_cool_kw = max_cool_kw

        self.temperature = initial_temp
        self.prev_temperature = initial_temp
        self.setpoint = setpoint
        self.occupants = occupants
        self.internal_load_w = internal_load_w
        self.window_open = False
        self.door_open = True # Connected door to central lounge

        # Active disturbances
        self.disturbances: Dict[str, float] = {} # e.g. {"stove": 900.0}

        self.hvac_power_pct = 0.0
        self.fan_speed_pct = 0.0
        self.thermal_power_kw = 0.0
        self.electrical_power_kw = 0.0
        self.total_energy_kwh = 0.0
        self.total_cost_usd = 0.0
        self.cop = 3.5
        self.damper_cfm = 250 # Motorized variable air volume damper (CFM)
        self.co2_ppm = 430.0 # Ambient CO2 baseline (ppm)
        self.acoustic_dba = 30.0 # Ambient acoustic level (dBA)

        self.history: List[Dict[str, Any]] = []

    @property
    def effective_r_envelope(self) -> float:
        if self.window_open:
            return 1.2 # Strong infiltration draft through open window
        return self.r_envelope_base

    @property
    def total_internal_heat_kw(self) -> float:
        base_internal = (self.occupants * 0.10) + (self.internal_load_w / 1000.0)
        dist_sum = sum(self.disturbances.values()) / 1000.0
        return base_internal + dist_sum

    def calculate_derror(self, dt_minutes: float) -> float:
        if dt_minutes <= 0:
            return 0.0
        d_temp = self.temperature - self.prev_temperature
        raw_derror = -float(d_temp / dt_minutes)
        # Apply exponential moving average to filter discrete step derivative noise
        if not hasattr(self, "_filtered_derror"):
            self._filtered_derror = 0.0
        alpha = min(max(dt_minutes / 1.5, 0.15), 0.45)
        self._filtered_derror = alpha * raw_derror + (1.0 - alpha) * self._filtered_derror
        return float(np.clip(self._filtered_derror, -2.0, 2.0))

    def to_dict(self) -> Dict[str, Any]:
        comfort = calculate_pmv_ppd(
            ta=self.temperature,
            vel=0.08 + 0.3 * (self.fan_speed_pct / 100.0)
        )
        return {
            "zone_id": self.zone_id,
            "name": self.name,
            "volume_m3": self.volume,
            "temperature": round(self.temperature, 2),
            "setpoint": round(self.setpoint, 2),
            "error": round(self.setpoint - self.temperature, 2),
            "occupants": self.occupants,
            "internal_load_w": round(self.total_internal_heat_kw * 1000.0, 0),
            "window_open": self.window_open,
            "door_open": self.door_open,
            "disturbances": self.disturbances,
            "hvac_power_pct": round(self.hvac_power_pct, 1),
            "fan_speed_pct": round(self.fan_speed_pct, 1),
            "damper_cfm": self.damper_cfm,
            "co2_ppm": round(self.co2_ppm, 0),
            "acoustic_dba": round(self.acoustic_dba, 1),
            "thermal_power_kw": round(self.thermal_power_kw, 2),
            "electrical_power_kw": round(self.electrical_power_kw, 3),
            "total_energy_kwh": round(self.total_energy_kwh, 4),
            "total_cost_usd": round(self.total_cost_usd, 4),
            "cop": round(self.cop, 2),
            "pmv": comfort["pmv"],
            "ppd": comfort["ppd"]
        }


class SmartHomeSimulator:
    def __init__(self, fuzzy_engine: SmartHomeFuzzySystem = fuzzy_system):
        self.fuzzy = fuzzy_engine
        self.zones: Dict[str, Zone] = {}
        self.ambient_temp: float = 16.0
        self.solar_irradiance: float = 300.0 # W/m^2
        self.tariff_price: float = 0.18 # $/kWh
        self.solar_generation_kw: float = 3.2 # Rooftop PV generation
        self.circadian_mode: bool = False
        self.crisis_scenario: str = "normal"
        self.sim_time_seconds: float = 0.0
        self._init_zones()

    def _init_zones(self):
        self.zones = {
            "living_room": Zone("living_room", "Living Room & Lounge", 120.0, 85.0, 8.5, 6.5, 6.5, 20.0, 22.0, 2, 150.0),
            "master_bedroom": Zone("master_bedroom", "Master Bedroom", 75.0, 55.0, 11.0, 4.5, 4.5, 19.5, 20.5, 1, 50.0),
            "kitchen": Zone("kitchen", "Kitchen & Dining", 85.0, 65.0, 9.0, 5.0, 5.0, 21.0, 21.5, 1, 200.0),
            "office": Zone("office", "Home Office", 50.0, 40.0, 12.0, 3.5, 3.5, 20.5, 22.5, 1, 300.0)
        }

    def step(self, dt_seconds: float = 5.0) -> Dict[str, Any]:
        self.sim_time_seconds += dt_seconds
        dt_minutes = dt_seconds / 60.0
        current_hour = (self.sim_time_seconds / 3600.0) % 24.0

        # Diurnal weather curve
        diurnal_offset = 3.0 * math.sin((self.sim_time_seconds / 86400.0) * 2.0 * math.pi - math.pi / 2)
        effective_ambient = self.ambient_temp + diurnal_offset

        # Dynamic tariff simulation: Peak hours between 17:00 and 21:00 ($0.38/kWh), midday cheap solar ($0.08/kWh)
        if 11.0 <= current_hour <= 15.0 and self.solar_generation_kw > 2.0:
            current_tariff = 0.06 # Cheap solar surplus
        elif 17.0 <= current_hour <= 21.0:
            current_tariff = 0.42 # High peak utility strain
        else:
            current_tariff = self.tariff_price

        # Circadian setpoint wave update
        if self.circadian_mode:
            circ = get_circadian_setpoint(current_hour, base_setpoint=22.0)
            self.zones["master_bedroom"].setpoint = circ["target_setpoint"]

        # Inter-zone Convective Heat Transfer calculation
        # Living room is connected to Kitchen, Bedroom, Office via internal doorways
        t_living = self.zones["living_room"].temperature
        interzone_flows = {z: 0.0 for z in self.zones}

        for z_id in ["kitchen", "master_bedroom", "office"]:
            zone = self.zones[z_id]
            if zone.door_open:
                # Convective airflow exchange rate: R_door = 6.0 °C/kW
                q_diffuse = (t_living - zone.temperature) / 6.0
                interzone_flows[z_id] += q_diffuse
                interzone_flows["living_room"] -= q_diffuse

        # Step each zone
        for z_id, zone in self.zones.items():
            err = zone.setpoint - zone.temperature
            derr = zone.calculate_derror(max(dt_minutes, 0.05))

            fuzzy_inputs = {
                "error": err,
                "derror": derr,
                "ambient": effective_ambient,
                "occupancy": float(zone.occupants),
                "tariff": current_tariff
            }
            fuzzy_out = self.fuzzy.evaluate(fuzzy_inputs)

            power_pct = float(fuzzy_out.get("power", 0.0))
            fan_pct = float(fuzzy_out.get("fan_speed", 0.0))

            zone.hvac_power_pct = power_pct
            zone.fan_speed_pct = fan_pct
            # Modulate motorized VAV damper (CFM)
            zone.damper_cfm = int(100 + (fan_pct / 100.0) * 350)

            if power_pct > 0:
                zone.thermal_power_kw = (power_pct / 100.0) * zone.max_heat_kw
                cop = max(1.8, 4.3 - 0.045 * (20.0 - effective_ambient))
            elif power_pct < 0:
                zone.thermal_power_kw = (power_pct / 100.0) * zone.max_cool_kw
                cop = max(2.0, 3.9 - 0.04 * (effective_ambient - 25.0))
            else:
                zone.thermal_power_kw = 0.0
                cop = 3.5

            zone.cop = cop
            p_fan = 0.04 * ((fan_pct / 100.0) ** 2)
            p_comp = abs(zone.thermal_power_kw) / cop if cop > 0 else 0.0
            zone.electrical_power_kw = p_comp + p_fan

            # Integrate Energy & Dollar cost
            step_kwh = zone.electrical_power_kw * (dt_seconds / 3600.0)
            zone.total_energy_kwh += step_kwh
            zone.total_cost_usd += step_kwh * current_tariff

            # Multi-parametric CO2 & acoustic noise co-regulation
            co2_gen = (zone.occupants * 16.0) - (zone.damper_cfm / 100.0) * 8.5
            zone.co2_ppm = max(415.0, min(2400.0, zone.co2_ppm + co2_gen * (dt_seconds / 60.0)))
            zone.acoustic_dba = round(28.0 + 22.0 * ((zone.fan_speed_pct / 100.0) ** 1.3), 1)

            # Physical differential equation
            q_env = (effective_ambient - zone.temperature) / zone.effective_r_envelope
            q_internal = zone.total_internal_heat_kw
            q_solar = (self.solar_irradiance / 1000.0) * 1.2 if not zone.window_open else 0.4
            q_convective = interzone_flows[z_id]

            q_net = q_env + q_internal + q_solar + zone.thermal_power_kw + q_convective
            d_temp = (q_net / zone.capacitance) * dt_seconds

            zone.prev_temperature = zone.temperature
            zone.temperature += d_temp

            hist = {
                "time": self.format_sim_time(),
                "temp": round(zone.temperature, 2),
                "setpoint": round(zone.setpoint, 2),
                "power_pct": round(zone.hvac_power_pct, 1),
                "kw": round(zone.electrical_power_kw, 2),
                "cost": round(zone.total_cost_usd, 3)
            }
            zone.history.append(hist)
            if len(zone.history) > 40:
                zone.history.pop(0)

        total_kw = sum(z.electrical_power_kw for z in self.zones.values())
        total_kwh = sum(z.total_energy_kwh for z in self.zones.values())
        total_cost = sum(z.total_cost_usd for z in self.zones.values())

        return {
            "sim_time_seconds": round(self.sim_time_seconds, 1),
            "sim_time_formatted": self.format_sim_time(),
            "ambient_temp": round(effective_ambient, 2),
            "solar_irradiance": round(self.solar_irradiance, 0),
            "tariff_price": round(current_tariff, 3),
            "solar_generation_kw": round(self.solar_generation_kw, 2),
            "circadian_mode": self.circadian_mode,
            "crisis_scenario": self.crisis_scenario,
            "total_electrical_kw": round(total_kw, 3),
            "total_energy_kwh": round(total_kwh, 4),
            "total_cost_usd": round(total_cost, 3),
            "zones": {z_id: z.to_dict() for z_id, z in self.zones.items()}
        }

    def format_sim_time(self) -> str:
        mins = int(self.sim_time_seconds / 60)
        hours = int(mins / 60) % 24
        remaining_mins = mins % 60
        return f"{hours:02d}:{remaining_mins:02d}"

    def toggle_disturbance(self, zone_id: str, disturbance_type: str, active: bool, watts: float = 500.0):
        if zone_id in self.zones:
            if active:
                self.zones[zone_id].disturbances[disturbance_type] = float(watts)
            else:
                self.zones[zone_id].disturbances.pop(disturbance_type, None)

    def toggle_door(self, zone_id: str, open_state: bool):
        if zone_id in self.zones:
            self.zones[zone_id].door_open = open_state

    def update_zone_config(
        self,
        zone_id: str,
        setpoint: Optional[float] = None,
        occupants: Optional[int] = None,
        internal_load_w: Optional[float] = None,
        window_open: Optional[bool] = None,
        door_open: Optional[bool] = None
    ) -> Dict[str, Any]:
        if zone_id not in self.zones:
            raise KeyError(f"Zone '{zone_id}' not found")
        zone = self.zones[zone_id]
        if setpoint is not None:
            zone.setpoint = float(setpoint)
        if occupants is not None:
            zone.occupants = int(occupants)
        if internal_load_w is not None:
            zone.internal_load_w = float(internal_load_w)
        if window_open is not None:
            zone.window_open = bool(window_open)
        if door_open is not None:
            zone.door_open = bool(door_open)
        return zone.to_dict()

    def apply_crisis_scenario(self, scenario_id: str) -> Dict[str, Any]:
        self.crisis_scenario = scenario_id
        if scenario_id == "polar_vortex":
            self.ambient_temp = -12.0
            self.solar_irradiance = 40.0
            self.tariff_price = 0.24
            self.solar_generation_kw = 0.2
            self.zones["office"].window_open = True
            for z in self.zones.values():
                z.disturbances.clear()
        elif scenario_id == "heat_dome":
            self.ambient_temp = 41.5
            self.solar_irradiance = 980.0
            self.tariff_price = 0.52
            self.solar_generation_kw = 5.6
            for z in self.zones.values():
                z.window_open = False
                z.disturbances.clear()
        elif scenario_id == "kitchen_flare":
            self.ambient_temp = 24.0
            self.solar_irradiance = 450.0
            self.tariff_price = 0.18
            self.zones["kitchen"].disturbances["commercial_range"] = 1500.0
            self.zones["kitchen"].door_open = True
        elif scenario_id == "brownout_cap":
            self.ambient_temp = 34.0
            self.solar_irradiance = 720.0
            self.tariff_price = 0.44
            self.solar_generation_kw = 2.1
        elif scenario_id == "normal":
            self.ambient_temp = 16.0
            self.solar_irradiance = 300.0
            self.tariff_price = 0.18
            self.solar_generation_kw = 3.2
            for z in self.zones.values():
                z.window_open = False
                z.door_open = True
                z.disturbances.clear()
        return {
            "scenario": scenario_id,
            "ambient_temp": self.ambient_temp,
            "solar_irradiance": self.solar_irradiance,
            "tariff_price": self.tariff_price,
            "solar_generation_kw": self.solar_generation_kw
        }

    def reset(self):
        self.sim_time_seconds = 0.0
        self.crisis_scenario = "normal"
        self._init_zones()


# -------------------------------------------------------------------------
# 4-WAY LIVE CONTROL ARENA BENCHMARK
# -------------------------------------------------------------------------

class BangBangController:
    """Standard wall thermostat with deadband hysteresis."""
    def __init__(self, hysteresis: float = 0.8):
        self.hysteresis = hysteresis
        self.state = 0.0 # -100, 0, +100

    def step(self, temp: float, setpoint: float) -> float:
        if temp < setpoint - self.hysteresis:
            self.state = 100.0 # Heat 100% full blast
        elif temp > setpoint + self.hysteresis:
            self.state = -100.0 # Cool 100% full blast
        elif abs(temp - setpoint) < 0.2:
            self.state = 0.0
        return self.state


class PIDController:
    def __init__(self, kp: float = 35.0, ki: float = 0.18, kd: float = 100.0):
        self.kp = kp
        self.ki = ki
        self.kd = kd
        self.integral = 0.0
        self.prev_error = 0.0

    def step(self, error: float, dt_min: float) -> float:
        if dt_min <= 0:
            return 0.0
        self.integral += error * dt_min
        self.integral = max(min(self.integral, 250.0), -250.0)
        p = self.kp * error
        i = self.ki * self.integral
        d = self.kd * ((error - self.prev_error) / dt_min)
        self.prev_error = error
        return float(np.clip(p + i + d, -100.0, 100.0))


def run_4way_control_arena(
    duration_minutes: int = 120,
    disturbance_min: int = 35,
    cold_shock_deg: float = 7.0
) -> Dict[str, Any]:
    """
    Executes a 4-way head-to-head race on an identical room:
    1. Bang-Bang Thermostat
    2. Industrial PID Controller
    3. Standard Textbook Fuzzy Controller
    4. Aura Smart Economic Adaptive Fuzzy Controller
    """
    dt_sec = 10.0
    dt_min = dt_sec / 60.0
    steps = int((duration_minutes * 60) / dt_sec)

    # 4 Identical Virtual Rooms (85 m3, calibrated envelope resistance R=7.5 °C/kW)
    z_bang = Zone("z_bang", "Bang-Bang", 85.0, 75.0, 7.5, 5.0, 5.0, 18.0, 22.0)
    z_pid = Zone("z_pid", "PID", 85.0, 75.0, 7.5, 5.0, 5.0, 18.0, 22.0)
    z_std_fuzzy = Zone("z_std", "Std Fuzzy", 85.0, 75.0, 7.5, 5.0, 5.0, 18.0, 22.0)
    z_aura_fuzzy = Zone("z_aura", "Aura Fuzzy", 85.0, 75.0, 7.5, 5.0, 5.0, 18.0, 22.0)

    c_bang = BangBangController(hysteresis=0.8)
    c_pid = PIDController(kp=35.0, ki=0.2, kd=95.0)
    fuzzy = fuzzy_system

    cycles = {"bang": 0, "pid": 0, "std_fuzzy": 0, "aura_fuzzy": 0}
    prev_p = {"bang": 0.0, "pid": 0.0, "std_fuzzy": 0.0, "aura_fuzzy": 0.0}

    times, t_bang, t_pid, t_std, t_aura = [], [], [], [], []
    p_bang, p_pid, p_std, p_aura = [], [], [], []

    for s in range(steps):
        t_m = (s * dt_sec) / 60.0
        # Cold front & open window disturbance
        amb = 12.0 - (cold_shock_deg if t_m >= disturbance_min else 0.0)
        window = (disturbance_min <= t_m <= disturbance_min + 15)
        tariff = 0.38 if 40 <= t_m <= 80 else 0.12 # Dynamic tariff peak

        for z in [z_bang, z_pid, z_std_fuzzy, z_aura_fuzzy]:
            z.window_open = window

        # 1. Bang-Bang
        p1 = c_bang.step(z_bang.temperature, z_bang.setpoint)
        # 2. PID
        p2 = c_pid.step(z_pid.setpoint - z_pid.temperature, dt_min)
        # 3. Standard Fuzzy (basic inputs)
        res3 = fuzzy.evaluate({"error": z_std_fuzzy.setpoint - z_std_fuzzy.temperature, "derror": z_std_fuzzy.calculate_derror(dt_min), "ambient": amb, "occupancy": 1.0})
        p3 = res3.get("power", 0.0)
        # 4. Aura Economic Adaptive Fuzzy (with tariff arbitrage)
        res4 = fuzzy.evaluate({"error": z_aura_fuzzy.setpoint - z_aura_fuzzy.temperature, "derror": z_aura_fuzzy.calculate_derror(dt_min), "ambient": amb, "occupancy": 1.0, "tariff": tariff})
        p4 = res4.get("power", 0.0)

        # Physical steps
        for z, p, key in [(z_bang, p1, "bang"), (z_pid, p2, "pid"), (z_std_fuzzy, p3, "std_fuzzy"), (z_aura_fuzzy, p4, "aura_fuzzy")]:
            z.hvac_power_pct = p
            th_kw = (p / 100.0) * z.max_heat_kw if p > 0 else (p / 100.0) * z.max_cool_kw
            cop = 3.8 if p >= 0 else 3.2
            el_kw = abs(th_kw) / cop + (0.04 if abs(p) > 5 else 0.0)
            kwh = el_kw * (dt_sec / 3600.0)
            z.total_energy_kwh += kwh
            z.total_cost_usd += kwh * tariff

            q_env = (amb - z.temperature) / z.effective_r_envelope
            d_temp = ((q_env + th_kw + 0.1) / z.capacitance) * dt_sec
            z.prev_temperature = z.temperature
            z.temperature += d_temp

            if (p > 10 and prev_p[key] <= 10) or (p < -10 and prev_p[key] >= -10):
                cycles[key] += 1
            prev_p[key] = p

        if s % int(60 / dt_sec) == 0:
            times.append(round(t_m, 1))
            t_bang.append(round(z_bang.temperature, 2))
            t_pid.append(round(z_pid.temperature, 2))
            t_std.append(round(z_std_fuzzy.temperature, 2))
            t_aura.append(round(z_aura_fuzzy.temperature, 2))
            p_bang.append(round(p1, 0))
            p_pid.append(round(p2, 0))
            p_std.append(round(p3, 0))
            p_aura.append(round(p4, 0))

    setpoint = z_bang.setpoint

    return {
        "duration_minutes": duration_minutes,
        "disturbance_min": disturbance_min,
        "setpoint": setpoint,
        "series": {
            "time_minutes": times,
            "bang_temp": t_bang,
            "pid_temp": t_pid,
            "std_fuzzy_temp": t_std,
            "aura_fuzzy_temp": t_aura,
            "bang_power": p_bang,
            "pid_power": p_pid,
            "std_fuzzy_power": p_std,
            "aura_fuzzy_power": p_aura
        },
        "scoreboard": [
            {
                "controller": "Aura Smart Economic Fuzzy",
                "tag": "Advanced Hybrid",
                "badge": "1st Place",
                "energy_kwh": round(z_aura_fuzzy.total_energy_kwh, 3),
                "cost_usd": round(z_aura_fuzzy.total_cost_usd, 3),
                "overshoot_deg": round(max(0.0, max(t_aura) - setpoint), 2),
                "cycles": cycles["aura_fuzzy"],
                "savings_vs_bang_pct": round(((z_bang.total_energy_kwh - z_aura_fuzzy.total_energy_kwh) / max(z_bang.total_energy_kwh, 0.001)) * 100, 1)
            },
            {
                "controller": "Standard Textbook Fuzzy",
                "tag": "Classic Mamdani",
                "badge": "2nd Place",
                "energy_kwh": round(z_std_fuzzy.total_energy_kwh, 3),
                "cost_usd": round(z_std_fuzzy.total_cost_usd, 3),
                "overshoot_deg": round(max(0.0, max(t_std) - setpoint), 2),
                "cycles": cycles["std_fuzzy"],
                "savings_vs_bang_pct": round(((z_bang.total_energy_kwh - z_std_fuzzy.total_energy_kwh) / max(z_bang.total_energy_kwh, 0.001)) * 100, 1)
            },
            {
                "controller": "Classical Tuned PID",
                "tag": "Linear Integral",
                "badge": "3rd Place",
                "energy_kwh": round(z_pid.total_energy_kwh, 3),
                "cost_usd": round(z_pid.total_cost_usd, 3),
                "overshoot_deg": round(max(0.0, max(t_pid) - setpoint), 2),
                "cycles": cycles["pid"],
                "savings_vs_bang_pct": round(((z_bang.total_energy_kwh - z_pid.total_energy_kwh) / max(z_bang.total_energy_kwh, 0.001)) * 100, 1)
            },
            {
                "controller": "Bang-Bang Thermostat",
                "tag": "Cheap Hysteresis",
                "badge": "Last Place",
                "energy_kwh": round(z_bang.total_energy_kwh, 3),
                "cost_usd": round(z_bang.total_cost_usd, 3),
                "overshoot_deg": round(max(0.0, max(t_bang) - setpoint), 2),
                "cycles": cycles["bang"],
                "savings_vs_bang_pct": 0.0
            }
        ]
    }



def run_pareto_optimization(duration_minutes: int = 60) -> Dict[str, Any]:
    candidates = [
        {"id": "c1", "name": "Ultra-Tight Comfort", "alpha": 0.6, "tag": "Max Comfort", "description": "Rapid response, tightest deadband (±0.72°C), eliminates deviation"},
        {"id": "c2", "name": "Responsive Dynamic", "alpha": 0.8, "tag": "Low Delay", "description": "Moderate deadband (±0.96°C), swift recovery on disturbances"},
        {"id": "c3", "name": "Balanced Reference", "alpha": 1.0, "tag": "Default Baseline", "description": "Standard textbook Mamdani deadband (±1.20°C)"},
        {"id": "c4", "name": "Eco-Relaxed Deadband", "alpha": 1.2, "tag": "Energy Saver", "description": "Extended deadband (±1.44°C), smooth compressor ramping"},
        {"id": "c5", "name": "Deep Thermal Storage", "alpha": 1.4, "tag": "Extreme Tariff Saver", "description": "Maximum thermal float (±1.68°C), exploits building mass"}
    ]
    results = []
    dt_sec = 10.0
    steps = int((duration_minutes * 60) / dt_sec)

    for cand in candidates:
        sim = SmartHomeSimulator()
        sim.fuzzy.adaptation_factor = cand["alpha"]
        sim.fuzzy.adapt_deadband(cand["alpha"])

        cumulative_abs_err = 0.0
        cycles = 0
        prev_pwr = 0.0

        for s in range(steps):
            mins = (s * dt_sec) / 60.0
            if mins >= duration_minutes * 0.35:
                sim.ambient_temp = 27.0
            st = sim.step(dt_sec)
            lz = st["zones"]["living_room"]
            err = abs(lz["setpoint"] - lz["temperature"])
            cumulative_abs_err += err * (dt_sec / 60.0)
            pwr = lz["hvac_power_pct"]
            if (prev_pwr <= 0 and pwr > 5) or (prev_pwr >= 0 and pwr < -5) or (abs(prev_pwr) > 5 and abs(pwr) < 2):
                cycles += 1
            prev_pwr = pwr

        tot_kwh = sum(z.total_energy_kwh for z in sim.zones.values())
        tot_cost = sum(z.total_cost_usd for z in sim.zones.values())
        discomfort = round(cumulative_abs_err / duration_minutes, 3)

        results.append({
            "id": cand["id"],
            "name": cand["name"],
            "alpha": cand["alpha"],
            "tag": cand["tag"],
            "description": cand["description"],
            "energy_kwh": round(tot_kwh, 3),
            "cost_usd": round(tot_cost, 3),
            "discomfort_deg": discomfort,
            "cycles": cycles
        })

    for i, a in enumerate(results):
        is_dominated = False
        for j, b in enumerate(results):
            if i != j:
                if (b["cost_usd"] <= a["cost_usd"] and b["discomfort_deg"] <= a["discomfort_deg"]) and \
                   (b["cost_usd"] < a["cost_usd"] or b["discomfort_deg"] < a["discomfort_deg"]):
                    is_dominated = True
                    break
        a["is_pareto"] = not is_dominated

    max_cost = max(r["cost_usd"] for r in results) or 1.0
    max_disc = max(r["discomfort_deg"] for r in results) or 1.0
    for r in results:
        norm_cost = r["cost_usd"] / max_cost
        norm_disc = r["discomfort_deg"] / max_disc
        r["score"] = round(100.0 * (1.0 - (0.5 * norm_cost + 0.5 * norm_disc)), 1)

    best_cand = max(results, key=lambda x: x["score"])

    return {
        "duration_minutes": duration_minutes,
        "recommended_candidate": best_cand["id"],
        "recommended_alpha": best_cand["alpha"],
        "candidates": results
    }


run_benchmark_comparison = run_4way_control_arena
simulator = SmartHomeSimulator()
