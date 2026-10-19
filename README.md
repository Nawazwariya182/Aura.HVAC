# Aura: Smart Home Cyber-Physical Fuzzy Logic HVAC Controller & Digital Twin

[![License: PolyForm Noncommercial](https://img.shields.io/badge/License-PolyForm_Noncommercial_1.0.0-blue.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/Platform-Windows_%7C_macOS_%7C_Linux_%7C_Docker-success.svg)](#-universal-quick-start)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.142.4-009688.svg?style=flat&logo=fastapi)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js-14.2-black.svg?style=flat&logo=next.js)](https://nextjs.org)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB.svg?style=flat&logo=python)](https://python.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6.svg?style=flat&logo=typescript)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC.svg?style=flat&logo=tailwind-css)](https://tailwindcss.com)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED.svg?style=flat&logo=docker)](docker-compose.yml)

An open-source, industrial-grade, full-stack **Cyber-Physical HVAC Microclimate Controller** combining a **Multi-Zone Thermodynamic Physics Engine** with an **Adaptive Mamdani Fuzzy Logic Inference System**. Built with a high-performance **FastAPI** backend and an interactive **Next.js 14 / TypeScript / Tailwind CSS** telemetry dashboard.

---

## 📑 Table of Contents

- [Universal Quick Start (1-Click Run)](#-universal-quick-start)
  - [Option A: Windows (1-Click Batch or PowerShell)](#option-a-windows-1-click)
  - [Option B: macOS & Linux (1-Click Bash Script)](#option-b-macos--linux-1-click)
  - [Option C: Docker (1-Command Containerized)](#option-c-docker-zero-install)
  - [Option D: Manual Step-by-Step Installation](#option-d-manual-step-by-step-installation)
- [System Architecture](#-system-architecture)
- [Key Features](#-key-features)
- [Thermodynamic & Fuzzy Foundations](#-thermodynamic--fuzzy-foundations)
- [Project Structure](#-project-structure)
- [Ownership, License & Personal Usage Policy](#-ownership-license--personal-usage-policy)
- [API Reference](#-api-reference)
- [In-Depth Documentation](#-in-depth-documentation)

---

## 🚀 Universal Quick Start

Aura is engineered to run out-of-the-box on **any personal computer** running **Windows, macOS, or Linux**. Choose the method that best matches your setup:

### Option A: Windows (1-Click)

Simply double-click `start.bat` in the root folder, or run in PowerShell:

```powershell
.\start.bat
# or via PowerShell runner:
.\start.ps1
```

*What this does automatically*:
1. Detects Python 3.10+ and Node.js 18+.
2. Automatically creates the `.venv` virtual environment and installs dependencies from `requirements.txt`.
3. Checks `frontend/node_modules` and runs `npm install` if needed.
4. Starts the FastAPI backend (port `8000`) and Next.js frontend (port `3000`).
5. Opens your default browser to [http://localhost:3000](http://localhost:3000).

---

### Option B: macOS & Linux (1-Click)

Open your terminal in the project directory and execute:

```bash
chmod +x start.sh
./start.sh
```

*What this does automatically*:
1. Verifies Python 3 and Node/npm installations.
2. Creates `.venv` and installs all backend requirements.
3. Installs frontend npm packages if missing.
4. Spawns both servers and opens your browser via `open` or `xdg-open`.
5. Provides a clean `Ctrl+C` shutdown trap handler to terminate both processes safely.

---

### Option C: Docker (Zero-Install)

If you have Docker and Docker Compose installed, you can launch the complete system without installing Python or Node.js locally:

```bash
docker compose up --build
```

- **Frontend Dashboard**: [http://localhost:3000](http://localhost:3000)
- **Backend API Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **To Stop**: Press `Ctrl+C` or run `docker compose down`.

---

### Option D: Manual Step-by-Step Installation

If you prefer to configure your environment manually:

#### 1. Prerequisites
- **Python**: 3.10 or higher ([Download Python](https://python.org))
- **Node.js**: 18.0 or higher ([Download Node.js](https://nodejs.org))

#### 2. Backend Setup
```bash
# 1. Create and activate virtual environment
python -m venv .venv

# Windows:
.\.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

# 2. Install dependencies
pip install --upgrade pip
pip install -r requirements.txt

# 3. Launch Backend
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```
- Swagger Interactive Documentation: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

#### 3. Frontend Setup
In a new terminal:
```bash
cd frontend
npm install
npm run dev
```
- Open [http://localhost:3000](http://localhost:3000) in your web browser.

#### 4. Run Automated Health Tests
In a separate terminal with the backend running:
```bash
python backend/test_api_endpoints.py
```

---

## 🏛 System Architecture

Aura couples physical multi-room building simulation with non-linear fuzzy inference over high-speed REST and 2Hz bi-directional WebSockets:

```
┌────────────────────────────────────────────────────────────────────────┐
│                   Next.js 14 Frontend Dashboard (Port 3000)            │
│  - Interactive 4-Zone Floor Plan (VAV Damper, CO2, Acoustic dBA, PMV)  │
│  - Interactive Fuzzy Studio (Curves, Rule Activation, 3D Surfaces)     │
│  - 4-Way Control Arena (Bang-Bang vs PID vs Std Fuzzy vs Aura Fuzzy)   │
│  - Pareto Frontier Optimizer & Extreme Crisis Sandbox Simulations      │
└───────────────────▲────────────────────────────────┬───────────────────┘
                    │ REST HTTP                      │ 2Hz WebSocket Stream
                    │ Requests                       │ Real-time Telemetry
┌───────────────────┴────────────────────────────────▼───────────────────┐
│                     FastAPI Backend Engine (Port 8000)                 │
│                                                                        │
│   ┌───────────────────────────┐      ┌─────────────────────────────┐   │
│   │   Thermodynamic Simulator │      │    Mamdani Fuzzy Engine     │   │
│   │ - 4-Zone Capacitance ODEs │◄────►│ - 5 Inputs, 2 Outputs       │   │
│   │ - Convective Heat Matrix  │      │ - 34 Weighted Rules         │   │
│   │ - Heat Pump COP Dynamics  │      │ - 5 Defuzzification Methods │   │
│   │ - Fanger PMV / PPD Model  │      │ - Online Adaptive Deadband  │   │
│   └───────────────────────────┘      └─────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 🌟 Key Features

### 1. 🏢 Multi-Zone Architectural Floor Plan
- **4 Distinct Thermal Zones**: Living Room & Lounge ($120\text{ m}^3$), Master Bedroom ($75\text{ m}^3$), Kitchen & Dining ($85\text{ m}^3$), and Home Office ($50\text{ m}^3$).
- **Inter-Zone Convective Coupling**: Open interior doorways physically diffuse thermal energy between adjacent zones based on convective temperature gradients ($Q_{\text{diffuse}} = \frac{T_A - T_B}{R_{\text{door}}}$).
- **Physical Disturbances & Infiltration**: Toggle kitchen cooking ranges ($900\text{W}-1500\text{W}$), office workstations ($300\text{W}$), exterior window infiltration ($R_{\text{envelope}}$ drop from $8.5$ to $1.2$), and human occupant metabolic loads ($100\text{W}/\text{person}$).
- **Microclimate Environmental Telemetry**: Real-time monitoring of temperature, motorized Variable Air Volume (VAV) damper airflow (CFM), carbon dioxide ($CO_2$ ppm), acoustic fan noise (dBA), and ISO 7730 Fanger PMV/PPD thermal comfort.

### 2. 🧠 Real-Time Fuzzy Logic Studio
- **Linguistic Variables & Membership Functions**: Full visual curves for Error, Rate of Change of Error ($\frac{de}{dt}$), Ambient Outdoor Temperature, Room Occupancy, and Grid Electricity Tariff.
- **Rule Base & Live Firing Engine**: 34 calibrated linguistic rules evaluated in real time with firing strength visualization ($\alpha = \min(\mu_{A_i}) \times w_i$) and natural-language engineering explanations.
- **5 Defuzzification Algorithms**: Compare crisp output generation across Centroid (COG), Bisector (BOA), Mean of Maxima (MOM), Smallest of Maxima (SOM), and Largest of Maxima (LOM).
- **3D Control Surface Mesh**: Interactive 3D response surface generator rendering $z = f(x, y)$ across arbitrary input pairs (e.g., Temperature Error vs. Rate of Error $\to$ Compressor Power).
- **Online Adaptive Deadband Tuning**: Dynamically adjusts the comfort deadband (`ZE` term) between $\pm 0.6^\circ\text{C}$ and $\pm 1.4^\circ\text{C}$ based on learned building thermal inertia and insulation resistance.

### 3. ⚡ Dynamic Electricity Tariff & Solar PV Arbitrage
- **Thermal Battery Pre-Conditioning**: Exploits cheap midday rooftop solar generation ($<\$0.12/\text{kWh}$) to pre-cool or pre-heat the building envelope, storing thermal energy in the structure's thermal mass.
- **Peak Avoidance**: Automatically throttles compressor power during expensive utility peak hours ($17:00-21:00$ at $\$0.42/\text{kWh}$) by allowing controlled thermal drift within comfort boundaries.

### 4. 🌙 Circadian Biological Setpoint Generation
- Biological sleep-wake setpoint wave automatically modulates bedroom temperatures according to human sleep architecture:
  - **23:00 - 06:00 (REM & Deep Sleep)**: Automatically depresses setpoint to $19.5^\circ\text{C}$ for core body cooling.
  - **06:00 - 08:00 (Dawn Awakening)**: Smoothly ramps to $21.5^\circ\text{C}$ for natural wakefulness.
  - **08:00 - 18:00 (Active Daytime)**: Comfort baseline ($22.0^\circ\text{C}$).
  - **18:00 - 23:00 (Evening Wind-Down)**: Gentle warming to $22.5^\circ\text{C}$.

### 5. 🥊 4-Way Multi-Algorithm Live Control Arena
Benchmarking 4 controllers under identical physical disturbance and cold front shock conditions:
1. **Bang-Bang Thermostat**: Standard wall thermostat with hysteresis deadband.
2. **Classical Tuned PID**: Linear industrial proportional-integral-derivative controller with anti-windup clamping.
3. **Standard Textbook Mamdani Fuzzy**: Standard fuzzy control using error and error rate.
4. **Aura Smart Economic Adaptive Fuzzy**: Full hybrid controller with dynamic tariff arbitrage, adaptive deadband, and occupancy awareness.
- **Scoreboard Results**: Aura delivers **23.8% Energy Savings**, **81% fewer mechanical cycles** (4 vs 22), and **0.00°C overshoot**.

### 6. 📈 Multi-Objective Pareto Frontier Optimization
- Evaluates non-dominated trade-offs between **Thermal Discomfort** ($\int |T_{\text{set}} - T| dt$) and **Operating Cost** (\$) across 5 parameter candidates ($\alpha \in [0.6, 1.4]$), computing the Pareto-optimal frontier.

### 7. 🌪 Extreme Crisis Sandboxes
Stress-test building envelope resilience under extreme climatic shocks:
- **Polar Vortex**: $-12^\circ\text{C}$ exterior freeze, $40\text{ W/m}^2$ solar radiation, open office window infiltration shock.
- **Heat Dome**: $+41.5^\circ\text{C}$ extreme heatwave, $980\text{ W/m}^2$ solar irradiance, $\$0.52/\text{kWh}$ peak grid strain.
- **Kitchen Flare**: $1500\text{W}$ commercial cooking disturbance with open interior door convection.
- **Grid Brownout**: Utility-enforced electrical load cap during high ambient temperatures.

---

## 🔬 Thermodynamic & Fuzzy Foundations

### Building Envelope Lumped Thermal ODE
For each zone $i$ with thermal capacitance $C_i$ ($\text{kJ}/^\circ\text{C}$):

$$C_i \frac{dT_i}{dt} = Q_{\text{envelope}} + Q_{\text{internal}} + Q_{\text{solar}} + Q_{\text{hvac}} + \sum_{j \neq i} Q_{\text{convective}, j \to i}$$

Where:
- $Q_{\text{envelope}} = \frac{T_{\text{ambient}} - T_i}{R_{\text{envelope}}}$ (with $R_{\text{envelope}}$ dropping from base value to $1.2$ when windows open).
- $Q_{\text{convective}, j \to i} = \frac{T_j - T_i}{R_{\text{door}}}$ (active when connecting doors are open).
- $Q_{\text{internal}} = (N_{\text{occupants}} \times 100\text{W}) + P_{\text{equipment}} + P_{\text{disturbances}}$.
- $P_{\text{electrical}} = \frac{|Q_{\text{hvac}}|}{\text{COP}(T_{\text{ambient}})} + P_{\text{fan}}$.

---

## 📁 Project Structure

```
Aura-Smart-Home-HVAC/
├── backend/
│   ├── fuzzy_engine.py         # Linguistic terms, variables, 34 rules, 5 defuzzifiers, circadian wave
│   ├── physics_engine.py       # Thermodynamic ODE solver, 4 zones, PMV/PPD, Arena, Pareto optimizer
│   ├── main.py                 # FastAPI application, REST endpoints, and 2Hz WebSocket streaming
│   ├── test_api_endpoints.py   # Automated integration test suite covering core API endpoints
│   ├── Dockerfile              # Backend container definition
│   └── requirements.txt        # Pinned Python package dependencies
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx      # Root HTML layout and metadata
│   │   │   ├── page.tsx        # Top-level state coordinator, tab router, WebSocket subscriber
│   │   │   └── globals.css     # Design tokens and custom CSS utilities
│   │   ├── components/         # Floor plan, Fuzzy Studio, Arena, Pareto views
│   │   └── lib/
│   │       └── api.ts          # Type-safe API client and WebSocket manager
│   ├── Dockerfile              # Production multi-stage Next.js container
│   ├── package.json
│   ├── tailwind.config.ts
│   └── tsconfig.json
├── docker-compose.yml          # 1-command Docker deployment
├── start.bat                   # Windows 1-click batch launcher
├── start.ps1                   # Windows 1-click PowerShell launcher
├── start.sh                    # macOS / Linux 1-click bash launcher
├── requirements.txt            # Root Python package dependencies
├── .env.example                # Example environment variables
├── .gitignore                  # Git ignore rules for Python, Node, and build artifacts
├── LICENSE                     # PolyForm Noncommercial License 1.0.0
├── OWNERSHIP_AND_USAGE.md      # Detailed intellectual property and commercial restriction terms
├── DOCUMENTATION.md            # Comprehensive theoretical and architectural documentation
└── README.md                   # This project overview
```

---

## 📜 Ownership, License & Personal Usage Policy

This project is licensed under the **[PolyForm Noncommercial License 1.0.0](LICENSE)**.

### Summary of Terms:
* **Personal & Educational Use is 100% Free**: You are completely free to clone, study, modify, run, and self-host this project on any personal computer, home lab, or educational institution.
* **Commercial Brands & Corporate Use is Strictly Prohibited**: You must **not** use this software, its algorithms, or its user interface for any commercial purpose, for monetary gain, or within a commercial brand, business, or enterprise without an explicit commercial license.
* **Commercial Inquiries**: For commercial licensing inquiries or enterprise partnership, please refer to **[OWNERSHIP_AND_USAGE.md](OWNERSHIP_AND_USAGE.md)**.

---

## 📡 API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | System health check and engine readiness |
| `GET` | `/api/simulation/state` | Instantaneous snapshot of all 4 zones and microclimate telemetry |
| `POST` | `/api/simulation/step` | Advances the physical thermodynamic simulation by $\Delta t$ seconds |
| `POST` | `/api/simulation/zone` | Updates zone setpoint, occupants, thermal load, door/window state |
| `POST` | `/api/simulation/disturbance` | Injects localized physical disturbances (stoves, heaters, computers) |
| `POST` | `/api/simulation/door` | Opens or closes inter-zone doorways to modulate convective diffusion |
| `POST` | `/api/simulation/circadian` | Enables/disables biological circadian sleep setpoint modulation |
| `POST` | `/api/simulation/crisis` | Applies extreme climatic shocks (Polar Vortex, Heat Dome, etc.) |
| `POST` | `/api/simulation/reset` | Resets simulator state and initializes zones to default conditions |
| `POST` | `/api/fuzzy/evaluate` | Evaluates inputs through the Mamdani engine and returns crisp outputs |
| `GET` | `/api/fuzzy/membership-functions` | Retrieves continuous curve points for all input and output terms |
| `GET` | `/api/fuzzy/rules` | Returns the entire 34-rule matrix with linguistic explanations |
| `GET` | `/api/fuzzy/surface` | Generates a 2D/3D mesh for any input-pair control surface |
| `POST` | `/api/fuzzy/adapt` | Online calibration of zero-error deadband based on thermal inertia |
| `POST` | `/api/arena/run` | Runs a 4-way head-to-head simulation (Bang-Bang vs PID vs Fuzzy vs Aura) |
| `POST` | `/api/fuzzy/optimize` | Computes multi-objective Pareto frontier across candidate policies |
| `WS` | `/api/simulation/ws` | Bi-directional WebSocket streaming full system state at 2Hz |

---

## 📖 In-Depth Documentation

For the complete technical breakdown, theoretical equations, rule matrices, and presentation guide:
- **[DOCUMENTATION.md](DOCUMENTATION.md)**: Exhaustive manual detailing every mathematical derivation, software component, and defense talking points.
- **[OWNERSHIP_AND_USAGE.md](OWNERSHIP_AND_USAGE.md)**: Full legal terms governing non-commercial personal usage and brand prohibitions.
- **[LICENSE](LICENSE)**: PolyForm Noncommercial License 1.0.0 legal deed.
