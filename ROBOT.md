# ROBOT.md — LLM & Agent Knowledge Index

> **Context Document for AI Models & Autonomous Agents**  
> Comprehensive technical specification, architecture map, physics equations, algorithm registry, and state machine schema for the **Smart Vacuum Algorithm Lab (Rover)**.

---

## 📌 Repository Overview

| Property | Value |
|---|---|
| **Project** | Smart Vacuum Algorithm Lab (Rover) |
| **PBL Domain** | Domestic Autonomous Mobile Robotics & Cleaning Agent Simulation |
| **Framework** | Next.js 16.4 (App Router) + React 19.3 + TypeScript 5 + Tailwind CSS v4 |
| **State Engine** | Zustand (`zustand@^5.0.15`) |
| **Visualization** | HTML5 2D Canvas with sub-pixel rendering + Recharts |
| **Repository URL**| `https://github.com/MSN-2007/Rover.git` |
| **Key Entrypoint** | [`src/components/layout/MainApp.tsx`](file:///c:/Users/sumiy/OneDrive/Desktop/academic_codes/FOA/smart-vacuum-lab/src/components/layout/MainApp.tsx) |

---

## 🗺️ LLM Quick-Symbol Navigation Index

| Symbol / Module | File Path | Description |
|---|---|---|
| `RobotPhysics` | [`src/simulation/robot/robot.ts`](file:///c:/Users/sumiy/OneDrive/Desktop/academic_codes/FOA/smart-vacuum-lab/src/simulation/robot/robot.ts) | Differential drive state: pose, linear/angular velocity, radius |
| `updateRobotPhysics` | [`src/simulation/robot/robot.ts`](file:///c:/Users/sumiy/OneDrive/Desktop/academic_codes/FOA/smart-vacuum-lab/src/simulation/robot/robot.ts) | Differential drive kinematics, acceleration clamping, wheel slip |
| `simulateLidar` | [`src/simulation/robot/robot.ts`](file:///c:/Users/sumiy/OneDrive/Desktop/academic_codes/FOA/smart-vacuum-lab/src/simulation/robot/robot.ts) | 36-ray 360° LiDAR raymarcher with Gaussian noise |
| `inflateObstacles` | [`src/simulation/environment/environment.ts`](file:///c:/Users/sumiy/OneDrive/Desktop/academic_codes/FOA/smart-vacuum-lab/src/simulation/environment/environment.ts) | 0.28m collision costmap inflation buffer for obstacle avoidance |
| `DWAPlanner` | [`src/algorithms/navigation/LocalPlanners.ts`](file:///c:/Users/sumiy/OneDrive/Desktop/academic_codes/FOA/smart-vacuum-lab/src/algorithms/navigation/LocalPlanners.ts) | Dynamic Window Approach with persistent velocity & in-place rotation |
| `AStarPlanner` | [`src/algorithms/planning/AStar.ts`](file:///c:/Users/sumiy/OneDrive/Desktop/academic_codes/FOA/smart-vacuum-lab/src/algorithms/planning/AStar.ts) | 8-connected grid A* path planner with Octile/Euclidean heuristics |
| `useSimulationStore` | [`src/store/simulationStore.ts`](file:///c:/Users/sumiy/OneDrive/Desktop/academic_codes/FOA/smart-vacuum-lab/src/store/simulationStore.ts) | Zustand global state manager, simulation loop & stuck recovery |
| `SimulationCanvas` | [`src/components/simulation/SimulationCanvas.tsx`](file:///c:/Users/sumiy/OneDrive/Desktop/academic_codes/FOA/smart-vacuum-lab/src/components/simulation/SimulationCanvas.tsx) | Hi-fi rover rendering (treads, suction vortex, brushes, turret, dock) |

---

## ⚙️ Physical & Kinematic Specifications

### 1. Robot Chassis Parameters
```typescript
Radius:              0.25 m (25 cm physical radius)
Inflation Margin:    0.28 m (0.25 m + 0.03 m safety envelope)
Max Linear Velocity: 0.55 m/s
Max Angular Velocity:1.60 rad/s
Max Acceleration:    0.60 m/s²
Wheel Slip:          0.02 (2% stochastic slip factor)
Battery Pack:        14.4 V Li-Ion (100% capacity curve)
```

### 2. Kinematics Equations
Differential drive kinematics with heading integration:
$$\dot{x} = v_{\text{noisy}} \cdot \cos(\theta) \cdot \Delta t$$
$$\dot{y} = v_{\text{noisy}} \cdot \sin(\theta) \cdot \Delta t$$
$$\dot{\theta} = \omega_{\text{cmd}} \cdot \Delta t$$
$$\theta_{t+1} = \text{normalizeAngle}(\theta_t + \dot{\theta})$$

Where $v_{\text{noisy}} = v \cdot (1 - \text{wheelSlip} \cdot 0.5)$.

### 3. Cleaning & Suction Profiles
| Mode | Motor Vacuum Pressure | Power Draw Rate | Dust Absorption Multiplier |
|---|---|---|---|
| **Eco** | $1200\text{ Pa}$ | $0.007\text{ \%/s}$ | $0.70\times$ |
| **Standard** | $2000\text{ Pa}$ | $0.015\text{ \%/s}$ | $1.00\times$ |
| **Boost** | $3000\text{ Pa}$ | $0.025\text{ \%/s}$ | $1.60\times$ |

### 4. Sensor Suite
- **LiDAR**: 36 laser rays spanning $360^\circ$ ($10^\circ$ angular resolution), raycast distance up to $4.5\text{ m}$, Gaussian noise injection $\pm 2\%$.
- **Contact Bumpers**: Circle-to-AABB intersection tests against boundary walls, furniture, and dynamic entities.
- **Dust Sensor**: Ground-facing optical sensor sampling grid cell dirt probabilities under the chassis radius.

---

## 🛡️ Obstacle Avoidance & Anti-Stuck System

### 1. Costmap Obstacle Inflation (`inflateObstacles`)
To resolve table collisions where waypoints grazed furniture boundaries:
1. All static walls and rectangular furniture items are mapped to grid cells at resolution $0.2\text{ m}$.
2. `inflateObstacles(grid, 0.28)` runs a circular dilation mask:
   $$R_{\text{cells}} = \lceil 0.28 / \text{resolution} \rceil = 2\text{ cells}$$
3. Any cell within Euclidean distance $\le R_{\text{cells}}$ of an obstacle is marked `occupied = true`.
4. Global planners (A*, Dijkstra) route exclusively through the inflated free space, ensuring the rover never clips furniture edges.

### 2. DWA Planner Upgrades
- **Dynamic Velocity Tracking**: Carries over previous $v$ and $\omega$ across simulation steps for smooth acceleration profiles.
- **Trajectory Candidate Space**: Samples $12$ linear velocities $\times 16$ angular velocities ($192$ trajectories) plus explicit in-place rotation candidates ($v = 0$).
- **Scoring Function**:
  $$\text{Score} = 0.45 \cdot S_{\text{heading}} + 0.25 \cdot S_{\text{dist}} + 0.10 \cdot S_{\text{velocity}} + 0.20 \cdot S_{\text{clearance}}$$
- **Escape Mode**: When all forward candidates are obstructed, the planner commands pure rotation toward the target heading.

### 3. Stuck Detection & Autonomous Escape Routine
Located in [`src/store/simulationStore.ts`](file:///c:/Users/sumiy/OneDrive/Desktop/academic_codes/FOA/smart-vacuum-lab/src/store/simulationStore.ts):
```typescript
const STUCK_CHECK_INTERVAL = 2.0;       // Evaluate displacement every 2.0 seconds
const STUCK_DISTANCE_THRESHOLD = 0.06;  // Minimum 6 cm movement expected

if (elapsedTime >= STUCK_CHECK_INTERVAL) {
  if (distance(currentPose, lastCheckPose) < STUCK_DISTANCE_THRESHOLD) {
    recoveryFrames = 30; // Initiate 3-second recovery
  }
}
```
**Two-Phase Recovery State Machine**:
- **Phase 1 (Frames 21–30)**: Reverses linear drive ($v = -0.4 \cdot v_{\max}, \omega = 0$) to clear physical obstacles.
- **Phase 2 (Frames 1–20)**: Stops linear motion and pivots toward goal ($v = 0, \omega = \pm \omega_{\max}$).

---

## 📚 Algorithm Directory

```
src/algorithms/
├── planning/
│   ├── AStar.ts          # Optimal A* with Octile/Euclidean heuristics
│   ├── Dijkstra.ts       # Uniform-cost graph exploration
│   ├── DStarLite.ts      # Incremental heuristic replanner
│   └── RRT.ts            # Rapidly-exploring Random Tree & RRT*
├── navigation/
│   └── LocalPlanners.ts  # Dynamic Window Approach (DWA) & Vector Field Histogram (VFH)
├── coverage/
│   └── CoveragePlanners.ts # Boustrophedon, Spanning Tree Coverage (STC), Lawnmower
└── localization/
    └── Localizers.ts     # EKF and Particle Filter localization
```

---

## 🎨 Claude Console UI Architecture

The interface uses Anthropic Claude Console design language:
- **Backgrounds**: Obsidian `#141413`, Elevated card `#1c1b18`, Sub-card `#242320`.
- **Accents**: Claude Terracotta `#d97757`, Warm Cream `#f4efe6`, Muted Sage `#b4d2c8`.
- **Model Cards**:
  - `astar`: Claude Blue `#60a5fa`
  - `dstarlite`: Claude Terracotta `#d97757`
  - `dwa`: Claude Sonnet Cream `#f4efe6`
  - `boustrophedon`: Claude Haiku Sage `#b4d2c8`

---

## 💻 Developer & Agent Cheatsheet

### Running the Environment
```bash
# Start dev server
npm run dev

# Run on specific port
npm run dev -- --port 2000

# Type-check and production build
npm run build
```

### Adding a New Algorithm
1. Implement the `PathPlanner`, `LocalPlanner`, or `CoveragePlanner` interface from [`src/algorithms/interfaces.ts`](file:///c:/Users/sumiy/OneDrive/Desktop/academic_codes/FOA/smart-vacuum-lab/src/algorithms/interfaces.ts).
2. Register the algorithm in [`src/data/algorithms.ts`](file:///c:/Users/sumiy/OneDrive/Desktop/academic_codes/FOA/smart-vacuum-lab/src/data/algorithms.ts).
3. Connect the factory constructor inside `createPlanner` in [`src/store/simulationStore.ts`](file:///c:/Users/sumiy/OneDrive/Desktop/academic_codes/FOA/smart-vacuum-lab/src/store/simulationStore.ts).
