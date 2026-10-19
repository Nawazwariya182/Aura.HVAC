import urllib.request
import json

def test():
    endpoints = [
        ("GET", "http://127.0.0.1:8000/api/health", None),
        ("POST", "http://127.0.0.1:8000/api/fuzzy/evaluate", {
            "error": 2.5,
            "derror": -0.4,
            "ambient": 15.0,
            "occupancy": 2,
            "tariff": 0.18,
            "defuzz_method": "centroid"
        }),
        ("POST", "http://127.0.0.1:8000/api/fuzzy/adapt", {"inertia_factor": 0.85}),
        ("POST", "http://127.0.0.1:8000/api/simulation/zone", {
            "zone_id": "living_room",
            "setpoint": 21.5,
            "occupants": 3
        }),
        ("POST", "http://127.0.0.1:8000/api/simulation/disturbance", {
            "zone_id": "kitchen",
            "disturbance_type": "cooking_stove",
            "active": True,
            "watts": 900.0
        }),
        ("POST", "http://127.0.0.1:8000/api/simulation/door", {
            "zone_id": "office",
            "open_state": False
        }),
        ("POST", "http://127.0.0.1:8000/api/simulation/circadian", {"enabled": True}),
        ("POST", "http://127.0.0.1:8000/api/arena/run", {
            "duration_minutes": 120,
            "disturbance_min": 35,
            "cold_shock_deg": 7.0
        }),
        ("POST", "http://127.0.0.1:8000/api/simulation/crisis", {"scenario_id": "heat_dome"}),
        ("POST", "http://127.0.0.1:8000/api/fuzzy/optimize", {"duration_minutes": 45}),
    ]

    for method, url, body in endpoints:
        data = json.dumps(body).encode() if body else None
        headers = {"Content-Type": "application/json"} if body else {}
        req = urllib.request.Request(url, data=data, headers=headers, method=method)
        resp = urllib.request.urlopen(req)
        res_data = json.loads(resp.read().decode())
        print(f"PASS [{method}] {url.split(':8000')[-1]} => Status {resp.status}")
        if "arena" in url:
            print(f"      Scoreboard: {len(res_data['scoreboard'])} controllers tested")
            for entry in res_data["scoreboard"]:
                print(f"      - {entry['badge']}: {entry['controller']} | Energy: {entry['energy_kwh']} kWh | Cost: ${entry['cost_usd']}")

if __name__ == "__main__":
    test()
