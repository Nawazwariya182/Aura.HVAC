"""
Advanced Cyber-Physical Fuzzy Logic Controller for Smart Home Temperature & Microclimate Management.
Features:
- Multi-Input Mamdani & TSK Inference System
- Economic Electricity Tariff & Solar PV Thermal Storage Arbitrage
- Adaptive Online Self-Tuning of Membership Function Deadbands
- Circadian Sleep-Stage Biological Setpoint Generator
- Multi-algorithm evaluation: Standard Textbook Fuzzy vs. Aura Adaptive Economic Fuzzy
"""

from typing import Dict, List, Tuple, Any, Optional
import math
import numpy as np

# -------------------------------------------------------------------------
# Mathematical Membership Functions
# -------------------------------------------------------------------------

def trimf(x: np.ndarray, params: List[float]) -> np.ndarray:
    """Triangular membership function params = [a, b, c]."""
    a, b, c = params
    y = np.zeros_like(x, dtype=float)
    if a != b:
        idx1 = np.logical_and(a <= x, x <= b)
        y[idx1] = (x[idx1] - a) / (b - a)
    else:
        y[x == a] = 1.0

    if b != c:
        idx2 = np.logical_and(b < x, x <= c)
        y[idx2] = (c - x[idx2]) / (c - b)
    else:
        y[x == c] = 1.0

    y[x == b] = 1.0
    return np.clip(y, 0.0, 1.0)


def trapmf(x: np.ndarray, params: List[float]) -> np.ndarray:
    """Trapezoidal membership function params = [a, b, c, d]."""
    a, b, c, d = params
    y = np.zeros_like(x, dtype=float)

    if a != b:
        idx1 = np.logical_and(a <= x, x < b)
        y[idx1] = (x[idx1] - a) / (b - a)
    else:
        idx1 = (x >= a) & (x < b)
        y[idx1] = 1.0

    idx2 = np.logical_and(b <= x, x <= c)
    y[idx2] = 1.0

    if c != d:
        idx3 = np.logical_and(c < x, x <= d)
        y[idx3] = (d - x[idx3]) / (d - c)
    else:
        idx3 = (x > c) & (x <= d)
        y[idx3] = 1.0

    return np.clip(y, 0.0, 1.0)


def gaussmf(x: np.ndarray, params: List[float]) -> np.ndarray:
    """Gaussian membership function params = [mean, sigma]."""
    mean, sigma = params
    if sigma <= 0:
        sigma = 1e-4
    return np.exp(-0.5 * ((x - mean) / sigma) ** 2)


# -------------------------------------------------------------------------
# Linguistic Terms & Variables
# -------------------------------------------------------------------------

class LinguisticTerm:
    def __init__(self, name: str, fn_type: str, params: List[float], label: str):
        self.name = name
        self.fn_type = fn_type
        self.params = list(params)
        self.label = label

    def evaluate(self, x: np.ndarray) -> np.ndarray:
        if self.fn_type == "trimf":
            return trimf(x, self.params)
        elif self.fn_type == "trapmf":
            return trapmf(x, self.params)
        elif self.fn_type == "gaussmf":
            return gaussmf(x, self.params)
        else:
            raise ValueError(f"Unknown membership function: {self.fn_type}")

    def evaluate_scalar(self, val: float) -> float:
        arr = np.array([val], dtype=float)
        return float(self.evaluate(arr)[0])


class FuzzyVariable:
    def __init__(self, name: str, universe: Tuple[float, float], unit: str, resolution: int = 401):
        self.name = name
        self.universe = universe
        self.unit = unit
        self.resolution = resolution
        self.x = np.linspace(universe[0], universe[1], resolution)
        self.terms: Dict[str, LinguisticTerm] = {}

    def add_term(self, name: str, fn_type: str, params: List[float], label: str):
        self.terms[name] = LinguisticTerm(name, fn_type, params, label)

    def fuzzify(self, crisp_val: float) -> Dict[str, float]:
        clamped = float(np.clip(crisp_val, self.universe[0], self.universe[1]))
        return {term_name: term.evaluate_scalar(clamped) for term_name, term in self.terms.items()}

    def get_curves(self) -> Dict[str, Any]:
        return {
            "name": self.name,
            "unit": self.unit,
            "universe": list(self.universe),
            "x": self.x.tolist(),
            "terms": {
                t_name: {
                    "label": term.label,
                    "fn_type": term.fn_type,
                    "params": term.params,
                    "y": term.evaluate(self.x).tolist()
                }
                for t_name, term in self.terms.items()
            }
        }


