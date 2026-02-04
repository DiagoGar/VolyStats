import { useEffect } from "react";

const STORAGE_KEY_TRAJECTORIES = "voley-stats:trajectories";
const STORAGE_KEY_STATS = "voley-stats:stats";

/**
 * Hook para persitencia en localStorage
 * Guarda y recupera datos automáticamente
 */
export function usePersistentStorage<T>(
  key: string,
  value: T,
  enabled: boolean = true
): T | null {
  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
      console.error(`Error guardando en localStorage (${key}):`, err);
    }
  }, [value, key, enabled]);

  return null; // Hook solo para efectos
}

/**
 * Cargar datos del localStorage
 */
export function loadFromStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === "undefined") return defaultValue;

  try {
    const item = localStorage.getItem(key);
    if (item) {
      return JSON.parse(item) as T;
    }
  } catch (err) {
    console.error(`Error cargando de localStorage (${key}):`, err);
  }

  return defaultValue;
}

/**
 * Limpiar datos específicos del localStorage
 */
export function clearStorage(key: string): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(key);
  } catch (err) {
    console.error(`Error limpiando localStorage (${key}):`, err);
  }
}

/**
 * Exportar datos como JSON
 */
export function exportData<T>(data: T, filename: string): void {
  try {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error("Error exportando datos:", err);
  }
}

/**
 * Importar datos desde archivo JSON
 */
export async function importData<T>(file: File): Promise<T | null> {
  try {
    const text = await file.text();
    return JSON.parse(text) as T;
  } catch (err) {
    console.error("Error importando datos:", err);
    return null;
  }
}

export const storageKeys = {
  trajectories: STORAGE_KEY_TRAJECTORIES,
  stats: STORAGE_KEY_STATS,
};
