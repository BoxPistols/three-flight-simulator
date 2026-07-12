/** 3Dビューアのカラーパレット（UIテーマに連動した昼/夜モード） */

export type SceneMode = 'day' | 'night'

export interface ScenePalette {
  sky: string
  fog: string
  ground: string
  gridCell: string
  gridSection: string
  hemisphereSky: string
  hemisphereGround: string
  sunIntensity: number
  ambientIntensity: number
  buildingEmissiveIntensity: number
}

export const SCENE_PALETTES: Record<SceneMode, ScenePalette> = {
  day: {
    sky: '#a5d8f5',
    fog: '#b9dff2',
    ground: '#8fa284',
    gridCell: '#7c8f74',
    gridSection: '#66785e',
    hemisphereSky: '#bfdcff',
    hemisphereGround: '#8fa284',
    sunIntensity: 1.6,
    ambientIntensity: 0.55,
    buildingEmissiveIntensity: 0,
  },
  night: {
    sky: '#070d1d',
    fog: '#0a1226',
    ground: '#131c2e',
    gridCell: '#1c2942',
    gridSection: '#27395c',
    hemisphereSky: '#1a2c4e',
    hemisphereGround: '#0c1424',
    sunIntensity: 0.25,
    ambientIntensity: 0.12,
    buildingEmissiveIntensity: 1.0,
  },
}

export const VIEWER_COLORS = {
  drone: {
    body: '#1e293b',
    accent: '#38bdf8',
    propeller: '#94a3b8',
    ledFront: '#4ade80',
    ledRear: '#f43f5e',
  },
  waypoint: {
    start: '#10b981',
    end: '#f43f5e',
    middle: '#f59e0b',
    emissive: {
      start: '#065f46',
      end: '#881337',
      middle: '#92400e',
    },
    pole: '#94a3b8',
    selectedRing: '#38bdf8',
  },
  flightPath: '#38bdf8',
  flightPathEmissive: '#0ea5e9',
  flightPathWarning: '#f43f5e',
} as const
