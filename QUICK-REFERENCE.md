/**
 * QUICK-REFERENCE.MD
 * 
 * Hoja de trucos del modelo de voleibol.
 * Lee esto antes de escribir cualquier código que toque el modelo.
 */

# 📋 Referencia Rápida del Modelo de Voleibol

## 🎯 Las 3 Cosas Más Importantes

### 1️⃣ ROL ≠ POSICIÓN ≠ ZONA

```
Jugador #10 es PUNTA (rol)
Está en POSICIÓN 4 (derecha delantera)
Ejecutó acción DESDE ZONA 6 (trasera, retrocedió)
```

| Atributo | Ejemplo | Cambio | Almacenado |
|----------|---------|--------|-----------|
| **Rol** | Punta | Solo sustitución | `Player.primaryRole` |
| **Posición** | 4 | Cada saque ganado | `Rotation.positions[4]` |
| **Zona** | 6 | Cada acción | `Action.zone` |

### 2️⃣ LAS ACCIONES PERTENECEN A JUGADORES

```typescript
// ❌ MALO: La zona atacó
{ zone: 4, actionType: 'ataque', evaluation: '++' }

// ✅ BUENO: El jugador atacó desde la zona
{ 
  playerId: 'uuid-10',
  playerRole: 'punta',
  zone: 4,
  actionType: 'ataque',
  evaluation: '++'
}
```

### 3️⃣ LA ROTACIÓN ES ESTADO DEL EQUIPO

```typescript
// ❌ MALO: El jugador tiene posición
Player { id: 'uuid-10', position: 4 }

// ✅ BUENO: La rotación asigna posición
Rotation { positions: { 4: Player } }
```

---

## 📚 Entidades Principales

### Player (Jugador)
```typescript
interface Player {
  id: string;           // UUID único
  number: number;       // Dorsal (1-14)
  name: string;
  primaryRole: PlayerRole; // 'armador', 'punta', etc
}
```

**Lo que es**: Identidad del jugador  
**Lo que NO es**: Posición actual (eso es la Rotation)

---

### PlayerRole (Rol)
```typescript
type PlayerRole = 
  | 'armador'     // Setter
  | 'opuesto'     // Opposite
  | 'punta'       // Wing
  | 'central'     // Middle
  | 'libero'      // Libero
  | 'zaguero';    // Back-row versatile
```

**Lo que es**: Función táctica del jugador  
**Lo que NO es**: Posición en cancha (rota), Zona de acción (varía)

---

### Rotation (Rotación)
```typescript
interface Rotation {
  positions: Record<CourtPosition, Player>;
  // Pos 1 → Jugador X
  // Pos 2 → Jugador Y
  // ... Pos 6 → Jugador Z
  
  setter: Player;         // Quién levanta
  rotationSystem: '5-1' | '4-2' | '6-2' | '6-3';
  currentRotationNumber: 0-5;
}
```

**Lo que es**: Foto del estado actual del equipo  
**Lo que NO es**: Propiedad del jugador, decisión de la acción

**Cambia cuando**: El equipo gana su saque → Se crea NUEVA Rotation

---

### Action (Acción)
```typescript
interface Action {
  id: string;
  playerId: string;           // ⭐ OBLIGATORIO
  playerRole: PlayerRole;     // Qué rol tenía al hacer esto
  actionType: ActionType;     // 'ataque', 'saque', etc
  zone: ActionZone;           // 1-6 (dónde ejecutó)
  position?: CourtPosition;   // 1-6 (dónde estaba, opcional)
  evaluation?: ActionEvaluation; // '#', '++', '+', '/', '-', '--'
  rotationId: string;         // En qué rotación ocurrió
  timestamp: number;
}
```

**Lo que es**: Algo que hace un jugador con la pelota  
**Lo que NO es**: Propiedad de una zona

---

### Match (Partido)
```typescript
interface Match {
  homeTeam: Team;
  awayTeam: Team;
  actions: Action[];              // Línea de tiempo
  currentHomeRotation: Rotation;
  currentAwayRotation: Rotation;
  homeScore: number;
  awayScore: number;
}
```

