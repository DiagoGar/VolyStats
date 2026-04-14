"use client";

import { useEffect, useRef, useState } from "react";
import type { Zone } from "@/types/stats";
import { zoneOrigins } from "../SpikeDraw/zoneOrigins";
import {
  drawCourt,
  drawOrigin,
  drawLine,
  drawGhostTrajectories,
  isNearOrigin,
  getNormalizedPos,
} from "@/utils/canvasUtils";
import "../SpikeDraw/spikeDraw.css";

interface Props {
  team: "own" | "opponent";
  zone: Zone;
  playerName?: string;
  onClose: () => void;
  onAttackDraw: (
    team: "own" | "opponent",
    zone: Zone,
    start: { x: number; y: number },
    end: { x: number; y: number }
  ) => void;
}

export function AttackDraw({ team, zone, playerName, onClose, onAttackDraw }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentEnd, setCurrentEnd] = useState<{ x: number; y: number } | null>(null);

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
    drawGhostTrajectories(ctx, canvas, []);
    drawOrigin(ctx, canvas, origin);
    drawLine(ctx, canvas, origin, pos);
  };

  const handlePointerUp = () => {
    if (!isDrawing || !currentEnd) return;
    onAttackDraw(team, zone, origin, currentEnd);
    setIsDrawing(false);
    setCurrentEnd(null);

    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    drawCourt(ctx, canvas);
    drawGhostTrajectories(ctx, canvas, []);
    drawOrigin(ctx, canvas, origin);
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
      drawOrigin(ctx, canvas, origin);
    };

    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [origin, zone]);

  return (
    <div className="spike-draw-overlay">
      <div className="spike-draw-container">
        <div className="spike-draw-header">
          <span>Ataque {playerName ? `- ${playerName}` : ""}</span>
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
