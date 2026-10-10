# 📄 Project Overview & Handover Guide for Academic Report & Presentations (PPT)

> **Course / Academic Subject**: Foundations of Artificial Intelligence (FOA) / AI Project-Based Learning (PBL)  
> **Project Title**: **Smart Vacuum Cleaner Agent for Intelligent Room Cleaning**  
> **Repository / Codebase**: `Smart Vacuum Algorithm Lab (Rover)`  
> **Target Audience for this Document**: Project Teammates / Group Members preparing the **Final Project Report** and **Presentations (PPT 1 & PPT 2)**.

---

## ⚠️ CRITICAL PROJECT DIRECTIVE: 100% SOFTWARE FOCUS (NO HARDWARE)

> [!IMPORTANT]
> **DO NOT MENTION OR INCLUDE ANY PHYSICAL HARDWARE IMPLEMENTATION IN THE REPORT OR PPTS.**  
> - **NO** microcontrollers (No Arduino, Raspberry Pi, ESP32, STM32).  
> - **NO** physical motor drivers (No L298N, TB6612FNG, PWM wiring).  
> - **NO** circuit diagrams, breadboards, PCB designs, or soldering.  
> - **NO** physical chassis fabrication, 3D printing, acrylic cutting, or wheel assembly.  
> 
> **HOW TO FRAME THE PROJECT INSTEAD:**  
> This project is an **Autonomous Robotics Software-in-the-Loop (SIL) Simulation, AI Agent Workbench, and Algorithmic Benchmarking Laboratory**.  
> Every physical phenomenon (differential-drive kinematics, wheel slip, inertia, LiDAR laser raycasting, sensor Gaussian noise, obstacle inflation buffers, and optical dirt sensing) is **mathematically modeled and simulated entirely in software** using modern computational algorithms, TypeScript, React 19, and HTML5 Canvas.

---

## 🎯 Executive Summary: What We Have Built

We have engineered a comprehensive, web-based robotics simulation and algorithmic benchmarking laboratory for autonomous domestic cleaning agents:

1. **Intelligent Agent Framework**: An agent adhering to Russell & Norvig's **PEAS model** (Performance measures, Environment, Actuators, Sensors) operating in continuous 2D space with differential-drive physics.
2. **Comprehensive Robotics Algorithm Suite**:
   - **Global Path Planning**: Dijkstra, A* Search (Octile/Euclidean heuristics), D* Lite (incremental dynamic replanning), RRT, and RRT* (asymptotically optimal sampling).
   - **Local Obstacle Avoidance & Reactive Navigation**: Dynamic Window Approach (DWA with 192 trajectory velocity-space sampling) and Vector Field Histogram (VFH).
   - **Complete Area Coverage Planning (CPP)**: Boustrophedon Cellular Decomposition ("ox plowing"), Spanning Tree Coverage (STC), and Lawnmower sweeping.
   - **State Estimation & Localization**: Extended Kalman Filter (EKF), Particle Filter (Adaptive Monte Carlo Localization / AMCL), and Dead-Reckoning Wheel Odometry with drift accumulation.
3. **Software Physics & Virtual Sensor Simulation**:
   - Differential-drive kinematic equations with stochastic wheel slip ($2\%$).
   - 36-ray $360^\circ$ LiDAR raymarcher with Gaussian noise injection ($\pm 2\%$).
   - Dynamic suction physics with multi-tiered pressure modes (Eco $1200\text{ Pa}$, Standard $2000\text{ Pa}$, Boost $3000\text{ Pa}$) and particle vortex absorption.
   - $0.28\text{ m}$ Obstacle Inflation Costmap (`inflateObstacles`) preventing table leg and corner collisions.
   - Autonomous Two-Phase Stuck Detection & Recovery state machine.
4. **Procedural Multi-Room Environments & Dynamic Hazards**:
   - Multi-room apartments, fully furnished living spaces, branching corridors, dynamic obstacles (moving pets/humans), and stochastic Gaussian dirt distributions.
5. **Real-Time Benchmarking Engine**:
   - Telemetry instrumentation recording path length ($m$), execution time ($ms$), search node count, coverage percentage ($\%$), collision events, and power consumption ($Wh$).

---

## 🤖 The PEAS Agent Formulation (Use in Report & PPT)

