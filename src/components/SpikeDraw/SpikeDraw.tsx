"use client";

import { useEffect, useRef, useState } from "react";
import type { Zone } from "@/types/stats";
import { zoneOrigins } from "./zoneOrigins";
import "./spikeDraw.css";

interface Props {
  zone: Zone;
  onClose: () => void;

  onSpikeDraw: (
    zone: Zone,
    start: { x: number; y: number },
    end: { x: number; y: number },
  ) => void;
}

export function SpikeDraw({ zone, onClose, onSpikeDraw }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Estados preparados (todavía sin uso)
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentEnd, setCurrentEnd] = useState<{ x: number; y: number } | null>(
    null,
  );

  const origin = zoneOrigins[zone];

  const handlePointerDown = (e: React.PointerEvent) => {
    const canvas = canvasRef.current!;
    const pos = getNormalizedPos(e, canvas);

    if (isNearOrigin(pos, origin)) {
      console.log("Origen tocado – zona", zone);
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

    setIsDrawing(false);
    setCurrentEnd(null);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;

      drawCourt(ctx, canvas);
      drawOrigin(ctx, canvas, origin);
    };

    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [zone, origin]);

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

/* ===========================
   Helpers de canvas
   =========================== */

function drawCourt(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Fondo de cancha
  ctx.fillStyle = "#f7941d";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 2;

  // Borde
  ctx.strokeRect(0, 0, canvas.width, canvas.height);

  // Red
  ctx.beginPath();
  ctx.moveTo(0, canvas.height / 2);
  ctx.lineTo(canvas.width, canvas.height / 2);
  ctx.stroke();
}

function drawOrigin(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  origin: { x: number; y: number },
) {
  ctx.fillStyle = "#1e90ff";
  ctx.beginPath();
  ctx.arc(origin.x * canvas.width, origin.y * canvas.height, 8, 0, Math.PI * 2);
  ctx.fill();
}

function drawLine(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  start: { x: number; y: number },
  end: { x: number; y: number },
) {
  ctx.strokeStyle = "#ff2d2d";
  ctx.lineWidth = 3;

  ctx.beginPath();
  ctx.moveTo(start.x * canvas.width, start.y * canvas.height);
  ctx.lineTo(end.x * canvas.width, end.y * canvas.height);
  ctx.stroke();
}

function isNearOrigin(
  pos: { x: number; y: number },
  origin: { x: number; y: number },
) {
  const dx = pos.x - origin.x;
  const dy = pos.y - origin.y;
  return Math.sqrt(dx * dx + dy * dy) < 0.06;
}

function getNormalizedPos(e: React.PointerEvent, canvas: HTMLCanvasElement) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (e.clientX - rect.left) / rect.width,
    y: (e.clientY - rect.top) / rect.height,
  };
}