class FuzzyRule:
    def __init__(
        self,
        rule_id: int,
        antecedents: Dict[str, str],
        consequents: Dict[str, str],
        weight: float = 1.0,
        explanation: str = ""
    ):
        self.rule_id = rule_id
        self.antecedents = antecedents
        self.consequents = consequents
        self.weight = weight
        self.explanation = explanation


# -------------------------------------------------------------------------
# Defuzzifiers
# -------------------------------------------------------------------------

def defuzzify_centroid(x: np.ndarray, mfx: np.ndarray) -> float:
    sum_mfx = np.sum(mfx)
    if sum_mfx == 0:
        return float(np.mean(x))
    return float(np.sum(x * mfx) / sum_mfx)

def defuzzify_bisector(x: np.ndarray, mfx: np.ndarray) -> float:
    total_area = np.sum(mfx)
    if total_area == 0:
        return float(np.mean(x))
    half_area = total_area / 2.0
    cum_area = np.cumsum(mfx)
    idx = np.searchsorted(cum_area, half_area)
    idx = min(max(idx, 0), len(x) - 1)
    return float(x[idx])

def defuzzify_mom(x: np.ndarray, mfx: np.ndarray) -> float:
    max_val = np.max(mfx)
    if max_val == 0:
        return float(np.mean(x))
    indices = np.where(mfx == max_val)[0]
    return float(np.mean(x[indices]))

def defuzzify_som(x: np.ndarray, mfx: np.ndarray) -> float:
    max_val = np.max(mfx)
    if max_val == 0:
        return float(x[0])
    indices = np.where(mfx == max_val)[0]
    return float(x[indices[0]])

def defuzzify_lom(x: np.ndarray, mfx: np.ndarray) -> float:
    max_val = np.max(mfx)
    if max_val == 0:
        return float(x[-1])
    indices = np.where(mfx == max_val)[0]
    return float(x[indices[-1]])


# -------------------------------------------------------------------------
# Full Smart Home Fuzzy System
# -------------------------------------------------------------------------