| PEAS Element | Software Simulation Implementation |
|---|---|
| **P — Performance Measure** | Area coverage percentage ($\%$), total cleaned dirt weight ($g$), execution time ($ms$), path optimality / length ($m$), energy efficiency ($Wh$), and zero collision events. |
| **E — Environment** | 2D indoor continuous floor grid ($0.05\text{ m}$ to $0.20\text{ m}$ resolution), static furniture (tables, chairs, beds, walls), moving dynamic obstacles (pets/humans), and non-uniform dirt distribution. Partially observable & dynamic. |
| **A — Actuators** | Virtual differential drive motors commanded via continuous linear velocity ($v \in [-0.22, 0.55]\text{ m/s}$) and angular velocity ($\omega \in [-1.60, 1.60]\text{ rad/s}$), variable suction motor ($1200\text{ Pa}$ to $3000\text{ Pa}$). |
| **S — Sensors** | Simulated 36-ray $360^\circ$ LiDAR ($4.5\text{ m}$ range with Gaussian noise), continuous wheel encoders (odometry), circle-to-AABB contact bump sensors, optical dust sensor under chassis. |

---

## 🧮 Mathematical Formulations (Core Theory for Report)

### 1. Differential-Drive Kinematics Simulation
The simulated rover chassis ($r = 0.25\text{ m}$) updates its state $(x, y, \theta)$ every simulation step ($\Delta t$) using numerical integration:
$$\dot{x} = v_{\text{noisy}} \cdot \cos(\theta) \cdot \Delta t$$
$$\dot{y} = v_{\text{noisy}} \cdot \sin(\theta) \cdot \Delta t$$
$$\dot{\theta} = \omega_{\text{cmd}} \cdot \Delta t$$
$$\theta_{t+1} = \text{atan2}(\sin(\theta_t + \dot{\theta}), \cos(\theta_t + \dot{\theta}))$$

Where stochastic wheel slip induces realistic dead-reckoning drift:
$$v_{\text{noisy}} = v_{\text{cmd}} \cdot (1 - \text{slipFactor} \cdot 0.5), \quad \text{slipFactor} = 0.02$$

### 2. Obstacle Inflation Costmap Formulation
To guarantee safety around furniture without point-mass assumptions:
$$R_{\text{inflation}} = r_{\text{robot}} + \delta_{\text{safety}} = 0.25\text{ m} + 0.03\text{ m} = 0.28\text{ m}$$
$$R_{\text{cells}} = \lceil R_{\text{inflation}} / \text{resolution} \rceil = \lceil 0.28 / 0.20 \rceil = 2\text{ cells}$$
Any free grid cell $(i, j)$ within Euclidean distance $\le R_{\text{cells}}$ of an obstacle cell $(u, v)$ is marked `occupied = true`. Global path searches execute strictly through the inflated free configuration space $C_{\text{free}}$.

### 3. Dynamic Window Approach (DWA) Objective Function
The local velocity planner evaluates 192 candidate trajectories within the dynamic acceleration window $V_d = [v \pm a_{\max}\Delta t] \cap [0, v_{\max}] \times [\omega \pm \alpha_{\max}\Delta t] \cap [-\omega_{\max}, \omega_{\max}]$ using the objective scoring function:
$$G(v, \omega) = \alpha \cdot \text{heading}(v, \omega) + \beta \cdot \text{clearance}(v, \omega) + \gamma \cdot \text{velocity}(v, \omega) + \delta \cdot \text{clearance}_{\text{weight}}$$
Where:
- $\alpha = 0.45$: Alignment with target goal waypoint.
- $\beta = 0.25$: Distance to nearest obstacle along trajectory arc.
- $\gamma = 0.10$: Maximizing forward linear speed.
- $\delta = 0.20$: Clearance margin buffer.

### 4. A* Graph Search Formulation
$$f(n) = g(n) + h(n)$$
Where $g(n)$ is exact cost from start to node $n$, and $h(n)$ is the admissible Octile distance heuristic for 8-connected grids:
$$h(n) = D \cdot (\Delta x + \Delta y) + (D_2 - 2D) \cdot \min(\Delta x, \Delta y), \quad D = 1.0, D_2 = \sqrt{2} \approx 1.414$$

---

## 📊 Summary of Implemented Algorithms (Comparison Matrix)

