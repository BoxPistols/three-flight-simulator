/**
 * 飛行経路と障害物（軸平行境界ボックス）の交差判定（純関数）。
 * スラブ法による線分-AABB交差テスト。
 */

import type { Waypoint } from '@/features/flight-plan/model'
import { waypointToPosition, type Vec3 } from './engine'

export interface Aabb {
  /** ボックス中心の底面位置 [x, 0基準のy, z]（yは底面の高さ） */
  min: Vec3
  max: Vec3
}

/** 中心位置とサイズ（幅・高さ・奥行き）からAABBを作る。yはボックス底面の高さ。 */
export const aabbFromBase = (
  center: [number, number],
  size: [number, number, number],
  baseY = 0
): Aabb => ({
  min: [center[0] - size[0] / 2, baseY, center[1] - size[2] / 2],
  max: [center[0] + size[0] / 2, baseY + size[1], center[1] + size[2] / 2],
})

/** 線分 from→to が box と交差するか（スラブ法） */
export const segmentIntersectsAabb = (
  from: Vec3,
  to: Vec3,
  box: Aabb
): boolean => {
  let tMin = 0
  let tMax = 1
  for (let axis = 0; axis < 3; axis++) {
    const d = to[axis] - from[axis]
    if (Math.abs(d) < 1e-9) {
      // 線分がこの軸に平行：範囲外なら交差しない
      if (from[axis] < box.min[axis] || from[axis] > box.max[axis]) return false
      continue
    }
    let t1 = (box.min[axis] - from[axis]) / d
    let t2 = (box.max[axis] - from[axis]) / d
    if (t1 > t2) [t1, t2] = [t2, t1]
    tMin = Math.max(tMin, t1)
    tMax = Math.min(tMax, t2)
    if (tMin > tMax) return false
  }
  return true
}

/**
 * 経路の各セグメントについて障害物との交差を調べ、
 * 交差するセグメント番号（0始まり）の集合を返す。
 */
export const findCollidingSegments = (
  waypoints: Waypoint[],
  obstacles: Aabb[]
): Set<number> => {
  const colliding = new Set<number>()
  for (let i = 0; i < waypoints.length - 1; i++) {
    const from = waypointToPosition(waypoints[i])
    const to = waypointToPosition(waypoints[i + 1])
    if (obstacles.some((box) => segmentIntersectsAabb(from, to, box))) {
      colliding.add(i)
    }
  }
  return colliding
}
