"use client";

import { useEffect, useRef, useState } from "react";
import type { Zone } from "@/types/stats";
import {
  drawCourt,
  drawOrigin,
  drawLine,
  drawGhostTrajectories,
  getNormalizedPos,
} from "@/utils/canvasUtils";
import "../SpikeDraw/spikeDraw.css";

interface Props {
  team: "own" | "opponent";
  zone: Zone;
  onClose: () => void;
  onServeDraw: (
    team: "own" | "opponent",
    zone: Zone,
    start: { x: number; y: number },
    end: { x: number; y: number }
  ) => void;
}

export function ServeDraw({ team, zone, onClose, onServeDraw }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentEnd, setCurrentEnd] = useState<{ x: number; y: number } | null>(null);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);

  const isAllowedServeStart = (pos: { x: number; y: number }) => {
    const band = 0.15;
    return team === "own" ? pos.y >= 1 - band : pos.y <= band;
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    const canvas = canvasRef.current!;
    const pos = getNormalizedPos(e, canvas);
    if (!isAllowedServeStart(pos)) return;
    setStartPoint(pos);
    setIsDrawing(true);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDrawing || !startPoint) return;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const pos = getNormalizedPos(e, canvas);
    setCurrentEnd(pos);

    drawCourt(ctx, canvas);
    drawGhostTrajectories(ctx, canvas, []);
    drawOrigin(ctx, canvas, startPoint);
    drawLine(ctx, canvas, startPoint, pos);
  };

  const handlePointerUp = () => {
    if (!isDrawing || !currentEnd || !startPoint) return;
    onServeDraw(team, zone, startPoint, currentEnd);
    setIsDrawing(false);
    setCurrentEnd(null);
    setStartPoint(null);

    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    drawCourt(ctx, canvas);
    drawGhostTrajectories(ctx, canvas, []);
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
      drawGhostTrajectories(ctx, canvas, []);
    };

    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [team, zone]);

  return (
    <div className="spike-draw-overlay">
      <div className="spike-draw-container">
        <div className="spike-draw-header">
          <span>Saque - dibuja desde fondo</span>
          <button className="close-btn" onClick={onClose}>
            x
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