class SmartHomeFuzzySystem:
    def __init__(self, defuzz_method: str = "centroid"):
        self.defuzz_method = defuzz_method
        self.inputs: Dict[str, FuzzyVariable] = {}
        self.outputs: Dict[str, FuzzyVariable] = {}
        self.rules: List[FuzzyRule] = []
        self.adaptation_factor: float = 1.0 # 1.0 = standard, <1.0 = tighter deadband (high insulation)
        self.adaptation_history: List[Dict[str, Any]] = []
        self._build_system()

    def _build_system(self):
        # 1. Error e = T_set - T_cur (°C)
        var_error = FuzzyVariable("error", (-10.0, 10.0), "°C", resolution=401)
        var_error.add_term("NL", "trapmf", [-10.0, -10.0, -5.0, -2.5], "Negative Large (Too Warm)")
        var_error.add_term("NM", "trimf", [-4.0, -2.0, 0.0], "Negative Medium (Slightly Warm)")
        var_error.add_term("ZE", "trimf", [-1.2, 0.0, 1.2], "Zero (Comfort Deadband)")
        var_error.add_term("PM", "trimf", [0.0, 2.0, 4.0], "Positive Medium (Slightly Cold)")
        var_error.add_term("PL", "trapmf", [2.5, 5.0, 10.0, 10.0], "Positive Large (Too Cold)")
        self.inputs["error"] = var_error

        # 2. Rate of Change de/dt (°C/min)
        var_derror = FuzzyVariable("derror", (-2.0, 2.0), "°C/min", resolution=401)
        var_derror.add_term("NF", "trapmf", [-2.0, -2.0, -1.0, -0.4], "Negative Fast (Rapidly Warming)")
        var_derror.add_term("NS", "trimf", [-0.8, -0.3, 0.0], "Negative Slow (Slowly Warming)")
        var_derror.add_term("ZE", "trimf", [-0.2, 0.0, 0.2], "Zero (Equilibrium)")
        var_derror.add_term("PS", "trimf", [0.0, 0.3, 0.8], "Positive Slow (Slowly Cooling)")
        var_derror.add_term("PF", "trapmf", [0.4, 1.0, 2.0, 2.0], "Positive Fast (Rapidly Cooling)")
        self.inputs["derror"] = var_derror

        # 3. Ambient Outdoor Temperature (°C)
        var_ambient = FuzzyVariable("ambient", (-10.0, 45.0), "°C", resolution=401)
        var_ambient.add_term("FREEZING", "trapmf", [-10.0, -10.0, 0.0, 6.0], "Freezing (< 5°C)")
        var_ambient.add_term("COLD", "trimf", [3.0, 10.0, 18.0], "Cold (5°C to 18°C)")
        var_ambient.add_term("MILD", "trimf", [15.0, 21.0, 27.0], "Mild (21°C)")
        var_ambient.add_term("WARM", "trimf", [24.0, 30.0, 36.0], "Warm (24°C to 36°C)")
        var_ambient.add_term("SCORCHING", "trapmf", [33.0, 38.0, 45.0, 45.0], "Scorching (> 35°C)")
        self.inputs["ambient"] = var_ambient

        # 4. Room Occupancy (persons)
        var_occ = FuzzyVariable("occupancy", (0.0, 8.0), "persons", resolution=201)
        var_occ.add_term("EMPTY", "trapmf", [0.0, 0.0, 0.2, 0.8], "Empty (0 occupants)")
        var_occ.add_term("LIGHT", "trimf", [0.5, 1.5, 3.0], "Light Occupancy (1-2 persons)")
        var_occ.add_term("CROWDED", "trapmf", [2.5, 4.0, 8.0, 8.0], "Crowded (3+ persons)")
        self.inputs["occupancy"] = var_occ

        # 5. NEW: Dynamic Grid Electricity Tariff ($/kWh)
        var_tariff = FuzzyVariable("tariff", (0.0, 0.60), "$/kWh", resolution=301)
        var_tariff.add_term("CHEAP_SOLAR", "trapmf", [0.0, 0.0, 0.08, 0.14], "Cheap Off-Peak / High Solar (< $0.12/kWh)")
        var_tariff.add_term("NORMAL", "trimf", [0.10, 0.18, 0.28], "Standard Utility Rate (~$0.18/kWh)")
        var_tariff.add_term("EXPENSIVE_PEAK", "trapmf", [0.24, 0.35, 0.60, 0.60], "Peak Grid Pricing (> $0.30/kWh)")
        self.inputs["tariff"] = var_tariff

        # Outputs
        var_power = FuzzyVariable("power", (-100.0, 100.0), "%", resolution=501)
        var_power.add_term("COOL_MAX", "trapmf", [-100.0, -100.0, -80.0, -50.0], "Maximum Cooling (-100% to -50%)")
        var_power.add_term("COOL_MOD", "trimf", [-65.0, -35.0, -5.0], "Moderate Cooling (-65% to -5%)")
        var_power.add_term("OFF", "trimf", [-15.0, 0.0, 15.0], "HVAC Standby (0%)")
        var_power.add_term("HEAT_MOD", "trimf", [5.0, 35.0, 65.0], "Moderate Heating (+5% to +65%)")
        var_power.add_term("HEAT_MAX", "trapmf", [50.0, 80.0, 100.0, 100.0], "Maximum Heating (+50% to +100%)")
        self.outputs["power"] = var_power

        var_fan = FuzzyVariable("fan_speed", (0.0, 100.0), "%", resolution=401)
        var_fan.add_term("OFF", "trapmf", [0.0, 0.0, 5.0, 15.0], "Blower Off (0-10%)")
        var_fan.add_term("LOW", "trimf", [10.0, 30.0, 50.0], "Low Speed (30%)")
        var_fan.add_term("MED", "trimf", [35.0, 55.0, 75.0], "Medium Speed (55%)")
        var_fan.add_term("HIGH", "trimf", [65.0, 80.0, 95.0], "High Speed (80%)")
        var_fan.add_term("TURBO", "trapmf", [85.0, 95.0, 100.0, 100.0], "Turbo Boost (100%)")
        self.outputs["fan_speed"] = var_fan

        self._build_rules()

    def _build_rules(self):
        rules_data = [
            # Standard Thermal Comfort Rules
            ({"error": "NL", "derror": "NF"}, {"power": "COOL_MAX", "fan_speed": "TURBO"}, 1.0, "Severe heat rising: Full cooling & Turbo fan"),
            ({"error": "NL", "derror": "NS"}, {"power": "COOL_MAX", "fan_speed": "HIGH"}, 1.0, "Severe heat creeping: Full cooling & High fan"),
            ({"error": "NL", "derror": "ZE"}, {"power": "COOL_MAX", "fan_speed": "HIGH"}, 1.0, "Severe heat steady: Full cooling & High fan"),
            ({"error": "NL", "derror": "PS"}, {"power": "COOL_MAX", "fan_speed": "MED"}, 0.95, "Severe heat recovering: Maintain cooling"),
            ({"error": "NL", "derror": "PF"}, {"power": "COOL_MOD", "fan_speed": "MED"}, 0.9, "Severe heat dropping fast: Step down cooling"),

            ({"error": "NM", "derror": "NF"}, {"power": "COOL_MAX", "fan_speed": "HIGH"}, 1.0, "Warm and heating fast: Preemptive full cooling"),
            ({"error": "NM", "derror": "NS"}, {"power": "COOL_MOD", "fan_speed": "MED"}, 1.0, "Warm and creeping: Moderate cooling"),
            ({"error": "NM", "derror": "ZE"}, {"power": "COOL_MOD", "fan_speed": "MED"}, 1.0, "Warm steady: Moderate cooling"),
            ({"error": "NM", "derror": "PS"}, {"power": "COOL_MOD", "fan_speed": "LOW"}, 0.9, "Warm but improving: Low cooling"),
            ({"error": "NM", "derror": "PF"}, {"power": "OFF", "fan_speed": "LOW"}, 0.85, "Warm but cooling fast: Coast to target"),

            ({"error": "ZE", "derror": "NF"}, {"power": "COOL_MOD", "fan_speed": "LOW"}, 0.85, "At target but warming fast: Pulse cool"),
            ({"error": "ZE", "derror": "NS"}, {"power": "OFF", "fan_speed": "LOW"}, 0.9, "At target, drifting warm: Gentle fan only"),
            ({"error": "ZE", "derror": "ZE"}, {"power": "OFF", "fan_speed": "OFF"}, 1.0, "Equilibrium: Standby mode"),
            ({"error": "ZE", "derror": "PS"}, {"power": "OFF", "fan_speed": "LOW"}, 0.9, "At target, drifting cool: Gentle fan only"),
            ({"error": "ZE", "derror": "PF"}, {"power": "HEAT_MOD", "fan_speed": "LOW"}, 0.85, "At target but cooling fast: Pulse heat"),

            ({"error": "PM", "derror": "NF"}, {"power": "OFF", "fan_speed": "LOW"}, 0.85, "Cool but warming fast: Coast to target"),
            ({"error": "PM", "derror": "NS"}, {"power": "HEAT_MOD", "fan_speed": "LOW"}, 0.9, "Cool and recovering: Low heat pump"),
            ({"error": "PM", "derror": "ZE"}, {"power": "HEAT_MOD", "fan_speed": "MED"}, 1.0, "Cool steady: Moderate heat pump"),
            ({"error": "PM", "derror": "PS"}, {"power": "HEAT_MOD", "fan_speed": "MED"}, 1.0, "Cool and losing heat: Moderate heat pump"),
            ({"error": "PM", "derror": "PF"}, {"power": "HEAT_MAX", "fan_speed": "HIGH"}, 1.0, "Cool and dropping fast: Boost heat pump"),

            ({"error": "PL", "derror": "NF"}, {"power": "HEAT_MOD", "fan_speed": "MED"}, 0.9, "Freezing but warming fast: Moderate heat pump"),
            ({"error": "PL", "derror": "NS"}, {"power": "HEAT_MAX", "fan_speed": "HIGH"}, 0.95, "Freezing creeping up: High heat pump"),
            ({"error": "PL", "derror": "ZE"}, {"power": "HEAT_MAX", "fan_speed": "HIGH"}, 1.0, "Freezing steady: Full heat pump"),
            ({"error": "PL", "derror": "PS"}, {"power": "HEAT_MAX", "fan_speed": "HIGH"}, 1.0, "Freezing worsening: Maximum heat pump"),
            ({"error": "PL", "derror": "PF"}, {"power": "HEAT_MAX", "fan_speed": "TURBO"}, 1.0, "Emergency cold drop: Max heat & Turbo fan"),

            # UNIQUE ECONOMIC SOLAR & TARIFF ARBITRAGE RULES (Thermal Battery Pre-Conditioning)
            ({"tariff": "CHEAP_SOLAR", "error": "ZE", "ambient": "WARM"}, {"power": "COOL_MOD", "fan_speed": "MED"}, 0.85, "Economic Arbitrage: Surplus cheap/solar electricity -> Pre-cool thermal mass of home"),
            ({"tariff": "CHEAP_SOLAR", "error": "ZE", "ambient": "COLD"}, {"power": "HEAT_MOD", "fan_speed": "MED"}, 0.85, "Economic Arbitrage: Surplus cheap/solar electricity -> Pre-heat thermal mass of home"),
            ({"tariff": "EXPENSIVE_PEAK", "error": "ZE"}, {"power": "OFF", "fan_speed": "OFF"}, 1.0, "Peak Grid Tariff: Zero power draw during expensive hours"),
            ({"tariff": "EXPENSIVE_PEAK", "error": "NM"}, {"power": "OFF", "fan_speed": "LOW"}, 0.9, "Peak Grid Tariff: Allow slight thermal drift to avoid expensive grid charges"),
            ({"tariff": "EXPENSIVE_PEAK", "error": "PM"}, {"power": "OFF", "fan_speed": "LOW"}, 0.9, "Peak Grid Tariff: Allow slight cool drift to avoid peak billing"),

            # Multi-zone Occupancy & Weather Overrides
            ({"occupancy": "CROWDED", "error": "ZE"}, {"power": "COOL_MOD", "fan_speed": "MED"}, 0.8, "Crowded room human body heat: Offset with cooling"),
            ({"occupancy": "EMPTY", "error": "ZE"}, {"power": "OFF", "fan_speed": "OFF"}, 1.0, "Empty room: Standby"),
            ({"ambient": "SCORCHING", "error": "NM"}, {"power": "COOL_MAX", "fan_speed": "HIGH"}, 0.95, "Scorching ambient: Heavy heat rejection"),
            ({"ambient": "FREEZING", "error": "PM"}, {"power": "HEAT_MAX", "fan_speed": "HIGH"}, 0.95, "Freezing ambient: Heavy heat injection")
        ]

        self.rules = [
            FuzzyRule(i, ant, con, w, exp)
            for i, (ant, con, w, exp) in enumerate(rules_data, start=1)
        ]

    def adapt_deadband(self, inertia_factor: float = 0.85) -> Dict[str, Any]:
        """
        Online self-tuning: automatically adapts the comfort deadband (ZE term)
        based on learned room thermal inertia and insulation resistance.
        """
        self.adaptation_factor = float(np.clip(inertia_factor, 0.5, 1.5))
        new_width = 1.2 * self.adaptation_factor

        # Tighten or loosen ZE term bounds
        self.inputs["error"].terms["ZE"].params = [-round(new_width, 2), 0.0, round(new_width, 2)]

        record = {
            "adaptation_factor": round(self.adaptation_factor, 2),
            "deadband_half_width": round(new_width, 2),
            "message": f"Fuzzy deadband calibrated to ±{round(new_width, 2)}°C based on thermal inertia."
        }
        self.adaptation_history.append(record)
        if len(self.adaptation_history) > 20:
            self.adaptation_history.pop(0)
        return record

    def evaluate(self, inputs: Dict[str, float], defuzz_method: Optional[str] = None) -> Dict[str, float]:
        detailed = self.evaluate_detailed(inputs, defuzz_method=defuzz_method)
        return {k: v["crisp_value"] for k, v in detailed["outputs"].items()}

    def evaluate_detailed(
        self,
        inputs: Dict[str, float],
        defuzz_method: Optional[str] = None
    ) -> Dict[str, Any]:
        method = defuzz_method or self.defuzz_method

        fuzzified: Dict[str, Dict[str, float]] = {}
        for var_name, var in self.inputs.items():
            val = inputs.get(var_name, 0.0)
            if var_name == "tariff" and "tariff" not in inputs:
                val = 0.18 # default standard utility price
            fuzzified[var_name] = var.fuzzify(val)

        rule_firings: List[Dict[str, Any]] = []
        output_consequent_activations: Dict[str, Dict[str, float]] = {
            out_name: {t_name: 0.0 for t_name in out_var.terms}
            for out_name, out_var in self.outputs.items()
        }

        for rule in self.rules:
            antecedent_strengths = []
            valid = True
            for var_name, term_name in rule.antecedents.items():
                if var_name in fuzzified and term_name in fuzzified[var_name]:
                    antecedent_strengths.append(fuzzified[var_name][term_name])
                else:
                    valid = False
                    break

            if not valid or not antecedent_strengths:
                continue

            firing_strength = float(np.min(antecedent_strengths)) * rule.weight

            if firing_strength > 1e-4:
                rule_firings.append({
                    "rule_id": rule.rule_id,
                    "antecedents": rule.antecedents,
                    "consequents": rule.consequents,
                    "weight": rule.weight,
                    "firing_strength": round(firing_strength, 4),
                    "explanation": rule.explanation
                })

                for out_name, term_name in rule.consequents.items():
                    if out_name in output_consequent_activations:
                        current = output_consequent_activations[out_name].get(term_name, 0.0)
                        output_consequent_activations[out_name][term_name] = max(current, firing_strength)

        rule_firings.sort(key=lambda r: r["firing_strength"], reverse=True)

        output_results: Dict[str, Any] = {}
        for out_name, out_var in self.outputs.items():
            x = out_var.x
            aggregated_mfx = np.zeros_like(x, dtype=float)
            term_clipped_curves: Dict[str, List[float]] = {}

            for t_name, term in out_var.terms.items():
                strength = output_consequent_activations[out_name].get(t_name, 0.0)
                term_curve = term.evaluate(x)
                clipped = np.minimum(term_curve, strength)
                term_clipped_curves[t_name] = clipped.tolist()
                aggregated_mfx = np.maximum(aggregated_mfx, clipped)

            if method == "centroid":
                crisp = defuzzify_centroid(x, aggregated_mfx)
            elif method == "bisector":
                crisp = defuzzify_bisector(x, aggregated_mfx)
            elif method == "mom":
                crisp = defuzzify_mom(x, aggregated_mfx)
            elif method == "som":
                crisp = defuzzify_som(x, aggregated_mfx)
            elif method == "lom":
                crisp = defuzzify_lom(x, aggregated_mfx)
            else:
                crisp = defuzzify_centroid(x, aggregated_mfx)

            crisp = float(np.clip(crisp, out_var.universe[0], out_var.universe[1]))

            output_results[out_name] = {
                "name": out_name,
                "unit": out_var.unit,
                "crisp_value": round(crisp, 2),
                "defuzz_method": method,
                "universe": list(out_var.universe),
                "x": x.tolist(),
                "aggregated_mfx": aggregated_mfx.tolist(),
                "term_activations": {k: round(v, 4) for k, v in output_consequent_activations[out_name].items()},
                "term_clipped": term_clipped_curves
            }

        return {
            "inputs": inputs,
            "fuzzified": {
                k: {t: round(v, 4) for t, v in terms.items()}
                for k, terms in fuzzified.items()
            },
            "active_rules_count": len(rule_firings),
            "fired_rules": rule_firings[:15],
            "outputs": output_results,
            "adaptation_factor": round(self.adaptation_factor, 2)
        }

    def generate_surface(
        self,
        var_x: str = "error",
        var_y: str = "derror",
        out_var: str = "power",
        grid_size: int = 25,
        ambient_fixed: float = 22.0,
        occupancy_fixed: float = 1.0,
        tariff_fixed: float = 0.18
    ) -> Dict[str, Any]:
        vx = self.inputs[var_x]
        vy = self.inputs[var_y]
        x_pts = np.linspace(vx.universe[0], vx.universe[1], grid_size)
        y_pts = np.linspace(vy.universe[0], vy.universe[1], grid_size)

        z_mesh = np.zeros((grid_size, grid_size), dtype=float)

        for i, val_x in enumerate(x_pts):
            for j, val_y in enumerate(y_pts):
                inp = {
                    var_x: float(val_x),
                    var_y: float(val_y),
                    "ambient": float(ambient_fixed),
                    "occupancy": float(occupancy_fixed),
                    "tariff": float(tariff_fixed)
                }
                res = self.evaluate(inp)
                z_mesh[j, i] = res.get(out_var, 0.0)

        return {
            "var_x": var_x,
            "var_y": var_y,
            "out_var": out_var,
            "x": x_pts.tolist(),
            "y": y_pts.tolist(),
            "z": z_mesh.tolist(),
            "ambient_fixed": ambient_fixed,
            "occupancy_fixed": occupancy_fixed,
            "tariff_fixed": tariff_fixed
        }

    def get_all_membership_curves(self) -> Dict[str, Any]:
        return {
            "inputs": {name: var.get_curves() for name, var in self.inputs.items()},
            "outputs": {name: var.get_curves() for name, var in self.outputs.items()}
        }

    def get_rule_matrix(self) -> List[Dict[str, Any]]:
        return [
            {
                "rule_id": r.rule_id,
                "antecedents": r.antecedents,
                "consequents": r.consequents,
                "weight": r.weight,
                "explanation": r.explanation
            }
            for r in self.rules
        ]


