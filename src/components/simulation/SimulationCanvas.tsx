'use client';

import React, { useRef, useEffect, useCallback, useState } from 'react';
import { useSimulationStore, CanvasTool } from '@/store/simulationStore';
import { Environment } from '@/simulation/core/types';
import { MousePointer, Target, Navigation, Square, Sparkles, Eraser, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

// Claude Console warm dark palette
const CLAUDE_COLORS = {
  background: '#141413',
  floorGrid: '#1b1b19',
  roomFill: '#161615',
  roomBorder: '#232320',
  roomLabel: '#6b6b66',
  wallFill: '#242421',
  wallBorder: '#32322e',
  furnitureFill: '#1c1c1a',
  furnitureBorder: '#2c2c28',
  furnitureText: '#8a8a84',
  dynamicObstacle: '#d97757', // Claude coral
  dynamicBorder: '#b35d40',
  roverBody: '#262623',
  roverBumper: '#181816',
  roverWheel: '#121210',
  roverLed: '#d97757', // Claude warm terracotta
  roverLedActive: '#60a5fa', // Claude blue
  goalRing: '#d97757',
  plannedPath: '#60a5fa',
  actualTrajectory: '#a7c4bc', // Claude sage
  lidarRay: 'rgba(96, 165, 250, 0.08)',
  lidarHit: '#d97757',
  openSet: 'rgba(217, 119, 87, 0.18)',
  closedSet: 'rgba(96, 165, 250, 0.12)',
  coveredFloor: 'rgba(167, 196, 188, 0.12)',
  dirt: 'rgba(180, 83, 9, 0.7)',
};

export default function SimulationCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const isDraggingRef = useRef(false);
  const lastMouseRef = useRef({ x: 0, y: 0 });
  const isPaintingRef = useRef(false);
  const brushAngleRef = useRef(0);
  const lidarSweepRef = useRef(0);

  const {
    environment, robotState, plannedPath, actualPath,
    openSet, closedSet, candidateTrajectories, selectedTrajectory,
    vizState, isRunning, isPaused, updateSimulation,
    coverageGrid, config, currentWaypointIndex,
    currentTool, setTool, setGoalPosition, setRobotPosition,
    addCustomObstacle, addDirtPatch, eraseAt,
    batteryLevel, brushRotating
  } = useSimulationStore();

  const [mouseCoord, setMouseCoord] = useState<{ x: number; y: number } | null>(null);

  // Resize canvas
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getScale = useCallback((env: Environment, cw: number, ch: number, zoom: number) => {
    const scaleX = (cw / env.width) * zoom;
    const scaleY = (ch / env.height) * zoom;
    return Math.min(scaleX, scaleY);
  }, []);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !environment) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cw = canvas.width;
    const ch = canvas.height;
    const { cameraZoom, cameraX, cameraY } = vizState;

    const scale = getScale(environment, cw, ch, cameraZoom);
    const offsetX = (cw - environment.width * scale) / 2 + cameraX;
    const offsetY = (ch - environment.height * scale) / 2 + cameraY;

    const wx = (x: number) => x * scale + offsetX;
    const wy = (y: number) => y * scale + offsetY;
    const ws = (s: number) => s * scale;

    // Background
    ctx.fillStyle = CLAUDE_COLORS.background;
    ctx.fillRect(0, 0, cw, ch);

    // Architectural subtle floor grid
    const res = config.gridResolution;
    ctx.strokeStyle = CLAUDE_COLORS.floorGrid;
    ctx.lineWidth = 0.5;
    for (let gx = 0; gx <= environment.grid.width; gx++) {
      ctx.beginPath();
      ctx.moveTo(wx(gx * res), wy(0));
      ctx.lineTo(wx(gx * res), wy(environment.height));
      ctx.stroke();
    }
    for (let gy = 0; gy <= environment.grid.height; gy++) {
      ctx.beginPath();
      ctx.moveTo(wx(0), wy(gy * res));
      ctx.lineTo(wx(environment.width), wy(gy * res));
      ctx.stroke();
    }

    // Explored / Open set nodes
    if (vizState.showOpenSet && openSet.length > 0) {
      ctx.fillStyle = CLAUDE_COLORS.openSet;
      for (const n of openSet) {
        ctx.fillRect(wx(n.x * res), wy(n.y * res), ws(res), ws(res));
      }
    }

    // Closed set nodes
    if (vizState.showClosedSet && closedSet.length > 0) {
      ctx.fillStyle = CLAUDE_COLORS.closedSet;
      for (const n of closedSet) {
        ctx.fillRect(wx(n.x * res), wy(n.y * res), ws(res), ws(res));
      }
    }

    // Cleaned floor wake (Coverage)
    if (vizState.showCoverage && coverageGrid.length > 0) {
      ctx.fillStyle = CLAUDE_COLORS.coveredFloor;
      for (let gy = 0; gy < coverageGrid.length; gy++) {
        for (let gx = 0; gx < coverageGrid[gy].length; gx++) {
          if (coverageGrid[gy][gx]) {
            ctx.fillRect(wx(gx * res), wy(gy * res), ws(res), ws(res));
          }
        }
      }
    }

    // Room boundaries
    for (const room of environment.rooms) {
      ctx.fillStyle = CLAUDE_COLORS.roomFill;
      ctx.fillRect(wx(room.x), wy(room.y), ws(room.width), ws(room.height));
      ctx.strokeStyle = CLAUDE_COLORS.roomBorder;
      ctx.lineWidth = 1;
      ctx.strokeRect(wx(room.x), wy(room.y), ws(room.width), ws(room.height));

      // Elegant room label
      ctx.fillStyle = CLAUDE_COLORS.roomLabel;
      ctx.font = `500 ${Math.max(10, ws(0.24))}px Georgia, serif`;
      ctx.textAlign = 'left';
      ctx.fillText(room.label, wx(room.x + 0.3), wy(room.y + 0.4));
    }

    // Dirt spots (granular specks)
    if (vizState.showDirtMap && environment.grid) {
      for (let gy = 0; gy < environment.grid.height; gy++) {
        for (let gx = 0; gx < environment.grid.width; gx++) {
          const cell = environment.grid.cells[gy][gx];
          if (cell.dirtProbability > 0.05) {
            const alpha = Math.min(0.85, cell.dirtProbability);
            ctx.fillStyle = `rgba(180, 83, 9, ${alpha * 0.75})`;
            ctx.fillRect(wx(gx * res), wy(gy * res), ws(res), ws(res));

            // Dust grains
            if (cell.dirtProbability > 0.3) {
              ctx.fillStyle = `rgba(217, 119, 87, ${alpha})`;
              ctx.beginPath();
              ctx.arc(wx(gx * res + res * 0.5), wy(gy * res + res * 0.5), Math.max(1, ws(0.04)), 0, Math.PI * 2);
              ctx.fill();
            }
          }
        }
      }
    }

    // Furniture
    for (const furn of environment.furniture) {
      ctx.fillStyle = CLAUDE_COLORS.furnitureFill;
      ctx.fillRect(wx(furn.x), wy(furn.y), ws(furn.width), ws(furn.height));
      ctx.strokeStyle = CLAUDE_COLORS.furnitureBorder;
      ctx.lineWidth = 1.2;
      ctx.strokeRect(wx(furn.x), wy(furn.y), ws(furn.width), ws(furn.height));

      ctx.fillStyle = CLAUDE_COLORS.furnitureText;
      ctx.font = `400 ${Math.max(9, ws(0.2))}px -apple-system, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(furn.label ?? 'Furniture', wx(furn.x + furn.width / 2), wy(furn.y + furn.height / 2) + 3);
    }

    // Architectural Walls
    for (const wall of environment.walls) {
      ctx.fillStyle = CLAUDE_COLORS.wallFill;
      ctx.fillRect(wx(wall.x), wy(wall.y), ws(wall.width), ws(wall.height));
      ctx.strokeStyle = CLAUDE_COLORS.wallBorder;
      ctx.lineWidth = 1;
      ctx.strokeRect(wx(wall.x), wy(wall.y), ws(wall.width), ws(wall.height));
    }

    // Dynamic Obstacles
    for (const dyn of environment.dynamicObstacles) {
      const cx = wx(dyn.x + dyn.width / 2);
      const cy = wy(dyn.y + dyn.height / 2);
      const rad = ws(dyn.width / 2);

      ctx.fillStyle = CLAUDE_COLORS.dynamicObstacle;
      ctx.beginPath();
      ctx.arc(cx, cy, rad, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = CLAUDE_COLORS.dynamicBorder;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      if (dyn.velocity) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + dyn.velocity.x * scale * 0.35, cy + dyn.velocity.y * scale * 0.35);
        ctx.stroke();
      }

      ctx.fillStyle = '#f4f4f0';
      ctx.font = `500 ${Math.max(9, ws(0.18))}px -apple-system, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(dyn.label ?? 'Obstacle', cx, cy - rad - 4);
    }

    // DWA Candidate trajectories
    if (vizState.showCandidateTrajectories && candidateTrajectories.length > 0) {
      for (const cand of candidateTrajectories) {
        ctx.strokeStyle = cand.collides ? 'rgba(217, 119, 87, 0.2)' : 'rgba(96, 165, 250, 0.12)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        let first = true;
        for (const pt of cand.trajectory) {
          if (first) { ctx.moveTo(wx(pt.x), wy(pt.y)); first = false; }
          else ctx.lineTo(wx(pt.x), wy(pt.y));
        }
        ctx.stroke();
      }
    }

    // Selected trajectory
    if (selectedTrajectory.length > 0) {
      ctx.strokeStyle = CLAUDE_COLORS.plannedPath;
      ctx.lineWidth = 2;
      ctx.beginPath();
      let first = true;
      for (const pt of selectedTrajectory) {
        if (first) { ctx.moveTo(wx(pt.x), wy(pt.y)); first = false; }
        else ctx.lineTo(wx(pt.x), wy(pt.y));
      }
      ctx.stroke();
    }

    // Planned Path
    if (vizState.showPlannedPath && plannedPath.length > 1) {
      ctx.strokeStyle = CLAUDE_COLORS.plannedPath;
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.moveTo(wx(plannedPath[0].x), wy(plannedPath[0].y));
      for (let i = 1; i < plannedPath.length; i++) {
        ctx.lineTo(wx(plannedPath[i].x), wy(plannedPath[i].y));
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // Waypoint markers
      for (let i = 0; i < plannedPath.length; i++) {
        const isCurrent = i === currentWaypointIndex;
        ctx.fillStyle = isCurrent ? '#60a5fa' : 'rgba(96, 165, 250, 0.4)';
        ctx.beginPath();
        ctx.arc(wx(plannedPath[i].x), wy(plannedPath[i].y), ws(isCurrent ? 0.08 : 0.04), 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Actual rover traveled path
    if (vizState.showActualPath && actualPath.length > 1) {
      ctx.strokeStyle = CLAUDE_COLORS.actualTrajectory;
      ctx.lineWidth = 1.6;
      ctx.globalAlpha = 0.7;
      ctx.beginPath();
      ctx.moveTo(wx(actualPath[0].x), wy(actualPath[0].y));
      for (let i = 1; i < actualPath.length; i++) {
        ctx.lineTo(wx(actualPath[i].x), wy(actualPath[i].y));
      }
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // Target Goal
    const goal = config.goalPosition;
    const gx = wx(goal.x);
    const gy = wy(goal.y);
    const gRad = ws(0.28);

    ctx.strokeStyle = CLAUDE_COLORS.goalRing;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(gx, gy, gRad, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(gx - gRad * 1.3, gy); ctx.lineTo(gx + gRad * 1.3, gy);
    ctx.moveTo(gx, gy - gRad * 1.3); ctx.lineTo(gx, gy + gRad * 1.3);
    ctx.stroke();

    ctx.fillStyle = CLAUDE_COLORS.goalRing;
    ctx.font = `600 ${Math.max(9, ws(0.18))}px -apple-system, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('GOAL', gx, gy - gRad - 4);

    // LiDAR Rays
    if (vizState.showSensorRays && robotState) {
      for (const ray of robotState.lidarReadings) {
        ctx.strokeStyle = ray.hit ? 'rgba(217, 119, 87, 0.3)' : CLAUDE_COLORS.lidarRay;
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(wx(robotState.pose.x), wy(robotState.pose.y));
        ctx.lineTo(wx(ray.hitPoint.x), wy(ray.hitPoint.y));
        ctx.stroke();

        if (ray.hit) {
          ctx.fillStyle = CLAUDE_COLORS.lidarHit;
          ctx.beginPath();
          ctx.arc(wx(ray.hitPoint.x), wy(ray.hitPoint.y), 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // ==========================================
    // ROVER VACUUM AGENT (Realistic Roving Robot)
    // ==========================================
    if (robotState) {
      const rx = wx(robotState.pose.x);
      const ry = wy(robotState.pose.y);
      const rr = ws(0.24); // 24cm radius
      const heading = robotState.pose.theta;

      // Rotate brushes while roving
      if (brushRotating) {
        brushAngleRef.current += 0.28;
      }

      // 1. Dual Motorized Tread Wheels (Left & Right sides)
      const wheelDist = rr * 0.88;
      const wheelW = ws(0.14);
      const wheelH = ws(0.06);

      const leftAngle = heading + Math.PI / 2;
      const rightAngle = heading - Math.PI / 2;
      const wheels = [
        { x: rx + Math.cos(leftAngle) * wheelDist, y: ry + Math.sin(leftAngle) * wheelDist },
        { x: rx + Math.cos(rightAngle) * wheelDist, y: ry + Math.sin(rightAngle) * wheelDist },
      ];

      for (const w of wheels) {
        ctx.save();
        ctx.translate(w.x, w.y);
        ctx.rotate(heading);
        ctx.fillStyle = CLAUDE_COLORS.roverWheel;
        ctx.fillRect(-wheelW / 2, -wheelH / 2, wheelW, wheelH);
        ctx.strokeStyle = '#2d2d2a';
        ctx.lineWidth = 1;
        ctx.strokeRect(-wheelW / 2, -wheelH / 2, wheelW, wheelH);
        ctx.restore();
      }

      // 2. Dual Front Corner Rotating Sweeper Brushes
      const brushOffset = rr * 0.88;
      const brushAngles = [heading + 0.65, heading - 0.65];

      for (const ba of brushAngles) {
        const bx = rx + Math.cos(ba) * brushOffset;
        const by = ry + Math.sin(ba) * brushOffset;
        const br = ws(0.09);

        ctx.strokeStyle = '#8c8c85';
        ctx.lineWidth = 1.2;
        for (let arm = 0; arm < 3; arm++) {
          const a = brushAngleRef.current + (arm * (Math.PI * 2 / 3));
          ctx.beginPath();
          ctx.moveTo(bx, by);
          ctx.lineTo(bx + Math.cos(a) * br, by + Math.sin(a) * br);
          ctx.stroke();
        }
      }

      // 3. Rover Front Bumper Rim
      ctx.fillStyle = CLAUDE_COLORS.roverBumper;
      ctx.beginPath();
      ctx.arc(rx, ry, rr + ws(0.02), 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#32322e';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // 4. Rover Main Matte Body Chassis
      const chassisGrad = ctx.createRadialGradient(rx, ry, 2, rx, ry, rr);
      chassisGrad.addColorStop(0, '#2e2e2a');
      chassisGrad.addColorStop(1, '#20201d');
      ctx.fillStyle = chassisGrad;
      ctx.beginPath();
      ctx.arc(rx, ry, rr, 0, Math.PI * 2);
      ctx.fill();

      // 5. Center Suction Roller Slot (Underneath intake preview)
      ctx.save();
      ctx.translate(rx, ry);
      ctx.rotate(heading);
      ctx.fillStyle = '#161614';
      ctx.fillRect(-ws(0.03), -ws(0.12), ws(0.06), ws(0.24));
      ctx.restore();

      // 6. Heading Forward Arrow Indicator
      const tipX = rx + Math.cos(heading) * rr * 0.9;
      const tipY = ry + Math.sin(heading) * rr * 0.9;
      const baseLeftX = rx + Math.cos(heading + 2.4) * rr * 0.5;
      const baseLeftY = ry + Math.sin(heading + 2.4) * rr * 0.5;
      const baseRightX = rx + Math.cos(heading - 2.4) * rr * 0.5;
      const baseRightY = ry + Math.sin(heading - 2.4) * rr * 0.5;

      ctx.fillStyle = isRunning && !isPaused ? 'rgba(96, 165, 250, 0.45)' : 'rgba(217, 119, 87, 0.45)';
      ctx.beginPath();
      ctx.moveTo(tipX, tipY);
      ctx.lineTo(baseLeftX, baseLeftY);
      ctx.lineTo(baseRightX, baseRightY);
      ctx.closePath();
      ctx.fill();

      // 7. Rotating Top LiDAR Turret
      const turretRad = ws(0.08);
      ctx.fillStyle = '#141413';
      ctx.beginPath();
      ctx.arc(rx, ry, turretRad, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = isRunning && !isPaused ? CLAUDE_COLORS.roverLedActive : CLAUDE_COLORS.roverLed;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Rotating Laser Beam Inside Turret
      lidarSweepRef.current += 0.08;
      ctx.strokeStyle = isRunning && !isPaused ? '#60a5fa' : '#d97757';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(rx, ry);
      ctx.lineTo(rx + Math.cos(lidarSweepRef.current) * turretRad, ry + Math.sin(lidarSweepRef.current) * turretRad);
      ctx.stroke();

      // Rover Status LED Perimeter Ring
      ctx.strokeStyle = isRunning && !isPaused ? CLAUDE_COLORS.roverLedActive : isPaused ? '#d97757' : '#575752';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(rx, ry, rr - ws(0.03), 0, Math.PI * 2);
      ctx.stroke();
    }
  }, [environment, robotState, plannedPath, actualPath, openSet, closedSet,
      candidateTrajectories, selectedTrajectory, vizState, coverageGrid, config,
      currentWaypointIndex, brushRotating, getScale]);

  // Main animation loop
  useEffect(() => {
    let running = true;
    const loop = (timestamp: number) => {
      if (!running) return;
      const dt = Math.min((timestamp - lastTimeRef.current) / 1000, 0.05);
      lastTimeRef.current = timestamp;

      if (isRunning && !isPaused) {
        updateSimulation(dt);
      }
      render();
      animFrameRef.current = requestAnimationFrame(loop);
    };
    animFrameRef.current = requestAnimationFrame(loop);
    return () => { running = false; cancelAnimationFrame(animFrameRef.current); };
  }, [isRunning, isPaused, updateSimulation, render]);

  // Screen to world
  const screenToWorld = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas || !environment) return { wx: 0, wy: 0 };
    const rect = canvas.getBoundingClientRect();
    const px = clientX - rect.left;
    const py = clientY - rect.top;
    const { cameraZoom, cameraX, cameraY } = vizState;
    const scale = getScale(environment, canvas.width, canvas.height, cameraZoom);
    const offsetX = (canvas.width - environment.width * scale) / 2 + cameraX;
    const offsetY = (canvas.height - environment.height * scale) / 2 + cameraY;
    const wx = (px - offsetX) / scale;
    const wy = (py - offsetY) / scale;
    return { wx, wy };
  }, [environment, vizState, getScale]);

  // Mouse handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    const { wx, wy } = screenToWorld(e.clientX, e.clientY);

    if (e.button === 1 || e.button === 2 || currentTool === 'inspect') {
      isDraggingRef.current = true;
      lastMouseRef.current = { x: e.clientX, y: e.clientY };
      return;
    }

    if (currentTool === 'set_goal') {
      setGoalPosition({ x: Math.max(0.4, Math.min(config.mapWidth - 0.4, wx)), y: Math.max(0.4, Math.min(config.mapHeight - 0.4, wy)) });
    } else if (currentTool === 'set_robot') {
      setRobotPosition({ x: Math.max(0.4, Math.min(config.mapWidth - 0.4, wx)), y: Math.max(0.4, Math.min(config.mapHeight - 0.4, wy)) });
    } else if (currentTool === 'add_obstacle') {
      addCustomObstacle(wx, wy);
      isPaintingRef.current = true;
    } else if (currentTool === 'add_dirt') {
      addDirtPatch(wx, wy);
      isPaintingRef.current = true;
    } else if (currentTool === 'erase') {
      eraseAt(wx, wy);
      isPaintingRef.current = true;
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const { wx, wy } = screenToWorld(e.clientX, e.clientY);
    setMouseCoord({ x: wx, y: wy });

    if (isDraggingRef.current) {
      const dx = e.clientX - lastMouseRef.current.x;
      const dy = e.clientY - lastMouseRef.current.y;
      useSimulationStore.getState().setVizState({
        cameraX: vizState.cameraX + dx,
        cameraY: vizState.cameraY + dy,
      });
      lastMouseRef.current = { x: e.clientX, y: e.clientY };
    } else if (isPaintingRef.current) {
      if (currentTool === 'add_dirt') addDirtPatch(wx, wy, 0.5);
      else if (currentTool === 'erase') eraseAt(wx, wy);
    }
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
    isPaintingRef.current = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    const delta = e.deltaY > 0 ? 0.92 : 1.08;
    useSimulationStore.getState().setVizState({
      cameraZoom: Math.max(0.3, Math.min(4.5, vizState.cameraZoom * delta)),
    });
  };

  const tools: { id: CanvasTool; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
    { id: 'inspect', label: 'Pan', icon: MousePointer },
    { id: 'set_goal', label: 'Goal', icon: Target },
    { id: 'set_robot', label: 'Rover', icon: Navigation },
    { id: 'add_obstacle', label: 'Wall', icon: Square },
    { id: 'add_dirt', label: 'Dirt', icon: Sparkles },
    { id: 'erase', label: 'Erase', icon: Eraser },
  ];

  return (
    <div ref={containerRef} className="relative w-full h-full select-none bg-[#141413] rounded-xl overflow-hidden border border-[#232320]">
      <canvas
        ref={canvasRef}
        className="w-full h-full block cursor-crosshair"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onContextMenu={(e) => e.preventDefault()}
      />

      {/* Floating Toolbar (Claude Console pill style) */}
      <div className="absolute top-3 left-3 flex items-center gap-1 bg-[#1a1a18]/90 backdrop-blur border border-[#262624] p-1 rounded-lg shadow-lg z-20">
        {tools.map(t => {
          const Icon = t.icon;
          const active = currentTool === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTool(t.id)}
              title={t.label}
              className={`p-1.5 px-2.5 rounded-md text-xs transition-all flex items-center gap-1.5 font-sans ${
                active
                  ? 'bg-[#2a2a26] text-[#f4f4f0] shadow-sm font-medium'
                  : 'text-[#8e8e89] hover:text-[#f4f4f0] hover:bg-[#222220]'
              }`}
            >
              <Icon size={13} />
              <span className="text-[11px]">{t.label}</span>
            </button>
          );
        })}

        <div className="w-[1px] h-4 bg-[#2a2a26] mx-1" />

        <button
          onClick={() => useSimulationStore.getState().setVizState({ cameraZoom: Math.min(4.5, vizState.cameraZoom + 0.25) })}
          title="Zoom In"
          className="p-1.5 text-[#8e8e89] hover:text-[#f4f4f0] hover:bg-[#222220] rounded"
        >
          <ZoomIn size={13} />
        </button>
        <button
          onClick={() => useSimulationStore.getState().setVizState({ cameraZoom: Math.max(0.4, vizState.cameraZoom - 0.25) })}
          title="Zoom Out"
          className="p-1.5 text-[#8e8e89] hover:text-[#f4f4f0] hover:bg-[#222220] rounded"
        >
          <ZoomOut size={13} />
        </button>
        <button
          onClick={() => useSimulationStore.getState().setVizState({ cameraX: 0, cameraY: 0, cameraZoom: 1 })}
          title="Reset View"
          className="p-1.5 text-[#8e8e89] hover:text-[#f4f4f0] hover:bg-[#222220] rounded"
        >
          <Maximize2 size={13} />
        </button>
      </div>

      {/* Floating Rover Telemetry Pill (Top Right) */}
      <div className="absolute top-3 right-3 bg-[#1a1a18]/90 backdrop-blur border border-[#262624] px-3 py-1.5 rounded-lg shadow-lg text-xs font-mono text-[#a1a19c] flex items-center gap-3 z-20">
        {robotState && (
          <>
            <div className="flex items-center gap-1.5">
              <span className="text-[#6e6e69]">ROVER</span>
              <span className="text-[#f4f4f0] font-medium">{robotState.pose.x.toFixed(2)}, {robotState.pose.y.toFixed(2)}m</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[#6e6e69]">θ</span>
              <span className="text-[#d97757] font-medium">{((robotState.pose.theta * 180 / Math.PI + 360) % 360).toFixed(0)}°</span>
            </div>
            <div className="flex items-center gap-1.5 pl-2 border-l border-[#262624]">
              <span className="text-[#6e6e69]">BATT</span>
              <span className={`font-medium ${batteryLevel > 30 ? 'text-[#a7c4bc]' : 'text-[#d97757]'}`}>
                {batteryLevel.toFixed(0)}%
              </span>
            </div>
          </>
        )}
      </div>

      {/* Cursor coordinate */}
      {mouseCoord && (
        <div className="absolute bottom-3 right-3 bg-[#1a1a18]/80 backdrop-blur border border-[#262624] px-2.5 py-1 rounded text-[11px] font-mono text-[#71716b] pointer-events-none z-20">
          ({mouseCoord.x.toFixed(2)}, {mouseCoord.y.toFixed(2)})m
        </div>
      )}
    </div>
  );
}