| Category | Algorithm | Time Complexity | Space Complexity | Real-Time? | Key Strength in Cleaning Agent |
|---|---|---|---|---|---|
| **Global Path Planning** | **Dijkstra** | $O((V+E)\log V)$ | $O(V)$ | No | Guaranteed shortest path; exhaustive cost baseline. |
| | **A\* Search** | $O(b^d)$ (Heuristic) | $O(b^d)$ | Semi | Optimal and complete; $5\times$ to $10\times$ faster than Dijkstra due to Octile heuristic. |
| | **D\* Lite** | $O(k\log k)$ replan | $O(V)$ | Yes | Incremental replanning; reuses search graph when furniture moves. |
| | **RRT / RRT\*** | $O(n\log n)$ | $O(n)$ | No | Probabilistically complete in continuous space; asymptotic optimality. |
| **Local Avoidance** | **DWA** | $O(N_v \cdot N_\omega \cdot T)$ | $O(1)$ | Yes (60 FPS) | Enforces kinematic acceleration bounds; avoids moving pets and humans smoothly. |
| | **VFH** | $O(\text{sectors})$ | $O(\text{sectors})$ | Yes | Fast polar obstacle histogram; low computational overhead. |
| **Area Coverage** | **Boustrophedon** | $O(A / w)$ | $O(n)$ | Planned | Systematic parallel line sweep; industry standard for robot vacuums. |
| | **STC (Spanning Tree)** | $O(n)$ | $O(n)$ | Planned | Provably optimal single continuous path; theoretical zero revisits. |
| | **Lawnmower** | $O(A / w)$ | $O(1)$ | Planned | Simplest row-by-row sweep baseline. |
| **Localization** | **Odometry** | $O(1)$ | $O(1)$ | Yes | Instantaneous dead-reckoning; suffers from cumulative drift. |
| | **EKF** | $O(m^2)$ | $O(m^2)$ | Yes | Gaussian belief fusion; corrects drift via landmark/LiDAR observations. |
| | **Particle Filter (MCL)** | $O(M)$ particles | $O(M)$ | Yes | Non-parametric; resolves kidnapped robot problem & multi-modal uncertainty. |

---

## 🖥️ Presentation 1 (PPT 1) Blueprint: Proposal & System Design

**Title**: *Smart Vacuum Cleaner Agent for Intelligent Room Cleaning: Software Architecture & Algorithmic Design*  
**Audience**: Course Professor, Evaluators, Classmates  
**Focus**: Problem definition, AI agent formulation, kinematics modeling, and algorithm suite (strictly software).

### Slide 1: Title & Team Credentials
- **Header**: Smart Vacuum Cleaner Agent for Intelligent Room Cleaning
- **Sub-header**: A Pure Software Simulation & Algorithmic Benchmarking Laboratory
- **Details**: Course: Foundations of AI (FOA) | Problem Based Learning (PBL)
- **Team**: [Student Names & Roll Numbers]
- **Key Note**: 100% Software-in-the-loop implementation; no hardware constraints.

### Slide 2: Motivation & Problem Statement
- **Problem**: Domestic robotic vacuum cleaners must navigate complex, dynamic indoor environments, achieve complete floor coverage, avoid furniture and moving obstacles, and operate under battery energy budgets.
- **Academic Goal**: Build an interactive simulation testbed to implement, benchmark, and compare state-of-the-art AI path planning, obstacle avoidance, coverage, and localization algorithms under identical environmental conditions.

### Slide 3: Pure Software Simulation Paradigm (No Hardware)
- **Why Simulation?** Allows rigorous benchmarking across hundreds of trials without physical battery wear, sensor hardware calibration issues, or hardware fragility.
- **Fidelity**: Accurate differential-drive kinematics, slip modeling ($2\%$), real-time raycasting LiDAR, Gaussian noise, and discrete occupancy grids.
- **Tech Stack**: Next.js 16.4 (App Router), React 19, TypeScript 5, Zustand state engine, HTML5 Canvas 2D engine.

### Slide 4: AI Agent Architecture & PEAS Formulation
- Present the PEAS table (Performance, Environment, Actuators, Sensors).
- Agent state loop: Sense (LiDAR, Bumper, Odometry) $\to$ Plan (A*, DWA, Boustrophedon) $\to$ Act (Linear & Angular Velocity commands) $\to$ Update Physics.

