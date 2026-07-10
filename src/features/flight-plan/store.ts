'use client'

/**
 * フライトプランの状態管理（Zustand + localStorage 永続化）。
 * 配列操作のロジックは model.ts の純関数に委譲する。
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

interface FlightPlanStore {
  waypoints: Waypoint[]
  /** テーブルと3Dビューで共有する選択状態 */
  selectedId: string | null
  /** 3D画面クリックで追加するときの高度 [m] */
  clickAltitude: number

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
}

export const useFlightPlanStore = create<FlightPlanStore>()(
  persist(
    (set) => ({
      waypoints: [],
      selectedId: null,
      clickAltitude: DEFAULT_CLICK_ALTITUDE_M,

      addWaypoint: (fields) => {
        const waypoint = createWaypoint(fields)
        set((state) => ({
          waypoints: [...state.waypoints, waypoint],
          selectedId: waypoint.id,
        }))
        return waypoint
      },

      insertAfterSegment: (segmentIndex, fields) => {
        const waypoint = createWaypoint(fields)
        set((state) => ({
          waypoints: insertWaypointAt(state.waypoints, segmentIndex + 1, waypoint),
          selectedId: waypoint.id,
        }))
        return waypoint
      },

      updateWaypoint: (id, patch) =>
        set((state) => ({
          waypoints: updateWaypointById(state.waypoints, id, patch),
        })),

      removeWaypoint: (id) =>
        set((state) => ({
          waypoints: removeWaypointById(state.waypoints, id),
          selectedId: state.selectedId === id ? null : state.selectedId,
        })),

      moveWaypoint: (id, direction) =>
        set((state) => ({
          waypoints: moveWaypointById(state.waypoints, id, direction),
        })),

      clearPlan: () => set({ waypoints: [], selectedId: null }),

      loadSample: () =>
        set({ waypoints: createSampleWaypoints(), selectedId: null }),

      replacePlan: (waypoints) => set({ waypoints, selectedId: null }),

      selectWaypoint: (id) => set({ selectedId: id }),

      setClickAltitude: (altitude) => set({ clickAltitude: altitude }),
    }),
    {
      name: 'flight-simulator-plan',
      partialize: (state) => ({
        waypoints: state.waypoints,
        clickAltitude: state.clickAltitude,
      }),
    }
  )
)
