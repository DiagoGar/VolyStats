"use client";

import { useEffect, useRef, useState } from "react";
import type { Zone } from "@/types/stats";
import type { SpikeVector, Complex, PlayerRole } from "@/types/spike";
import { zoneOrigins } from "./zoneOrigins";
import {
  drawCourt,
  drawOrigin,
  drawLine,
  drawAverageArrow,
  drawGhostTrajectories,
  drawAngularFan,
  isNearOrigin,
  getNormalizedPos,
} from "@/utils/canvasUtils";
import "./spikeDraw.css";

interface Props {
  team: "own" | "opponent";
  zone: Zone;
  complex: Complex;
  playerRole?: PlayerRole;
  onClose: () => void;

  onSpikeDraw: (
    team: "own" | "opponent",
    zone: Zone,
    start: { x: number; y: number },
    end: { x: number; y: number }
  ) => void;

  // 🔹 NUEVO: ángulo promedio (en radianes)
  averageAngle?: number | null;
  
  // 🔹 NUEVO: historial de trayectorias de la zona
  trajectories?: SpikeVector[];
  
  // 🔹 NUEVO: desviación angular (en radianes)
  angularDeviation?: number | null;
}

export function SpikeDraw({
  team,
  zone,
  complex,
  playerRole,
  onClose,
  onSpikeDraw,
  averageAngle,
  trajectories = [],
  angularDeviation,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [isDrawing, setIsDrawing] = useState(false);
  const [currentEnd, setCurrentEnd] = useState<{ x: number; y: number } | null>(
    null
  );

  const origin = team === "opponent"
    ? { x: 1 - zoneOrigins[zone].x, y: 1 - zoneOrigins[zone].y }
    : zoneOrigins[zone];

  const handlePointerDown = (e: React.PointerEvent) => {
    const canvas = canvasRef.current!;
    const pos = getNormalizedPos(e, canvas);

    if (isNearOrigin(pos, origin)) {
      setIsDrawing(true);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const pos = getNormalizedPos(e, canvas);

    setCurrentEnd(pos);

    drawCourt(ctx, canvas);
    
    // 🔹 Dibujar historial fantasma primero (para que no compita visualmente)
    drawGhostTrajectories(ctx, canvas, trajectories);
    
    drawOrigin(ctx, canvas, origin);

    // 🔹 Abanico angular
    if (averageAngle != null) {
      drawAngularFan(ctx, canvas, origin, averageAngle, angularDeviation ?? 0);
    }

    drawLine(ctx, canvas, origin, pos);
  };

  const handlePointerUp = () => {
    if (!isDrawing || !currentEnd) return;

    onSpikeDraw(team, zone, origin, currentEnd);

    setIsDrawing(false);
    setCurrentEnd(null);

    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;

    drawCourt(ctx, canvas);
    
    // 🔹 Dibujar historial fantasma
    drawGhostTrajectories(ctx, canvas, trajectories);
    
    drawOrigin(ctx, canvas, origin);

    if (averageAngle != null) {
      drawAngularFan(ctx, canvas, origin, averageAngle, angularDeviation ?? 0);
    }
  };

useEffect(() => {
  const canvas = canvasRef.current;
  if (!canvas) {
    console.log("❌ canvasRef es null");
    return;
  }

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    console.log("❌ no se pudo obtener el contexto 2D");
    return;
  }

  console.log("📌 SpikeDraw useEffect");
  console.log("Zona:", zone);
  console.log("averageAngle recibido:", averageAngle);
  console.log("angularDeviation recibido:", angularDeviation);

  const resize = () => {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    console.log("🔄 resize canvas", canvas.width, canvas.height);

    drawCourt(ctx, canvas);
    
    // 🔹 Dibujar historial fantasma primero
    drawGhostTrajectories(ctx, canvas, trajectories);
    
    drawOrigin(ctx, canvas, origin);

    if (typeof averageAngle === "number") {
      console.log("➡️ dibujando abanico angular con ángulo:", averageAngle);
      drawAngularFan(ctx, canvas, origin, averageAngle, angularDeviation ?? 0);
    } else {
      console.log("⚠️ averageAngle NO es número:", averageAngle);
    }
  };

  resize();
  window.addEventListener("resize", resize);

  return () => window.removeEventListener("resize", resize);
}, [zone, origin, averageAngle, angularDeviation, trajectories]);


  return (
    <div className="spike-draw-overlay">
      <div className="spike-draw-container">
        <div className="spike-draw-header">
          <span>Zona {zone} - {complex}{playerRole ? ` - ${playerRole}` : ''}</span>
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>
        <canvas
          ref={canvasRef}
          className="spike-canvas"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        />
      </div>
    </div>
  );
}
