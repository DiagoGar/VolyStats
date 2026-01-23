import { useRef, useEffect } from "react";
import type { Zone } from "@/types/stats";

interface Props {
  zone: Zone;
  onDrawEnd?: (
    start: { x: number; y: number },
    end: { x: number; y: number }
  ) => void;
  averageAngle?: number | null;
}

export function SpikeCanvas({ zone, onDrawEnd, averageAngle }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);
  const startPoint = useRef<{ x: number; y: number } | null>(null);

  const width = 360;
  const height = 240;

  // 🔹 Posición sugerida del origen según zona
  const getOriginByZone = () => {
    switch (zone) {
      case 4:
        return { x: width * 0.25, y: height * 0.9 };
      case 3:
        return { x: width * 0.5, y: height * 0.9 };
      case 2:
        return { x: width * 0.75, y: height * 0.9 };
      case 6:
        return { x: width * 0.5, y: height * 0.75 };
      case 1:
        return { x: width * 0.75, y: height * 0.75 };
      default:
        return { x: width * 0.5, y: height * 0.9 };
    }
  };

  const drawCourt = (ctx: CanvasRenderingContext2D) => {
    // Fondo
    ctx.fillStyle = "#f7941d";
    ctx.fillRect(0, 0, width, height);

    // Líneas
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.strokeRect(8, 8, width - 16, height - 16);

    // Línea de ataque (3m aprox)
    ctx.beginPath();
    ctx.moveTo(8, height * 0.6);
    ctx.lineTo(width - 8, height * 0.6);
    ctx.stroke();

    // Red
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, height * 0.95);
    ctx.lineTo(width, height * 0.95);
    ctx.stroke();

    // Origen
    const origin = getOriginByZone();
    ctx.fillStyle = "#004b87";
    ctx.beginPath();
    ctx.arc(origin.x, origin.y, 6, 0, Math.PI * 2);
    ctx.fill();
  };

  const drawAverageArrow = (
  ctx: CanvasRenderingContext2D,
  origin: { x: number; y: number },
  angle: number
) => {
  const length = 80;

  const end = {
    x: origin.x + Math.cos(angle) * length,
    y: origin.y - Math.sin(angle) * length,
  };

  ctx.strokeStyle = "#00ffcc";
  ctx.lineWidth = 4;

  ctx.beginPath();
  ctx.moveTo(origin.x, origin.y);
  ctx.lineTo(end.x, end.y);
  ctx.stroke();
};

console.log("SpikeCanvas angle:", averageAngle);
  useEffect(() => {
  const canvas = canvasRef.current;
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  drawCourt(ctx);

  if (averageAngle != null) {
    const origin = getOriginByZone();
    drawAverageArrow(ctx, origin, averageAngle);
  }
}, [zone, averageAngle]);

  const getPosition = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;

    drawing.current = true;
    const pos = getPosition(e);
    startPoint.current = pos;

    drawCourt(ctx);
    ctx.strokeStyle = "#ff2d2d";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;

    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;

    const pos = getPosition(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;

    drawing.current = false;
    const end = getPosition(e);

    if (startPoint.current && onDrawEnd) {
      onDrawEnd(startPoint.current, end);
    }
  };

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{
        touchAction: "none",
        borderRadius: 8,
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    />
  );
}
