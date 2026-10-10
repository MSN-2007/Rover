# Smart Vacuum Algorithm Lab (Rover)

An interactive robotics simulation, algorithm comparison, and benchmarking laboratory for autonomous domestic vacuum cleaner agents. Developed as an engineering platform for the PBL project: **“Smart Vacuum Cleaner Agent for Intelligent Room Cleaning”**.

[![Next.js](https://img.shields.io/badge/Next.js-16.4-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.3-blue?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)
[![Specification: ROBOT.md](https://img.shields.io/badge/Spec-ROBOT.md-d97757.svg)](ROBOT.md)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 📖 Quick Links & Documentation

- [ROBOT.md](ROBOT.md) — Comprehensive technical specification, kinematic equations, sensor models, and LLM context index.
- [Algorithm Suite](#3-comprehensive-robotics-algorithm-suite) — Directory of all path planning, local avoidance, coverage, and localization algorithms.
- [Cross-Platform Setup Guides](#-operating-system-installation--setup-guides) — Step-by-step installation for Linux, Windows, and macOS.
- [Project Architecture](#%EF%B8%8F-project-architecture) — Codebase structure and module breakdown.

---

## 🌟 Key Features

### 1. Autonomous Vacuum Rover Simulation
- **Differential-Drive Kinematics**: Realistic two-wheeled chassis with continuous heading angle integration, velocity clamping, acceleration bounds ($0.60\text{ m/s}^2$), and stochastic wheel slip simulation ($2\%$).
- **High-Fidelity Rover Rendering**:
  - Motorized high-traction rubber drive tracks/treads.
  - Dual counter-rotating front sweeper brushes.
  - High-velocity center roller suction intake.
  - $360^\circ$ rotating LiDAR turret raycasting 36 scanner beams in real time.
- **Dynamic Suction Physics**:
  - Particle vortex pulling nearby floor dust into the intake aperture.
  - Airflow exhaust trail behind the chassis.
  - Real-time dust weight collection tracking ($g$) with multi-tiered suction profiles:
    - **Eco**: $1200\text{ Pa}$ suction, $0.007\%/\text{s}$ power draw, $0.70\times$ dust absorption.
    - **Standard**: $2000\text{ Pa}$ suction, $0.015\%/\text{s}$ power draw, $1.00\times$ dust absorption.
    - **Boost**: $3000\text{ Pa}$ suction, $0.025\%/\text{s}$ power draw, $1.60\times$ dust absorption.
- **Physical Charging Home Dock**: Wall-mounted charging station with metallic brass spring contacts, status LED, and soft drop shadow.

### 2. Obstacle Avoidance & Anti-Stuck System
- **Obstacle Inflation Costmap (`inflateObstacles`)**: Automatically inflates walls and furniture obstacles by $0.28\text{ m}$ (robot radius $0.25\text{ m} + 0.03\text{ m}$ safety margin) to prevent path planners from clipping table legs and tight corners.
- **Enhanced Dynamic Window Approach (DWA)**: Persistent velocity window modeling with 192 trajectory samples, zero-speed escape rotation, and clearance scoring.
- **Autonomous Stuck Recovery**: Automatic stuck detection (triggers if position displacement is $< 0.06\text{ m}$ over 2.0 seconds) that executes a two-phase escape maneuver (reverse displacement $\to$ in-place rotation toward goal).

### 3. Comprehensive Robotics Algorithm Suite
- **Global Path Planning**:
  - **A\* Search**: Optimal shortest-path search with Euclidean and Octile heuristic cost functions ($O(V \log V)$).
  - **Dijkstra’s Algorithm**: Guaranteed uniform-cost baseline search without heuristic bias.
  - **D\* Lite**: Incremental heuristic replanner tailored for unknown or dynamic floor maps.
  - **RRT / RRT\***: Rapidly-exploring Random Tree with asymptotic optimality rewiring for complex geometry.
- **Local Obstacle Avoidance & Navigation**:
  - **Dynamic Window Approach (DWA)**: Kinematically constrained velocity sampling in acceleration-limited space.
  - **Vector Field Histogram (VFH)**: Polar obstacle density histogram for smooth avoidance around moving entities.
- **Area Coverage Planning**:
  - **Boustrophedon Cellular Decomposition**: Structured back-and-forth lawnmower sweep pattern.
  - **Spanning Tree Coverage (STC)**: Hamiltonian cycle on a coarse grid decomposition.
  - **Lawnmower Coverage**: Systematic parallel sweeping line baseline.
- **Localization & State Estimation**:
  - **Extended Kalman Filter (EKF)**: Fuses wheel odometry with landmark measurements for continuous Gaussian state estimation ($x, y, \theta$).
  - **Particle Filter (Monte Carlo Localization - MCL)**: Sample-based state estimation capable of handling arbitrary non-linear and multi-modal distributions.
  - **Wheel Odometry**: Dead-reckoning differential wheel integration with drift accumulation modeling.

### 4. Procedural Environments & Dynamic Hazards
- **Diverse Room Presets**:
  - **Multi-Room Apartment (`multi_room`)**: 4 connected zones (Living Room, Bedroom, Kitchen, Bathroom) with realistic doorways and distributed furniture.
  - **Furnished Living Space (`furniture`)**: Realistic home floor plan populated with sofas, dining tables, chairs, beds, wardrobes, and desks.
  - **Corridor & Branch Rooms (`corridor`)**: Central hallway branching into multiple side rooms.
  - **Random Obstacles (`random`)**: Procedurally scattered barrier layout for stress-testing path planners.
  - **Open Floor Arena (`empty`)**: Clean baseline arena for kinematics calibration.
- **Dynamic Obstacles**: Autonomous moving entities (simulating household pets or walking humans) with real-time velocity vector prediction.
- **Stochastic Dirt Patches**: Gaussian dirt regions with variable intensity, radius, and continuous cleaning degradation.

### 5. Interactive Canvas Display Layers & Viewport
- **Real-Time Toggleable Visualization Layers**:
  - Planned path trajectory vs. actual odometry track.
  - 360° LiDAR scanner rays and contact reflection points.
  - DWA motion candidate velocity trajectories (192 arcs).
  - A* Open Set frontier and Closed Set explored search tree.
  - Dynamic obstacle velocity prediction vectors.
  - Discrete occupancy grid and inflated costmap safety zones ($0.28\text{ m}$).
  - Cleaned floor swath and coverage heatmaps.
  - Dirt and dust distribution regions.
- **Camera Viewport Controls**: Smooth zoom ($0.3\times$ to $4.5\times$), viewport panning, and single-click center reset.

### 6. Benchmarking Engine & Telemetry Panel
- **Multi-Algorithm Comparative Benchmarking**:
  - Path length ($m$)
  - Execution time ($ms$)
  - Explored nodes / search iterations
  - Area coverage ($m^2$ & $\%$)
  - Collision events
  - Total energy expenditure ($Wh$)
- **Real-Time Telemetry Drawer**: Live battery capacity curve, dust bin weight, current suction mode, linear/angular velocity readouts, and dock docking status.

### 7. Anthropic Claude Console Design System
- **Claude Console Aesthetic**: Warm charcoal dark palette (`#141413`), border strokes (`#2b2a27`), pill selectors, and serif headers.
- **Interactive Model Cards Showcase**:
  - **A\* Search**: Claude Blue (`#60a5fa`) with graph search topology.
  - **D\* Lite**: Claude Terracotta (`#d97757`) with dynamic graph repair.
  - **DWA Local**: Claude Sonnet Cream (`#f4efe6`) with kinematic trajectory arcs.
  - **Boustrophedon**: Claude Haiku Sage (`#b4d2c8`) with cellular decomposition sweeps.
- **Collapsible Workbench**: Sliding left sidebar, full-height canvas arena, and floating telemetry drawer.

---

## 💻 Operating System Installation & Setup Guides

### 🐧 Linux (Ubuntu, Debian, Fedora, Arch, WSL2)

#### 1. System Requirements & Node.js Installation
Ensure Node.js 18+ and Git are installed:

```bash
# Ubuntu / Debian / WSL2
sudo apt update && sudo apt install -y git curl
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Fedora
sudo dnf install -y git nodejs

# Arch Linux
sudo pacman -S git nodejs npm
```

Verify installation:
```bash
node -v   # Should be >= v18.0.0 (v20+ recommended)
npm -v    # Should be >= 9.0.0
```

#### 2. Clone and Install
```bash
git clone https://github.com/MSN-2007/Rover.git
cd Rover
npm install
```

#### 3. Run Development Server
```bash
npm run dev
```
Open **`http://localhost:3000`** in Firefox or Chromium.

To run on a specific port:
```bash
npm run dev -- --port 2000
```

#### 4. Production Build
```bash
npm run build
npm run start
```

---

### 🪟 Windows (Windows 10 / 11, PowerShell, CMD)

#### 1. System Requirements & Node.js Installation
- Download and run the official **Node.js LTS Installer (v20 or v22)** from [nodejs.org](https://nodejs.org/).
- Ensure **"Add to PATH"** is checked during setup.
- Install [Git for Windows](https://git-scm.com/download/win).

Verify installation in **PowerShell** or **Windows Terminal**:
```powershell
node -v
npm -v
git --version
```

#### 2. Clone and Install
```powershell
git clone https://github.com/MSN-2007/Rover.git
cd Rover
npm install
```

#### 3. Run Development Server
```powershell
npm run dev
```
Open **`http://localhost:3000`** in Chrome, Edge, or Firefox.

To run on a custom port (e.g. port 2000):
```powershell
npm run dev -- --port 2000
```

#### 4. Production Build
```powershell
npm run build
npm run start
```

> **Windows Tip**: If PowerShell displays an execution policy error when running scripts, execute:
> ```powershell
> Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
> ```

---

### 🍎 macOS (Apple Silicon M1/M2/M3/M4 & Intel)

#### 1. System Requirements & Node.js Installation
Using [Homebrew](https://brew.sh/):
```zsh
# Install Node.js and Git
brew install node git
```

Or using `nvm` (Node Version Manager):
```zsh
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.zshrc
nvm install 20
nvm use 20
```

Verify installation:
```zsh
node -v
npm -v
```

#### 2. Clone and Install
```zsh
git clone https://github.com/MSN-2007/Rover.git
cd Rover
npm install
```

#### 3. Run Development Server
```zsh
npm run dev
```
Open **`http://localhost:3000`** in Safari or Chrome.

To run on a custom port:
```zsh
npm run dev -- --port 2000
```

#### 4. Production Build
```zsh
npm run build
npm run start
```

---

## 🛠️ Alternative Package Managers

You can also run the project with your preferred package manager on any OS:

| Package Manager | Install Dependencies | Start Dev Server | Build Production |
|---|---|---|---|
| **npm** | `npm install` | `npm run dev` | `npm run build` |
| **pnpm** | `pnpm install` | `pnpm dev` | `pnpm build` |
| **yarn** | `yarn install` | `yarn dev` | `yarn build` |
| **bun** | `bun install` | `bun dev` | `bun build` |

---

## 🔍 Troubleshooting & Common Issues

### Port 3000 Already in Use
If port 3000 is occupied by another process:

- **Linux / macOS**:
  ```bash
  # Check which process is using port 3000
  lsof -i :3000
  # Kill the process
  kill -9 $(lsof -t -i :3000)
  # Or run on another port
  npm run dev -- --port 2001
  ```

- **Windows (PowerShell)**:
  ```powershell
  # Find PID on port 3000
  netstat -ano | findstr :3000
  # Stop process by PID (e.g., 1234)
  Stop-Process -Id 1234 -Force
  # Or run on another port
  npm run dev -- --port 2001
  ```

### Outdated Node Version
If you encounter `TypeError` or compilation issues during `npm run build`:
Ensure `node -v` outputs `v18.0.0` or higher. Node v20 LTS is recommended.

---

## 🏗️ Project Architecture

```
smart-vacuum-lab/
├── ROBOT.md                 # AI Model & robotics technical specifications index
├── AGENTS.md                # Next.js agent framework conventions
├── README.md                # Project overview and setup documentation
├── src/
│   ├── algorithms/          # Path planning, navigation, coverage & localization
│   │   ├── planning/        # A*, Dijkstra, D* Lite, RRT, RRT*
│   │   ├── navigation/      # Dynamic Window Approach (DWA), VFH
│   │   ├── coverage/        # Boustrophedon, Spanning Tree Coverage (STC), Lawnmower
│   │   ├── localization/    # Extended Kalman Filter (EKF), Particle Filter, Wheel Odometry
│   │   └── interfaces.ts    # Algorithm interfaces & typing contracts
│   ├── components/
│   │   ├── layout/          # MainApp layout with Claude Console workbench & navigation
│   │   ├── simulation/      # SimulationCanvas (Rover rendering), controls & layer toggles
│   │   ├── metrics/         # MetricsPanel & ComparisonPanel benchmarking engine
│   │   └── algorithms/      # AlgorithmInfoPanel (model cards & mathematical formulation)
│   ├── simulation/
│   │   ├── core/            # Grid models, physics, RNG, vector utilities
│   │   ├── environment/     # Procedural room generators & obstacle inflation (0.28m)
│   │   └── robot/           # Differential drive kinematics & 36-ray LiDAR raycasting
│   ├── store/
│   │   └── simulationStore.ts  # Zustand global state manager & stuck recovery loop
│   └── app/                 # Next.js App Router root layout & globals.css
├── public/                  # Static assets
└── package.json             # Scripts & dependencies
```

---

## 📄 License

Academic PBL Project — Developed for research and simulation of autonomous domestic cleaning robots.
Licensed under the [MIT License](LICENSE).