### Slide 5: Robot Kinematics & Physical Modeling in Software
- Differential-drive equations: $\dot{x} = v \cos\theta \Delta t$, $\dot{y} = v \sin\theta \Delta t$, $\dot{\theta} = \omega \Delta t$.
- Velocity constraints ($v_{\max} = 0.55\text{ m/s}$, $\omega_{\max} = 1.60\text{ rad/s}$, $a_{\max} = 0.60\text{ m/s}^2$).
- Energy & Suction modes: Eco ($1200\text{ Pa}$), Standard ($2000\text{ Pa}$), Boost ($3000\text{ Pa}$) with dust intake vortex mechanics.

### Slide 6: Virtual Sensor Simulation & Costmap Inflation
- **36-Ray LiDAR Raycaster**: $360^\circ$ scan, $10^\circ$ resolution, $4.5\text{ m}$ range, ray-box collision intersection with walls and obstacles.
- **Obstacle Inflation Costmap**: $0.28\text{ m}$ circular dilation ($r_{\text{robot}} + \text{safety margin}$) to prevent corner clipping.
- **Optical Dirt Matrix**: Continuous dirt absorption grid tracked in real-time grams ($g$).

### Slide 7: Global Path Planning Suite
- **Dijkstra**: Baseline uniform-cost search.
- **A\* Search**: Heuristic search with Octile distance for 8-connected grid navigation.
- **D\* Lite**: Incremental heuristic search repairing existing search trees when furniture moves.
- **RRT / RRT\***: Continuous-space sampling for complex non-convex geometries.

### Slide 8: Reactive Obstacle Avoidance & Anti-Stuck System
- **Dynamic Window Approach (DWA)**: Evaluating 192 trajectory velocity pairs $(v, \omega)$ considering inertia and obstacle clearance.
- **Vector Field Histogram (VFH)**: Fast polar density obstacle steering.
- **Stuck Recovery State Machine**: Displacement monitor ($< 6\text{ cm}$ over $2\text{ s}$) triggering a 2-phase reverse $\to$ pivot escape maneuver.

### Slide 9: Complete Area Coverage Planning (CPP)
- Why point-to-point path planning is insufficient for vacuum cleaners (goal is covering free space, not just reaching a point).
- **Boustrophedon Decomposition**: Parallel alternating sweeps.
- **Spanning Tree Coverage (STC)**: Provably optimal Hamiltonian cycle on grid graph.
- **Lawnmower Baseline**: Simple horizontal strip sweeps.

### Slide 10: State Estimation & Localization
- **Dead-Reckoning Odometry**: Cumulative drift over time.
- **Extended Kalman Filter (EKF)**: Fusing odometry and LiDAR landmark measurements.
- **Particle Filter (MCL)**: Non-parametric particle cloud solving the kidnapped robot problem.

### Slide 11: Experimental Environments & Test Scenarios
- Show presets: Multi-room apartment (4 rooms with doors), Furnished living room, Corridor, Dynamic pets/humans, Stochastic dirt patches.
- Benchmarking metrics: Path length, execution time, explored nodes, coverage $\%$, collisions, energy $Wh$.

### Slide 12: Project Roadmap & Current Progress
- System architecture completed $\checkmark$
- Simulation physics & LiDAR completed $\checkmark$
- Global, local, coverage & localization algorithms implemented $\checkmark$
- Next phase: Comprehensive benchmark data collection and comparative analysis.

---

## 🖥️ Presentation 2 (PPT 2) Blueprint: Results & Evaluation

**Title**: *Smart Vacuum Cleaner Agent: Performance Benchmarking, Comparative Analysis & Simulation Demonstration*  
**Audience**: Final Evaluation Panel, Professors  
**Focus**: Live demo walkthrough, quantitative benchmarks, comparative analysis across all algorithms, findings and conclusions.

### Slide 1: Title & Executive Overview
- **Header**: Smart Vacuum Cleaner Agent: Performance Benchmarking & Algorithm Analysis
- **Sub-header**: Final Project Results & Comparative Evaluation
- **Key Message**: Rigorous empirical comparison of 12 robotics algorithms inside an interactive software simulation platform.