# Circadian biological sleep-stage thermal curve function
def get_circadian_setpoint(hour_of_day: float, base_setpoint: float = 22.0) -> Dict[str, Any]:
    """
    Biological circadian setpoint wave following human sleep stages:
    - 23:00 - 06:00: Night sleep phase (drop down to 19.5°C for deep REM sleep)
    - 06:00 - 08:00: Dawn wake-up warming curve (rises to 21.8°C)
    - 08:00 - 18:00: Daytime active comfort (22.0°C)
    - 18:00 - 23:00: Evening relaxation (22.5°C)
    """
    h = hour_of_day % 24.0
    if 23.0 <= h or h < 6.0:
        stage = "Deep Sleep / REM Phase"
        offset = -2.2
    elif 6.0 <= h < 8.0:
        stage = "Dawn Awakening Warming"
        offset = -0.5
    elif 8.0 <= h < 18.0:
        stage = "Daytime Active Comfort"
        offset = 0.0
    else:
        stage = "Evening Wind-Down"
        offset = +0.5

    target = round(base_setpoint + offset, 1)
    return {
        "hour": round(h, 1),
        "target_setpoint": target,
        "phase_name": stage,
        "offset": offset
    }


# Singleton instance
fuzzy_system = SmartHomeFuzzySystem()
