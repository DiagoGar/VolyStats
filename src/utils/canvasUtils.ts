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
  end: { x: number; y: number },
  options?: { color?: string; lineWidth?: number; dash?: number[] }
) {
  const color = options?.color ?? "#ff2d2d";
  const lineWidth = options?.lineWidth ?? 3;
  const dash = options?.dash ?? [];

  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.setLineDash(dash);

  ctx.beginPath();
  ctx.moveTo(start.x * canvas.width, start.y * canvas.height);
  ctx.lineTo(end.x * canvas.width, end.y * canvas.height);
  ctx.stroke();
  ctx.setLineDash([]);
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

/**
 * Determina el color de una trayectoria basado en evaluation + complex
 * @param evaluation Evaluación de la acción (#, ++, +, /, -, --)
 * @param complex Complejo de juego (K1, K2, K3, K4)
 * @returns Color en formato hex
 */
export function getTrajectoryColor(evaluation?: string, complex?: string): string {
  // Primero evaluar por evaluación (tiene mayor prioridad visual)
  if (evaluation === "#") return "#00AA00"; // Verde brillante - punto directo
  if (evaluation === "++") return "#0066FF"; // Azul - muy positivo
  if (evaluation === "+") return "#66CCFF"; // Cian - positivo
  if (evaluation === "/") return "#FFAA00"; // Naranja - neutro
  if (evaluation === "-") return "#FF6600"; // Naranja oscuro - negativo
  if (evaluation === "--") return "#CC0000"; // Rojo - error directo

  // Si no hay evaluación, colorear por complejo
  if (complex === "K1") return "#0066FF"; // Azul - Side-out
  if (complex === "K2") return "#FF6600"; // Naranja - Break-point
  if (complex === "K3") return "#00AA00"; // Verde - Contraataque
  if (complex === "K4") return "#FFAA00"; // Amarillo - Freeball

  return "#999999"; // Gris por defecto
}

/**
 * Dibuja una punta de flecha al final de una línea
 * @param ctx Contexto 2D del canvas
 * @param fromX Coordenada X de inicio
 * @param fromY Coordenada Y de inicio
 * @param toX Coordenada X de fin
 * @param toY Coordenada Y de fin
 * @param color Color de la punta
 * @param size Tamaño de la punta en píxeles
 */
export function drawArrowHead(
  ctx: CanvasRenderingContext2D,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  color: string,
  size: number = 12
) {
  const angle = Math.atan2(toY - fromY, toX - fromX);

  // Dibujar triángulo en la punta
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(toX, toY);
  ctx.lineTo(toX - size * Math.cos(angle - Math.PI / 6), toY - size * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(toX - size * Math.cos(angle + Math.PI / 6), toY - size * Math.sin(angle + Math.PI / 6));
  ctx.closePath();
  ctx.fill();
}

export function drawPersistentTrajectories(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  trajectories: Record<
    number,
    {
      start: { x: number; y: number };
      end: { x: number; y: number };
      complex?: string;
      evaluation?: string;
      actionType?: "attack" | "defense";
    }[]
  >,
  filterComplex: string | null,
  filterEvaluation: string | null,
  overrideColor?: string,
  mirrorY: boolean = false,
  opacity: number = 0.8,
  lineWidth: number = 2.5
) {
  // Dibujar todas las trayectorias con filtros
  Object.values(trajectories).forEach(zoneTrajectories => {
    zoneTrajectories.forEach(trajectory => {
      // Aplicar filtros
      if (filterComplex && trajectory.complex !== filterComplex) return;
      if (filterEvaluation && trajectory.evaluation !== filterEvaluation) return;

      // Determinar color
      let color = overrideColor;
      if (!color) {
        color =
          trajectory.actionType === "defense"
            ? "#22c1ff"
            : getTrajectoryColor(trajectory.evaluation, trajectory.complex);
      }

      const start = mirrorY ? { x: trajectory.start.x, y: 1 - trajectory.start.y } : trajectory.start;
      const end = mirrorY ? { x: trajectory.end.x, y: 1 - trajectory.end.y } : trajectory.end;

      const startX = start.x * canvas.width;
      const startY = start.y * canvas.height;
      const endX = end.x * canvas.width;
      const endY = end.y * canvas.height;

      // Dibujar línea
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.globalAlpha = opacity;
      ctx.setLineDash(trajectory.actionType === "defense" ? [6, 4] : []);

      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();

      // Dibujar punta de flecha
      drawArrowHead(ctx, startX, startY, endX, endY, color, 10);

      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
    });
  });
}
