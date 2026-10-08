# Smart Vacuum Algorithm Lab (Rover)

An interactive robotics simulation, algorithm comparison, and evaluation laboratory for autonomous domestic vacuum cleaner agents. Developed as an engineering platform for the PBL project: **“Smart Vacuum Cleaner Agent for Intelligent Room Cleaning”**.

---

## 🌟 Key Features

### 1. Autonomous Vacuum Rover Simulation
- **Realistic Rover Mechanics**: Differential-drive chassis with dual motorized tread wheels, active rotating front sweeper brushes, center roller vacuum intake, and a rotating 360° LiDAR turret.
- **Dynamic Particle Suction**: Dynamic dust particles ahead of the rover are actively drawn toward the underbody intake slot with animated vortex airflow and rear exhaust.
- **Home Base Docking Station**: Authentic charging dock baseplate with metallic brass contacts and status LED indicator.
- **Real-Time Telemetry**: Tracks coordinate poses $(x, y)$, heading angle $\theta$, linear velocity $v$, angular velocity $\omega$, battery discharge curves (14.4V Li-ion model), and cleaning suction modes (*Eco*, *Standard*, *Boost*).

### 2. Interactive Canvas Tools & Room Presets
- **Quick Room Presets**: 1-click room layout switching directly from the dashboard: *Living Room*, *Multi-Room Apartment*, *Hallways*, and *Random Obstacles*.
- **Pan & Zoom**: Smooth navigation with zoom levels up to 4.5x.
- **Set Goal**: Reposition target coordinates interactively.
- **Place Rover**: Relocate the robot anywhere on the floor plan.
- **Add Walls & Obstacles**: Paint custom obstacles and narrow bottlenecks.
- **Spray Dust**: Dynamically add dirt patches to test adaptive cleaning.
- **Eraser**: Clear custom walls and dust regions on the fly.

### 3. Comprehensive Robotics Algorithm Suite
- **Global Path Planning**:
  - $A^*$ Search (Euclidean & Octile heuristic-guided optimal search)
  - Dijkstra’s Algorithm (Uniform-cost baseline)
  - $D^*$ Lite (Incremental replanning for dynamic changes)
  - RRT & RRT* (Sampling-based exploration)
- **Local Obstacle Avoidance**:
  - Dynamic Window Approach (DWA) (Kinematically feasible trajectory search)
  - Vector Field Histogram (VFH) (Obstacle density grid mapping)
- **Complete Area Coverage Planning**:
  - Boustrophedon Cellular Decomposition (Lawnmower sweep pattern)
  - Spanning Tree Coverage (STC)
  - Parallel Grid Sweep

### 4. Anthropic Claude Console Model Cards Showcase
- **Curated 4-Model Showcase**:
  - **A\* Search**: Claude Blue `#60a5fa` banner with search graph vector art ($O(V \log V)$).
  - **D\* Lite**: Claude Terracotta `#d97757` banner with dynamic graph repair ($O(\text{Replanning})$).
  - **DWA Local**: Claude Sonnet Cream `#f4efe6` banner with kinematic velocity windows ($O(V_s \times V_w)$).
  - **Boustrophedon**: Claude Haiku Sage `#b4d2c8` banner with cellular decomposition ($O(\text{Coverage})$).
- **Interactive Controls**: Micro-lift on hover, active selection indicators, and instant 1-click model switching.

### 5. Side-by-Side Benchmarking Engine
- Run multi-algorithm comparisons under identical environmental seeds and constraints.
- Real-time trade-off radar charts and comparative performance bar charts.
- Metric tracking: Compute planning time (ms), total path length (m), nodes explored, collision count, and composite suitability score.
- **Export PBL Report**: Copy formatted Markdown / JSON evaluation summaries directly into project documentation.

### 6. Academic Workbench Design
- Minimalist developer console styling with zero login/auth barrier for instant academic evaluation.
- Smooth slide-in / slide-out collapsible sidebar and telemetry inspector drawer.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18.0.0 or higher)
- npm or pnpm / yarn

### Installation

```bash
git clone https://github.com/MSN-2007/Rover.git
cd Rover
npm install
```

### Running Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

To run on a custom port (e.g., port 2000):

```bash
npm run dev -- -p 2000
```

---

## 🏗️ Project Architecture

```
smart-vacuum-lab/
├── src/
│   ├── algorithms/          # Path planning, local avoidance, and coverage algorithms
│   │   ├── planning/        # A*, Dijkstra, D* Lite, RRT, RRT*
│   │   ├── navigation/      # Dynamic Window Approach (DWA), VFH
│   │   ├── coverage/        # Boustrophedon, STC, Lawnmower
│   │   └── interfaces.ts    # Uniform algorithm interfaces
│   ├── components/
│   │   ├── layout/          # MainApp layout with collapsible slide-in/out sidebar
│   │   ├── simulation/      # SimulationCanvas (Rover rendering) & ExperimentControls
│   │   ├── metrics/         # MetricsPanel & ComparisonPanel benchmarking engine
│   │   └── algorithms/      # AlgorithmInfoPanel (research notes & math)
│   ├── simulation/
│   │   ├── core/            # Grid, physics, RNG, vector utilities
│   │   ├── environment/     # Procedural room layouts (Apartment, Studio, Corridor, Random)
│   │   └── robot/           # Differential drive kinematics & LiDAR raycasting
│   ├── store/
│   │   └── simulationStore.ts  # Zustand global state manager
│   └── app/                 # Next.js App Router root layout & globals.css
```

---

## 📄 License

Academic PBL Project — Developed for research and simulation of autonomous domestic cleaning robots.
