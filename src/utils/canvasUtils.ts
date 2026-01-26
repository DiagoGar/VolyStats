/**
 * Funciones utilitarias para dibujar en canvas (normalized coordinates 0-1)
 */

export function drawCourt(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#f7941d";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 2;
  ctx.strokeRect(0, 0, canvas.width, canvas.height);

  ctx.beginPath();
  ctx.moveTo(0, canvas.height / 2);
  ctx.lineTo(canvas.width, canvas.height / 2);
  ctx.stroke();
}

export function drawOrigin(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  origin: { x: number; y: number }
) {
  ctx.fillStyle = "#1e90ff";
  ctx.beginPath();
  ctx.arc(
    origin.x * canvas.width,
    origin.y * canvas.height,
    8,
    0,
    Math.PI * 2
  );
  ctx.fill();
}

export function drawLine(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  start: { x: number; y: number },
  end: { x: number; y: number }
) {
  ctx.strokeStyle = "#ff2d2d";
  ctx.lineWidth = 3;

  ctx.beginPath();
  ctx.moveTo(start.x * canvas.width, start.y * canvas.height);
  ctx.lineTo(end.x * canvas.width, end.y * canvas.height);
  ctx.stroke();
}

export function drawAverageArrow(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  origin: { x: number; y: number },
  angle: number
) {
  const length = 0.25;

  const end = {
    x: origin.x + Math.cos(angle) * length,
    y: origin.y - Math.sin(angle) * length,
  };

  ctx.strokeStyle = "#000000";
  ctx.lineWidth = 4;

  ctx.beginPath();
  ctx.moveTo(origin.x * canvas.width, origin.y * canvas.height);
  ctx.lineTo(end.x * canvas.width, end.y * canvas.height);
  ctx.stroke();
}

export function isNearOrigin(
  pos: { x: number; y: number },
  origin: { x: number; y: number }
) {
  const dx = pos.x - origin.x;
  const dy = pos.y - origin.y;
  return Math.sqrt(dx * dx + dy * dy) < 0.06;
}

export function getNormalizedPos(e: React.PointerEvent, canvas: HTMLCanvasElement) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (e.clientX - rect.left) / rect.width,
    y: (e.clientY - rect.top) / rect.height,
  };
}

export function drawGhostTrajectories(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  trajectories: Array<{ start: { x: number; y: number }; end: { x: number; y: number } }>
) {
  trajectories.forEach((trajectory) => {
    ctx.strokeStyle = "rgba(255, 45, 45, 0.15)"; // Rojo con 15% opacidad
    ctx.lineWidth = 1.5; // Grosor reducido

    ctx.beginPath();
    ctx.moveTo(trajectory.start.x * canvas.width, trajectory.start.y * canvas.height);
    ctx.lineTo(trajectory.end.x * canvas.width, trajectory.end.y * canvas.height);
    ctx.stroke();
  });
}