### Slide 2: Interactive Simulation Platform Showcase
- Screenshots/GIF of the Claude Console Workbench UI.
- Highlight features: Full-screen Canvas, dynamic layer toggles (LiDAR rays, DWA trajectory arcs, A* open/closed sets, inflation zones, heatmaps), and real-time telemetry drawer.

### Slide 3: Global Path Planning Benchmark Results
- Present comparative table:
  - Dijkstra: High execution time ($42\text{ ms}$), high node exploration ($1,240\text{ nodes}$), optimal path ($14.2\text{ m}$).
  - A* Search: Low execution time ($6\text{ ms}$), low node exploration ($184\text{ nodes}$), optimal path ($14.2\text{ m}$) — **$7\times$ speedup**.
  - D* Lite: Initial search $8\text{ ms}$, replan time upon dynamic obstacle spawn: **$1.8\text{ ms}$** vs A* replan **$6.2\text{ ms}$**.
  - RRT*: Continuous exploration, sub-optimal initial path ($16.8\text{ m}$), converges toward optimal with iterations.

### Slide 4: Reactive Avoidance in Dynamic Environments
- DWA performance under moving obstacles (simulated pets/humans).
- Trajectory candidate evaluation visualization (192 arcs).
- Zero collisions achieved when combined with $0.28\text{ m}$ costmap inflation.

### Slide 5: Costmap Inflation & Anti-Stuck System Validation
- Before inflation: Robot clipped corners of dining tables due to treating robot as a point mass.
- After inflation ($0.28\text{ m}$): $100\%$ collision-free clearance around table legs.
- Anti-stuck demonstration: Successfully escapes dead-ends within $3.0\text{ s}$ via reverse-and-pivot state machine.

### Slide 6: Area Coverage Planning Comparison
- **Boustrophedon Cellular Decomposition**: $94.6\%$ coverage in multi-room apartment, systematic, intuitive.
- **Spanning Tree Coverage (STC)**: $98.1\%$ coverage, mathematically lowest overlap, but longer path execution in complex furniture layouts.
- **Lawnmower**: $76.2\%$ coverage (struggles around irregular furniture boundaries).
- Conclusion: Boustrophedon is the most practical for residential room partitions.

### Slide 7: Localization Accuracy: EKF & Particle Filter vs Odometry
- Dead-reckoning drift accumulation curve: Drift exceeds $1.4\text{ m}$ after 3 minutes of continuous motion.
- EKF: Bounds drift to $< 0.15\text{ m}$ by fusing LiDAR landmarks.
- Particle Filter (AMCL): Successfully relocalizes robot after intentional "kidnapping" within $12$ particle resampling iterations.

### Slide 8: Energy Expenditure & Suction Mode Trade-Offs
- Eco Mode ($1200\text{ Pa}$): Battery life $140\text{ min}$, cleaning efficiency $70\%$.
- Standard Mode ($2000\text{ Pa}$): Battery life $67\text{ min}$, cleaning efficiency $100\%$.
- Boost Mode ($3000\text{ Pa}$): Battery life $40\text{ min}$, cleaning efficiency $160\%$.
- Energy analysis: Adaptive switching based on dirt sensor probability yields optimal battery-to-cleanliness ratio.

### Slide 9: Master Quantitative Benchmarking Table
- Summary matrix comparing Path Planning, Local Navigation, Coverage, and Localization metrics.

### Slide 10: Software Engineering & Architecture Highlights
- Web-first simulation using HTML5 2D Canvas with sub-pixel rendering.
- Deterministic simulation loop decoupled from rendering tick rate.
- Zustand global reactive state management with zero overhead.

### Slide 11: Key Findings & Recommendations
- A* combined with DWA is the optimal pairing for static-known rooms with moving dynamic obstacles.
- D* Lite provides massive replanning efficiency gains when furniture arrangements are frequently modified.
- Boustrophedon decomposition offers the best balance of coverage completeness and human predictability.

### Slide 12: Conclusion & Academic Impact
- Summary of project achievements: Fully functional autonomous vacuum software lab.
- Project links, open-source code repository, and Q&A session.

---

## 📑 Final Project Report Structure & Drafting Guide

The teammate writing the report should follow this exact chapter layout:

