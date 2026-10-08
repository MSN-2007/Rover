'use client';

import React, { useRef, useEffect, useCallback, useState } from 'react';
import { useSimulationStore, CanvasTool } from '@/store/simulationStore';
import { Environment } from '@/simulation/core/types';
import { MousePointer, Target, Navigation, Square, Sparkles, Eraser, ZoomIn, ZoomOut, Maximize2, Compass } from 'lucide-react';

const THEME = {
  background: '#131312',
  floorTile: '#171715',
  floorGrid: '#1f1f1c',
  roomFill: '#181816',
  roomBorder: '#272724',
  roomLabel: '#8a8a83',
  wallFill: '#2a2a26',
  wallBorder: '#3c3c36',
  furnitureFill: '#20201d',
  furnitureBorder: '#30302b',
  furnitureText: '#9a9a92',
  dynamicObstacle: '#d97757',
  dynamicGlow: 'rgba(217, 119, 87, 0.25)',
  roverBodyStart: '#30302c',
  roverBodyEnd: '#1f1f1d',
  roverBumper: '#181816',
  roverWheel: '#10100e',
  roverLedCoral: '#d97757',
  roverLedBlue: '#60a5fa',
  goalReticle: '#d97757',
  plannedPath: '#60a5fa',
  actualTrajectory: '#a7c4bc',
  lidarRay: 'rgba(96, 165, 250, 0.09)',
  lidarHit: '#d97757',
  openSet: 'rgba(217, 119, 87, 0.16)',
  closedSet: 'rgba(96, 165, 250, 0.12)',
  coveredFloor: 'rgba(167, 196, 188, 0.13)',
  coveredBorder: 'rgba(167, 196, 188, 0.25)',
  dustGrain: '#b45309',
  dustHighlight: '#d97757',
  dockBase: '#1c1c1a',
  dockBorder: '#32322e',
  rugFill: 'rgba(38, 38, 35, 0.4)',
  rugBorder: 'rgba(217, 119, 87, 0.15)',
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
  const pathPulseRef = useRef(0);
  const suctionParticlesRef = useRef<Array<{ x: number; y: number; vx: number; vy: number; life: number; maxLife: number; size: number }>>([]);

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

  // Resize canvas to parent
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

    // Pulse counter for moving path energy
    pathPulseRef.current = (pathPulseRef.current + 0.3) % 20;

    // 1. Warm Architectural Floor
    ctx.fillStyle = THEME.background;
    ctx.fillRect(0, 0, cw, ch);

    // Floor Parquet / Architectural Tile Pattern
    const res = config.gridResolution;
    ctx.strokeStyle = THEME.floorGrid;
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

    // 2. Open Set & Closed Set (Graph Search Diagnostics)
    if (vizState.showOpenSet && openSet.length > 0) {
      ctx.fillStyle = THEME.openSet;
      for (const n of openSet) {
        ctx.fillRect(wx(n.x * res), wy(n.y * res), ws(res), ws(res));
      }
    }
    if (vizState.showClosedSet && closedSet.length > 0) {
      ctx.fillStyle = THEME.closedSet;
      for (const n of closedSet) {
        ctx.fillRect(wx(n.x * res), wy(n.y * res), ws(res), ws(res));
      }
    }

    // 3. Cleaned Floor Swath (Vacuum Wake)
    if (vizState.showCoverage && coverageGrid.length > 0) {
      ctx.fillStyle = THEME.coveredFloor;
      for (let gy = 0; gy < coverageGrid.length; gy++) {
        for (let gx = 0; gx < coverageGrid[gy].length; gx++) {
          if (coverageGrid[gy][gx]) {
            ctx.fillRect(wx(gx * res), wy(gy * res), ws(res), ws(res));
          }
        }
      }
    }

    // 4. Room Boundaries & Architectural Typography
    for (const room of environment.rooms) {
      // Room floor tint
      ctx.fillStyle = THEME.roomFill;
      ctx.fillRect(wx(room.x), wy(room.y), ws(room.width), ws(room.height));

      // Delicate architectural border
      ctx.strokeStyle = THEME.roomBorder;
      ctx.lineWidth = 1;
      ctx.strokeRect(wx(room.x), wy(room.y), ws(room.width), ws(room.height));

      // Room label (Georgia serif)
      ctx.fillStyle = THEME.roomLabel;
      ctx.font = `500 ${Math.max(10, ws(0.26))}px Georgia, serif`;
      ctx.textAlign = 'left';
      ctx.fillText(room.label, wx(room.x + 0.35), wy(room.y + 0.45));
    }

    // 5. Dust Regions & Granular Dirt Specks
    if (vizState.showDirtMap && environment.grid) {
      for (let gy = 0; gy < environment.grid.height; gy++) {
        for (let gx = 0; gx < environment.grid.width; gx++) {
          const cell = environment.grid.cells[gy][gx];
          if (cell.dirtProbability > 0.05) {
            const alpha = Math.min(0.85, cell.dirtProbability);

            // Dust gradient patch
            ctx.fillStyle = `rgba(180, 83, 9, ${alpha * 0.7})`;
            ctx.fillRect(wx(gx * res), wy(gy * res), ws(res), ws(res));

            // Micro dust particles
            if (cell.dirtProbability > 0.25) {
              ctx.fillStyle = THEME.dustHighlight;
              const px = wx(gx * res + res * 0.35);
              const py = wy(gy * res + res * 0.4);
              ctx.beginPath();
              ctx.arc(px, py, Math.max(1.2, ws(0.035)), 0, Math.PI * 2);
              ctx.fill();

              const px2 = wx(gx * res + res * 0.75);
              const py2 = wy(gy * res + res * 0.7);
              ctx.beginPath();
              ctx.arc(px2, py2, Math.max(1.0, ws(0.025)), 0, Math.PI * 2);
              ctx.fill();
            }
          }
        }
      }
    }

    // 3.5. Living Room Luxury Area Rug
    for (const furn of environment.furniture) {
      if (furn.label?.toLowerCase().includes('table')) {
        const rugX = wx(furn.x - 0.35);
        const rugY = wy(furn.y - 0.35);
        const rugW = ws(furn.width + 0.7);
        const rugH = ws(furn.height + 0.7);
        ctx.fillStyle = THEME.rugFill;
        ctx.beginPath();
        if (typeof ctx.roundRect === 'function') {
          ctx.roundRect(rugX, rugY, rugW, rugH, ws(0.08));
        } else {
          ctx.rect(rugX, rugY, rugW, rugH);
        }
        ctx.fill();
        ctx.strokeStyle = THEME.rugBorder;
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
        break;
      }
    }

    // 3.6. Home Base Charging Dock Station
    if (config.startPose) {
      const dockX = wx(config.startPose.x);
      const dockY = wy(config.startPose.y);
      const dockW = ws(0.34);
      const dockH = ws(0.22);

      ctx.save();
      ctx.translate(dockX, dockY);
      ctx.rotate(config.startPose.theta);

      // Dock backplate & ramp
      ctx.fillStyle = THEME.dockBase;
      ctx.beginPath();
      if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(-dockW / 2, -dockH / 2, dockW, dockH, [ws(0.03), ws(0.03), 0, 0]);
      } else {
        ctx.rect(-dockW / 2, -dockH / 2, dockW, dockH);
      }
      ctx.fill();
      ctx.strokeStyle = THEME.dockBorder;
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Dual brass spring-loaded charging contacts
      ctx.fillStyle = '#eab308';
      ctx.fillRect(-dockW * 0.28, -dockH * 0.15, dockW * 0.14, dockH * 0.35);
      ctx.fillRect(dockW * 0.14, -dockH * 0.15, dockW * 0.14, dockH * 0.35);

      // Dock status LED (soft green indicator)
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(0, -dockH * 0.32, Math.max(2, ws(0.025)), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.fillStyle = '#6e6e69';
      ctx.font = `600 ${Math.max(8, ws(0.13))}px -apple-system, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('HOME DOCK', dockX, dockY + dockH * 0.7);
    }

    // 6. Furniture & Architectural Stencils
    for (const furn of environment.furniture) {
      const fx = wx(furn.x);
      const fy = wy(furn.y);
      const fw = ws(furn.width);
      const fh = ws(furn.height);

      // Subtle drop shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.fillRect(fx + 2, fy + 2, fw, fh);

      // Body fill
      ctx.fillStyle = THEME.furnitureFill;
      ctx.fillRect(fx, fy, fw, fh);
      ctx.strokeStyle = THEME.furnitureBorder;
      ctx.lineWidth = 1.2;
      ctx.strokeRect(fx, fy, fw, fh);

      // Inner architectural detail (e.g., Sofa cushions or table inner edge)
      if (furn.width > 1.2 && furn.height > 0.6) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
        ctx.strokeRect(fx + ws(0.1), fy + ws(0.1), fw - ws(0.2), fh - ws(0.2));
      }

      // Label badge
      ctx.fillStyle = THEME.furnitureText;
      ctx.font = `400 ${Math.max(9, ws(0.19))}px -apple-system, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(furn.label ?? 'Furniture', fx + fw / 2, fy + fh / 2 + 3);
    }

    // 7. Double-Lined Architectural Walls
    for (const wall of environment.walls) {
      const wx_pos = wx(wall.x);
      const wy_pos = wy(wall.y);
      const ww = ws(wall.width);
      const wh = ws(wall.height);

      ctx.fillStyle = THEME.wallFill;
      ctx.fillRect(wx_pos, wy_pos, ww, wh);
      ctx.strokeStyle = THEME.wallBorder;
      ctx.lineWidth = 1.2;
      ctx.strokeRect(wx_pos, wy_pos, ww, wh);
    }

    // 8. Dynamic Moving Obstacles
    for (const dyn of environment.dynamicObstacles) {
      const cx = wx(dyn.x + dyn.width / 2);
      const cy = wy(dyn.y + dyn.height / 2);
      const rad = ws(dyn.width / 2);

      // Ambient glow
      ctx.fillStyle = THEME.dynamicGlow;
      ctx.beginPath();
      ctx.arc(cx, cy, rad + ws(0.1), 0, Math.PI * 2);
      ctx.fill();

      // Disc
      ctx.fillStyle = THEME.dynamicObstacle;
      ctx.beginPath();
      ctx.arc(cx, cy, rad, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#f4f4f0';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Heading velocity arrow
      if (dyn.velocity) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + dyn.velocity.x * scale * 0.35, cy + dyn.velocity.y * scale * 0.35);
        ctx.stroke();
      }

      ctx.fillStyle = '#f4f4f0';
      ctx.font = `600 ${Math.max(9, ws(0.18))}px -apple-system, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(dyn.label ?? 'Obstacle', cx, cy - rad - 5);
    }

    // 9. DWA Candidate Motion Arcs
    if (vizState.showCandidateTrajectories && candidateTrajectories.length > 0) {
      for (const cand of candidateTrajectories) {
        ctx.strokeStyle = cand.collides ? 'rgba(217, 119, 87, 0.22)' : 'rgba(96, 165, 250, 0.12)';
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

    // Selected DWA motion trajectory
    if (selectedTrajectory.length > 0) {
      ctx.strokeStyle = THEME.plannedPath;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      let first = true;
      for (const pt of selectedTrajectory) {
        if (first) { ctx.moveTo(wx(pt.x), wy(pt.y)); first = false; }
        else ctx.lineTo(wx(pt.x), wy(pt.y));
      }
      ctx.stroke();
    }

    // 10. Global Planned Path (Animated Flow Pulse)
    if (vizState.showPlannedPath && plannedPath.length > 1) {
      ctx.strokeStyle = THEME.plannedPath;
      ctx.lineWidth = 2.2;
      ctx.setLineDash([7, 5]);
      ctx.lineDashOffset = -pathPulseRef.current;
      ctx.beginPath();
      ctx.moveTo(wx(plannedPath[0].x), wy(plannedPath[0].y));
      for (let i = 1; i < plannedPath.length; i++) {
        ctx.lineTo(wx(plannedPath[i].x), wy(plannedPath[i].y));
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // Waypoint nodes
      for (let i = 0; i < plannedPath.length; i++) {
        const isCurrent = i === currentWaypointIndex;
        ctx.fillStyle = isCurrent ? '#60a5fa' : 'rgba(96, 165, 250, 0.35)';
        ctx.beginPath();
        ctx.arc(wx(plannedPath[i].x), wy(plannedPath[i].y), ws(isCurrent ? 0.08 : 0.04), 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 11. Actual Traveled Odometry Trail
    if (vizState.showActualPath && actualPath.length > 1) {
      ctx.strokeStyle = THEME.actualTrajectory;
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

    // 12. Holographic Goal Reticle
    const goal = config.goalPosition;
    const gx = wx(goal.x);
    const gy = wy(goal.y);
    const gRad = ws(0.28);

    // Outer reticle circle
    ctx.strokeStyle = THEME.goalReticle;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(gx, gy, gRad, 0, Math.PI * 2);
    ctx.stroke();

    // Inner dashed spinning ring
    ctx.save();
    ctx.translate(gx, gy);
    ctx.rotate(pathPulseRef.current * 0.1);
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.arc(0, 0, gRad * 0.6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // Crosshairs
    ctx.beginPath();
    ctx.moveTo(gx - gRad * 1.3, gy); ctx.lineTo(gx + gRad * 1.3, gy);
    ctx.moveTo(gx, gy - gRad * 1.3); ctx.lineTo(gx, gy + gRad * 1.3);
    ctx.stroke();

    ctx.fillStyle = THEME.goalReticle;
    ctx.font = `600 ${Math.max(9, ws(0.18))}px -apple-system, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('GOAL', gx, gy - gRad - 5);

    // 13. Volumetric LiDAR Laser Fan
    if (vizState.showSensorRays && robotState) {
      for (const ray of robotState.lidarReadings) {
        ctx.strokeStyle = ray.hit ? 'rgba(217, 119, 87, 0.35)' : THEME.lidarRay;
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(wx(robotState.pose.x), wy(robotState.pose.y));
        ctx.lineTo(wx(ray.hitPoint.x), wy(ray.hitPoint.y));
        ctx.stroke();

        if (ray.hit) {
          ctx.fillStyle = THEME.lidarHit;
          ctx.beginPath();
          ctx.arc(wx(ray.hitPoint.x), wy(ray.hitPoint.y), 2.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // ==========================================
    // 14. HIGH-FIDELITY VACUUM ROVER
    // ==========================================
    if (robotState) {
      const rx = wx(robotState.pose.x);
      const ry = wy(robotState.pose.y);
      const rr = ws(0.24); // 24cm radius
      const heading = robotState.pose.theta;

      // Animate corner brushes when roving
      if (brushRotating) {
        brushAngleRef.current += 0.28;
      }

      // 0. Rover Floor Grounded Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.beginPath();
      ctx.ellipse(rx + 2, ry + 4, rr * 1.04, rr * 0.96, heading, 0, Math.PI * 2);
      ctx.fill();

      // 1. Dual Motorized Tread Wheels with Rubber Grips
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
        ctx.fillStyle = THEME.roverWheel;
        ctx.fillRect(-wheelW / 2, -wheelH / 2, wheelW, wheelH);
        ctx.strokeStyle = '#2d2d29';
        ctx.lineWidth = 1;
        ctx.strokeRect(-wheelW / 2, -wheelH / 2, wheelW, wheelH);

        // Tread grooves
        ctx.strokeStyle = '#3e3e38';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-wheelW / 4, -wheelH / 2); ctx.lineTo(-wheelW / 4, wheelH / 2);
        ctx.moveTo(wheelW / 4, -wheelH / 2); ctx.lineTo(wheelW / 4, wheelH / 2);
        ctx.stroke();
        ctx.restore();
      }

      // 2. Dual Front Corner Rotating Sweeper Brushes
      const brushOffset = rr * 0.88;
      const brushAngles = [heading + 0.65, heading - 0.65];

      for (const ba of brushAngles) {
        const bx = rx + Math.cos(ba) * brushOffset;
        const by = ry + Math.sin(ba) * brushOffset;
        const br = ws(0.09);

        // Bristle arms (whirling 3-star)
        ctx.strokeStyle = '#a1a19c';
        ctx.lineWidth = 1.3;
        for (let arm = 0; arm < 3; arm++) {
          const a = brushAngleRef.current + (arm * (Math.PI * 2 / 3));
          ctx.beginPath();
          ctx.moveTo(bx, by);
          ctx.lineTo(bx + Math.cos(a) * br, by + Math.sin(a) * br);
          ctx.stroke();
        }

        // Center brush hub
        ctx.fillStyle = '#141413';
        ctx.beginPath();
        ctx.arc(bx, by, ws(0.02), 0, Math.PI * 2);
        ctx.fill();
      }

      // 3. Rover Front Shock Bumper Rim
      ctx.fillStyle = THEME.roverBumper;
      ctx.beginPath();
      ctx.arc(rx, ry, rr + ws(0.02), 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#33332f';
      ctx.lineWidth = 1.8;
      ctx.stroke();

      // 4. Rover Matte Titanium Chassis
      const chassisGrad = ctx.createRadialGradient(rx, ry, 2, rx, ry, rr);
      chassisGrad.addColorStop(0, THEME.roverBodyStart);
      chassisGrad.addColorStop(1, THEME.roverBodyEnd);
      ctx.fillStyle = chassisGrad;
      ctx.beginPath();
      ctx.arc(rx, ry, rr, 0, Math.PI * 2);
      ctx.fill();

      // 5. Center Suction Roller Slot (Vacuum intake underbody)
      ctx.save();
      ctx.translate(rx, ry);
      ctx.rotate(heading);
      ctx.fillStyle = '#10100e';
      ctx.fillRect(-ws(0.035), -ws(0.12), ws(0.07), ws(0.24));
      ctx.strokeStyle = '#252522';
      ctx.lineWidth = 1;
      ctx.strokeRect(-ws(0.035), -ws(0.12), ws(0.07), ws(0.24));
      ctx.restore();

      // 6. Forward Direction Chevron
      const tipX = rx + Math.cos(heading) * rr * 0.9;
      const tipY = ry + Math.sin(heading) * rr * 0.9;
      const baseLeftX = rx + Math.cos(heading + 2.4) * rr * 0.5;
      const baseLeftY = ry + Math.sin(heading + 2.4) * rr * 0.5;
      const baseRightX = rx + Math.cos(heading - 2.4) * rr * 0.5;
      const baseRightY = ry + Math.sin(heading - 2.4) * rr * 0.5;

      ctx.fillStyle = isRunning && !isPaused ? 'rgba(96, 165, 250, 0.5)' : 'rgba(217, 119, 87, 0.5)';
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
      ctx.strokeStyle = isRunning && !isPaused ? THEME.roverLedBlue : THEME.roverLedCoral;
      ctx.lineWidth = 1.6;
      ctx.stroke();

      // Rotating Laser Beam inside Optic Dome
      lidarSweepRef.current += 0.08;
      ctx.strokeStyle = isRunning && !isPaused ? '#60a5fa' : '#d97757';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(rx, ry);
      ctx.lineTo(rx + Math.cos(lidarSweepRef.current) * turretRad, ry + Math.sin(lidarSweepRef.current) * turretRad);
      ctx.stroke();

      // Rover Status LED Outer Ring
      ctx.strokeStyle = isRunning && !isPaused ? THEME.roverLedBlue : isPaused ? THEME.roverLedCoral : '#484844';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(rx, ry, rr - ws(0.03), 0, Math.PI * 2);
      ctx.stroke();

      // 8. Active Dynamic Dust Suction Vortex
      if (isRunning && !isPaused) {
        // Spawn 2 micro suction particles per frame ahead of sweeper brushes
        for (let i = 0; i < 2; i++) {
          const spawnAngle = heading + (Math.random() - 0.5) * 1.5;
          const spawnDist = rr * (1.1 + Math.random() * 0.45);
          suctionParticlesRef.current.push({
            x: rx + Math.cos(spawnAngle) * spawnDist,
            y: ry + Math.sin(spawnAngle) * spawnDist,
            vx: 0,
            vy: 0,
            life: 1.0,
            maxLife: 1.0,
            size: Math.max(1.1, ws(0.02 + Math.random() * 0.02)),
          });
        }
      }

      // Render & attract suction particles to intake slot
      for (let i = suctionParticlesRef.current.length - 1; i >= 0; i--) {
        const p = suctionParticlesRef.current[i];
        const dx = rx - p.x;
        const dy = ry - p.y;
        const dist = Math.hypot(dx, dy);

        // Suction vacuum intake draw
        const suctionPull = ws(0.07);
        p.x += (dx / (dist + 0.001)) * suctionPull;
        p.y += (dy / (dist + 0.001)) * suctionPull;
        p.life -= 0.055;

        if (p.life <= 0 || dist < ws(0.05)) {
          suctionParticlesRef.current.splice(i, 1);
          continue;
        }

        ctx.fillStyle = `rgba(217, 119, 87, ${p.life * 0.75})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      // 9. Aerodynamic Rear Airflow Exhaust
      if (isRunning && !isPaused) {
        const exhaustAngle = heading + Math.PI;
        const exX = rx + Math.cos(exhaustAngle) * (rr * 0.95);
        const exY = ry + Math.sin(exhaustAngle) * (rr * 0.95);
        ctx.fillStyle = 'rgba(96, 165, 250, 0.09)';
        ctx.beginPath();
        ctx.arc(exX, exY, ws(0.08), 0, Math.PI * 2);
        ctx.fill();
      }
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

  // Screen to world coordinates
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
    { id: 'add_obstacle', label: 'Block', icon: Square },
    { id: 'add_dirt', label: 'Dust', icon: Sparkles },
    { id: 'erase', label: 'Eraser', icon: Eraser },
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

      {/* Floating Canvas Tool HUD (Claude Glassmorphic Toolbar) */}
      <div className="absolute top-3 left-3 flex items-center gap-1 glass-toolbar p-1.5 rounded-xl shadow-xl z-20">
        {tools.map(t => {
          const Icon = t.icon;
          const active = currentTool === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTool(t.id)}
              title={t.label}
              className={`p-1.5 px-2.5 rounded-lg text-xs transition-all flex items-center gap-1.5 font-sans ${
                active
                  ? 'bg-[#2a2a26] text-[#f4f4f0] shadow-sm font-medium border border-[#3c3c36]'
                  : 'text-[#8e8e89] hover:text-[#f4f4f0] hover:bg-[#222220]'
              }`}
            >
              <Icon size={13} />
              <span className="text-[11px]">{t.label}</span>
            </button>
          );
        })}

        <div className="w-[1px] h-4 bg-[#2e2e2a] mx-1" />

        <button
          onClick={() => useSimulationStore.getState().setVizState({ cameraZoom: Math.min(4.5, vizState.cameraZoom + 0.25) })}
          title="Zoom In"
          className="p-1.5 text-[#8e8e89] hover:text-[#f4f4f0] hover:bg-[#222220] rounded-lg"
        >
          <ZoomIn size={13} />
        </button>
        <button
          onClick={() => useSimulationStore.getState().setVizState({ cameraZoom: Math.max(0.4, vizState.cameraZoom - 0.25) })}
          title="Zoom Out"
          className="p-1.5 text-[#8e8e89] hover:text-[#f4f4f0] hover:bg-[#222220] rounded-lg"
        >
          <ZoomOut size={13} />
        </button>
        <button
          onClick={() => useSimulationStore.getState().setVizState({ cameraX: 0, cameraY: 0, cameraZoom: 1 })}
          title="Center Camera View"
          className="p-1.5 text-[#8e8e89] hover:text-[#f4f4f0] hover:bg-[#222220] rounded-lg"
        >
          <Maximize2 size={13} />
        </button>
      </div>

      {/* Floating Telemetry Badge (Top Right) */}
      <div className="absolute top-3 right-3 glass-toolbar px-3 py-1.5 rounded-xl shadow-xl text-xs font-mono text-[#a1a19c] flex items-center gap-3 z-20">
        {robotState && (
          <>
            <div className="flex items-center gap-1.5">
              <span className="text-[#6e6e69]">ROVER</span>
              <span className="text-[#f4f4f0] font-medium">{robotState.pose.x.toFixed(2)}, {robotState.pose.y.toFixed(2)}m</span>
            </div>
            <div className="flex items-center gap-1">
              <Compass size={12} className="text-[#d97757]" />
              <span className="text-[#d97757] font-medium">{((robotState.pose.theta * 180 / Math.PI + 360) % 360).toFixed(0)}°</span>
            </div>
            <div className="flex items-center gap-1.5 pl-2 border-l border-[#2e2e2a]">
              <span className="text-[#6e6e69]">BATT</span>
              <span className={`font-medium ${batteryLevel > 30 ? 'text-[#a7c4bc]' : 'text-[#d97757]'}`}>
                {batteryLevel.toFixed(0)}%
              </span>
            </div>
          </>
        )}
      </div>

      {/* Bottom Cursor World Coordinates */}
      {mouseCoord && (
        <div className="absolute bottom-3 right-3 glass-toolbar px-2.5 py-1 rounded-lg text-[11px] font-mono text-[#71716b] pointer-events-none z-20">
          ({mouseCoord.x.toFixed(2)}, {mouseCoord.y.toFixed(2)})m
        </div>
      )}
    </div>
  );
}
