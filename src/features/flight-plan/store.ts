'use client'

/**
 * フライトプランの状態管理（Zustand + localStorage 永続化）。
 * 配列操作のロジックは model.ts の純関数に委譲する。
 * past/future による Undo/Redo 履歴を持つ。
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  createSampleWaypoints,
  createWaypoint,
  insertWaypointAt,
  moveWaypointById,
  removeWaypointById,
  updateWaypointById,
  DEFAULT_CLICK_ALTITUDE_M,
  type Waypoint,
} from './model'
import {
  DEFAULT_LOCATION_ID,
  type RealLocation,
} from '@/features/world/locations'

export type WorldMode = 'virtual' | 'real'

/** 履歴として保持する最大ステップ数 */
const MAX_HISTORY = 50

interface FlightPlanStore {
  waypoints: Waypoint[]
  /** テーブルと3Dビューで共有する選択状態 */
  selectedId: string | null
  /** 3D画面クリックで追加するときの高度 [m] */
  clickAltitude: number
  /** Undo 用の過去スナップショット（新しいものが末尾） */
  past: Waypoint[][]
  /** Redo 用の未来スナップショット（新しいものが末尾） */
  future: Waypoint[][]
  /** 環境: 仮想都市 / 実在都市（PLATEAU + 実地形） */
  worldMode: WorldMode
  /** 実在都市モードで選択中のロケーションID */
  locationId: string
  /** ユーザーが追加したカスタム地点 */
  customLocations: RealLocation[]

  addWaypoint: (fields: Parameters<typeof createWaypoint>[0]) => Waypoint
  /** segmentIndex 番目のセグメントの途中に挿入する */
  insertAfterSegment: (
    segmentIndex: number,
    fields: Parameters<typeof createWaypoint>[0]
  ) => Waypoint
  updateWaypoint: (id: string, patch: Partial<Omit<Waypoint, 'id'>>) => void
  removeWaypoint: (id: string) => void
  moveWaypoint: (id: string, direction: 'up' | 'down') => void
  clearPlan: () => void
  loadSample: () => void
  replacePlan: (waypoints: Waypoint[]) => void
  selectWaypoint: (id: string | null) => void
  setClickAltitude: (altitude: number) => void

  /** ドラッグ開始時に呼び、現在状態を1度だけ履歴に積む */
  beginDrag: () => void
  /** ドラッグ中の位置更新（履歴は積まない） */
  dragWaypoint: (id: string, x: number, z: number) => void

  undo: () => void
  redo: () => void

  setWorldMode: (mode: WorldMode) => void
  setLocationId: (id: string) => void
  addCustomLocation: (location: RealLocation) => void
  removeCustomLocation: (id: string) => void
}

/** 現在の waypoints を past に積み、future をクリアした差分を返す */
const withHistory = (state: FlightPlanStore) => ({
  past: [...state.past, state.waypoints].slice(-MAX_HISTORY),
  future: [] as Waypoint[][],
})

export const useFlightPlanStore = create<FlightPlanStore>()(
  persist(
    (set, get) => ({
      waypoints: [],
      selectedId: null,
      clickAltitude: DEFAULT_CLICK_ALTITUDE_M,
      past: [],
      future: [],
      worldMode: 'virtual',
      locationId: DEFAULT_LOCATION_ID,
      customLocations: [],

      addWaypoint: (fields) => {
        const waypoint = createWaypoint(fields)
        set((state) => ({
          ...withHistory(state),
          waypoints: [...state.waypoints, waypoint],
          selectedId: waypoint.id,
        }))
        return waypoint
      },

      insertAfterSegment: (segmentIndex, fields) => {
        const waypoint = createWaypoint(fields)
        set((state) => ({
          ...withHistory(state),
          waypoints: insertWaypointAt(state.waypoints, segmentIndex + 1, waypoint),
          selectedId: waypoint.id,
        }))
        return waypoint
      },

      updateWaypoint: (id, patch) =>
        set((state) => ({
          ...withHistory(state),
          waypoints: updateWaypointById(state.waypoints, id, patch),
        })),

      removeWaypoint: (id) =>
        set((state) => ({
          ...withHistory(state),
          waypoints: removeWaypointById(state.waypoints, id),
          selectedId: state.selectedId === id ? null : state.selectedId,
        })),

      moveWaypoint: (id, direction) =>
        set((state) => ({
          ...withHistory(state),
          waypoints: moveWaypointById(state.waypoints, id, direction),
        })),

      clearPlan: () =>
        set((state) => ({
          ...withHistory(state),
          waypoints: [],
          selectedId: null,
        })),

      loadSample: () =>
        set((state) => ({
          ...withHistory(state),
          waypoints: createSampleWaypoints(),
          selectedId: null,
        })),

      replacePlan: (waypoints) =>
        set((state) => ({
          ...withHistory(state),
          waypoints,
          selectedId: null,
        })),

      selectWaypoint: (id) => set({ selectedId: id }),

      setClickAltitude: (altitude) => set({ clickAltitude: altitude }),

      beginDrag: () => set((state) => withHistory(state)),

      dragWaypoint: (id, x, z) =>
        set((state) => ({
          waypoints: updateWaypointById(state.waypoints, id, { x, z }),
        })),

      undo: () => {
        const { past, waypoints, future } = get()
        if (past.length === 0) return
        const previous = past[past.length - 1]
        set({
          waypoints: previous,
          past: past.slice(0, -1),
          future: [...future, waypoints].slice(-MAX_HISTORY),
          selectedId: null,
        })
      },

      redo: () => {
        const { past, waypoints, future } = get()
        if (future.length === 0) return
        const next = future[future.length - 1]
        set({
          waypoints: next,
          past: [...past, waypoints].slice(-MAX_HISTORY),
          future: future.slice(0, -1),
          selectedId: null,
        })
      },

      setWorldMode: (mode) => set({ worldMode: mode }),

      setLocationId: (id) => set({ locationId: id }),

      addCustomLocation: (location) =>
        set((state) => ({
          customLocations: [...state.customLocations, location],
          locationId: location.id,
        })),

      removeCustomLocation: (id) =>
        set((state) => ({
          customLocations: state.customLocations.filter((l) => l.id !== id),
          locationId:
            state.locationId === id ? DEFAULT_LOCATION_ID : state.locationId,
        })),
    }),
    {
      name: 'flight-simulator-plan',
      partialize: (state) => ({
        waypoints: state.waypoints,
        clickAltitude: state.clickAltitude,
        worldMode: state.worldMode,
        locationId: state.locationId,
        customLocations: state.customLocations,
      }),
    }
  )
)
