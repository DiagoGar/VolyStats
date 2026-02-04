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

/**
 * Dibuja un abanico angular que representa el rango de direcciones de ataque
 * @param ctx Contexto 2D del canvas
 * @param canvas Elemento canvas
 * @param origin Punto de origen del ataque (coordenadas normalizadas 0-1)
 * @param averageAngle Ángulo promedio en radianes
 * @param deviation Desviación angular en radianes
 * @param length Longitud de las flechas (en coordenadas normalizadas)
 */
export function drawAngularFan(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  origin: { x: number; y: number },
  averageAngle: number,
  deviation: number,
  length: number = 0.25
) {
  const originX = origin.x * canvas.width;
  const originY = origin.y * canvas.height;
  const lengthPx = length * Math.min(canvas.width, canvas.height);

  // Ángulos límite
  const minAngle = averageAngle - deviation;
  const maxAngle = averageAngle + deviation;

  // Dibujar área semitransparente del abanico
  if (deviation > 0) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.05)"; // Negro con 5% opacidad
    ctx.beginPath();
    ctx.moveTo(originX, originY);

    // Arco desde minAngle hasta maxAngle
    const steps = 20;
    for (let i = 0; i <= steps; i++) {
      const angle = minAngle + (maxAngle - minAngle) * (i / steps);
      const endX = originX + Math.cos(angle) * lengthPx;
      const endY = originY - Math.sin(angle) * lengthPx;

      if (i === 0) {
        ctx.lineTo(endX, endY);
      } else {
        ctx.lineTo(endX, endY);
      }
    }

    ctx.closePath();
    ctx.fill();
  }

  // Dibujar flechas límite con grosor delgado
  const drawArrow = (angle: number, color: string) => {
    const endX = originX + Math.cos(angle) * lengthPx;
    const endY = originY - Math.sin(angle) * lengthPx;

    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]); // Línea punteada

    ctx.beginPath();
    ctx.moveTo(originX, originY);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    ctx.setLineDash([]); // Restaurar línea sólida
  };

  // Flechas límite (ángulo promedio ± desviación)
  if (deviation > 0) {
    drawArrow(minAngle, "rgba(0, 0, 0, 0.3)"); // Límite inferior
    drawArrow(maxAngle, "rgba(0, 0, 0, 0.3)"); // Límite superior
  }

  // Flecha central (promedio) - más visible
  ctx.strokeStyle = "#000000";
  ctx.lineWidth = 4;
  ctx.setLineDash([]);

  const avgEndX = originX + Math.cos(averageAngle) * lengthPx;
  const avgEndY = originY - Math.sin(averageAngle) * lengthPx;

  ctx.beginPath();
  ctx.moveTo(originX, originY);
  ctx.lineTo(avgEndX, avgEndY);
  ctx.stroke();
}

export function drawPersistentTrajectories(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  trajectories: Record<number, { start: { x: number; y: number }; end: { x: number; y: number }; complex?: string; evaluation?: string }[]>,
  filterComplex: string | null,
  filterEvaluation: string | null
) {
  // Dibujar todas las trayectorias con filtros
  Object.values(trajectories).forEach(zoneTrajectories => {
    zoneTrajectories.forEach(trajectory => {
      // Aplicar filtros
      if (filterComplex && trajectory.complex !== filterComplex) return;
      if (filterEvaluation && trajectory.evaluation !== filterEvaluation) return;

      // Determinar color basado en evaluación
      let color = "#666"; // Default gris
      if (trajectory.evaluation === "#") color = "#28a745"; // Verde para punto directo
      else if (trajectory.evaluation === "++") color = "#007bff"; // Azul para muy positivo
      else if (trajectory.evaluation === "--") color = "#dc3545"; // Rojo para error directo

      // Dibujar línea
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.7;

      ctx.beginPath();
      ctx.moveTo(trajectory.start.x * canvas.width, trajectory.start.y * canvas.height);
      ctx.lineTo(trajectory.end.x * canvas.width, trajectory.end.y * canvas.height);
      ctx.stroke();

      ctx.globalAlpha = 1;
    });
  });
}