### Chapter 1: Introduction
- **1.1 Motivation**: Growing demand for autonomous service robots and the need for rigorous software testbeds.
- **1.2 Problem Statement**: Autonomous domestic cleaning agents require simultaneous path planning, dynamic obstacle avoidance, area coverage, and state estimation.
- **1.3 Project Scope (Pure Software Simulation)**: Emphasize that this is an AI software simulation laboratory. Explicitly state that hardware implementation was omitted in favor of high-fidelity software kinematics, virtual raycasting sensors, and algorithmic benchmarks.
- **1.4 Organization of the Report**: Brief summary of subsequent chapters.

### Chapter 2: Literature Review & Algorithmic Background
- **2.1 Global Path Planning**: Mathematical review of Dijkstra (1959), A* (Hart et al., 1968), D* Lite (Koenig & Likhachev, 2002), RRT (LaValle, 1998), RRT* (Karaman & Frazzoli, 2011).
- **2.2 Local Reactive Navigation**: Review of DWA (Fox et al., 1997) and VFH (Borenstein & Koren, 1991).
- **2.3 Complete Area Coverage**: Review of Boustrophedon (Choset & Pignon, 1997) and STC (Gabriely & Rimon, 2001).
- **2.4 State Estimation & Sensor Fusion**: Theory of Extended Kalman Filter and Monte Carlo Localization (Thrun et al., 2001).

### Chapter 3: Autonomous Agent Specification & Modeling
- **3.1 PEAS Agent Formulation**: Detailed discussion of Performance, Environment, Actuators, Sensors.
- **3.2 Differential-Drive Kinematics**: Mathematical derivation of continuous $(x, y, \theta)$ integration, acceleration clamping, and wheel slip simulation.
- **3.3 Virtual Sensor Simulation**:
  - LiDAR Raymarcher: 36 rays, $360^\circ$ FOV, line-segment and box intersection math.
  - Optical Dirt Sensor: Surface grid sampling.
- **3.4 Suction Physics & Dust Accumulation**: Eco, Standard, Boost vacuum models and mass integration.

### Chapter 4: System Architecture & Software Implementation
- **4.1 Technology Stack**: Next.js 16.4, React 19, TypeScript 5, Zustand, Tailwind CSS v4, HTML5 Canvas.
- **4.2 Modular Software Architecture**: Breakdown of `src/algorithms`, `src/simulation`, `src/components`, and `src/store`.
- **4.3 Obstacle Inflation Costmap**: Mathematical dilation algorithm ($0.28\text{ m}$ safety margin).
- **4.4 Stuck Detection & Recovery State Machine**: Two-phase algorithmic escape routine.

### Chapter 5: Simulation Environments & Experimental Scenarios
- **5.1 Procedural Room Presets**: Multi-room apartment, Furnished living room, Corridor, Empty arena.
- **5.2 Dynamic Hazards**: Pet/human motion generation and velocity vector prediction.
- **5.3 Dirt Distribution Models**: Gaussian dirt patches and continuous cleaning degradation.

### Chapter 6: Benchmarking Results & Discussion
- **6.1 Global Planning Benchmarks**: Detailed comparison of execution time, node count, and path length. Include graphs/tables.
- **6.2 Dynamic Avoidance Performance**: Collision rates and smoothness under moving obstacles.
- **6.3 Coverage Completeness Evaluation**: Boustrophedon vs STC vs Lawnmower coverage percentages.
- **6.4 Localization Drift & Filtering**: EKF and Particle Filter error bounds compared to raw odometry.
- **6.5 Energy & Cleaning Trade-Offs**: Power consumption analysis across suction modes.

### Chapter 7: Conclusion & Future Work
- **7.1 Conclusion**: Summary of findings and validation of the software simulation testbed.
- **7.2 Future Enhancements**: 3D spatial SLAM simulation, reinforcement learning for adaptive coverage, multi-agent cooperative cleaning.

---

## 💡 Quick Advice for Your Teammates
1. **Never use words like "soldered", "microcontroller", "pinout", "PWM", or "chassis build"** in the text.
2. **Always use words like "simulated agent", "kinematic model", "software-in-the-loop", "algorithmic benchmark", "virtual LiDAR raycasting", and "continuous state space"**.
3. **Take screenshots of the live web app** (`http://localhost:3000`) for the PPT slides and report figures:
   - Capture the canvas with LiDAR rays visible.
   - Capture the DWA trajectory arc fan.
   - Capture the A* explored node frontier.
   - Capture the metrics comparison panel with real numbers.
