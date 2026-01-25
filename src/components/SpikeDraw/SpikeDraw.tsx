"use client";

import { useEffect, useRef, useState } from "react";
import type { Zone } from "@/types/stats";
import { zoneOrigins } from "./zoneOrigins";
import {
  drawCourt,
  drawOrigin,
  drawLine,
  drawAverageArrow,
  isNearOrigin,
  getNormalizedPos,
} from "@/utils/canvasUtils";
import "./spikeDraw.css";

interface Props {
  zone: Zone;
  onClose: () => void;

  onSpikeDraw: (
    zone: Zone,
    start: { x: number; y: number },
    end: { x: number; y: number }
  ) => void;

  // 🔹 NUEVO: ángulo promedio (en radianes)
  averageAngle?: number | null;
}

export function SpikeDraw({
  zone,
  onClose,
  onSpikeDraw,
  averageAngle,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [isDrawing, setIsDrawing] = useState(false);
  const [currentEnd, setCurrentEnd] = useState<{ x: number; y: number } | null>(
    null
  );

  const origin = zoneOrigins[zone];

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
    drawOrigin(ctx, canvas, origin);

    // 🔹 Flecha promedio
    if (averageAngle != null) {
      drawAverageArrow(ctx, canvas, origin, averageAngle);
    }

    drawLine(ctx, canvas, origin, pos);
  };

  const handlePointerUp = () => {
    if (!isDrawing || !currentEnd) return;

    onSpikeDraw(zone, origin, currentEnd);

    setIsDrawing(false);
    setCurrentEnd(null);

    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;

    drawCourt(ctx, canvas);
    drawOrigin(ctx, canvas, origin);

    if (averageAngle != null) {
      drawAverageArrow(ctx, canvas, origin, averageAngle);
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

  const resize = () => {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    console.log("🔄 resize canvas", canvas.width, canvas.height);

    drawCourt(ctx, canvas);
    drawOrigin(ctx, canvas, origin);

    if (typeof averageAngle === "number") {
      console.log("➡️ dibujando flecha promedio con ángulo:", averageAngle);
      drawAverageArrow(ctx, canvas, origin, averageAngle);
    } else {
      console.log("⚠️ averageAngle NO es número:", averageAngle);
    }
  };

  resize();
  window.addEventListener("resize", resize);

  return () => window.removeEventListener("resize", resize);
}, [zone, origin, averageAngle]);


  return (
    <div className="spike-draw-overlay">
      <div className="spike-draw-container">
        <canvas
          ref={canvasRef}
          className="spike-canvas"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        />

        <button className="close-btn" onClick={onClose}>
          ✕
        </button>
      </div>
    </div>
  );
}