**Lo que es**: Contenedor de todo  
**Lo que NO es**: Decisiones tácticas

---

## 🔄 Cómo Fluye Todo

### Inicio del Partido

```
1. Match se crea
2. Cada equipo tiene una Rotation inicial (#1)
3. Posiciones 1-6 se asignan con jugadores
4. Se identifica el setter
```

### Cuando Ocurre una Acción

```
1. Un jugador ejecuta algo (ataque, recepción, etc)
2. Se crea una Action con:
   - playerId (quién)
   - actionType (qué)
   - zone (desde dónde)
   - playerRole (su rol en ese momento)
3. Se registra en Match.actions
```

### Cuando Cambia la Rotación

```
1. El equipo gana su saque (punto de saque)
2. Se crea UNA NUEVA Rotation
3. Las posiciones rotan: 1→2→3→4→5→6→1
4. Se asigna a Match.currentTeamRotation
5. El histórico queda en Match.teamRotations[]
```

---

## ✅ Validaciones Clave

```typescript
// Antes de crear una Rotation:
isValidRotation(rotation, team)
// Verifica: 6 posiciones, jugadores únicos, en el equipo

// Antes de crear una Action:
isValidAction(action, match)
// Verifica: jugador existe, zona válida, tiene playerId

// Integridad general:
validateMatchIntegrity(match)
// Verifica todo el partido
```

---

## 🚫 Errores Comunes

### Error 1: Confundir Rol con Posición

```typescript
// ❌ MALO
player.position = 4;  // Los jugadores no tienen posición

// ✅ CORRECTO
rotation.positions[4] = player;  // La rotación la asigna
```

### Error 2: Acciones sin Jugador

```typescript
// ❌ MALO
{ zone: 4, actionType: 'ataque' }

// ✅ CORRECTO
{ playerId: 'uuid-10', zone: 4, actionType: 'ataque' }
```

### Error 3: Modificar Rotación in-place

```typescript
// ❌ MALO
rotation.positions[4] = newPlayer;  // Pierde historial

// ✅ CORRECTO
const newRotation = { ...rotation, positions: {...rotation.positions, 4: newPlayer }};
match.currentRotation = newRotation;
match.rotations.push(newRotation);
```

### Error 4: Asumir Que la Rotación No Cambia

```typescript
// ❌ MALO
const pos = player.position;

// ✅ CORRECTO
const rot = match.currentRotation;
const pos = Object.entries(rot.positions).find(([_, p]) => p.id === player.id)?.[0];
```

---

## 📊 Ejemplos de Análisis

### "¿Cuántos ataques hizo el jugador #10?"

```typescript
const attacks = match.actions.filter(
  (a) => a.playerId === '10-uuid' && a.actionType === 'ataque'
);
console.log(attacks.length);
```

### "¿Desde qué zonas atacó con más éxito?"

```typescript
const attacks = match.actions.filter((a) => a.actionType === 'ataque');
const byZone = {};
for (const a of attacks) {
  byZone[a.zone] ??= { total: 0, success: 0 };
  byZone[a.zone].total++;
  if (a.evaluation === '#' || a.evaluation === '++') {
    byZone[a.zone].success++;
  }
}
```

### "¿Quién estaba en posición 3 cuando hizo ese ataque?"

```typescript
const action = match.actions[10];
const rotation = match.rotations.find((r) => r.id === action.rotationId);
const player = rotation.positions[3];
console.log(player.name);
```

---

## 🎓 Regla de Oro

> **Si tienes que "asumir" algo, es que el modelo no lo representa.**

Ejemplos de suposiciones (❌ NO HACER):

- "Los armadores siempre están en posición 1" → Falso (rotan)
- "Un jugador no puede atacar desde su zona ideal" → Falso (puede)
- "Las acciones cambian la rotación" → Falso (solo los saques ganados)
- "Un rol es una posición" → Falso (ROL ≠ POSICIÓN)

---

## 📖 Dónde Leer Más

- `src/types/volley-model.ts` - Definiciones completas
- `DESIGN_PRINCIPLES.md` - Principios detallados
- `src/utils/model-validators.ts` - Validadores
