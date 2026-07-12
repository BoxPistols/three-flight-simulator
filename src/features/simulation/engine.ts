/**
 * フライトシミュレーションエンジン（純関数）。
 *
 * UIやThree.jsに依存せず、「経過時間 t 秒におけるドローンの状態」を
 * 実単位（メートル・km/h・秒）で計算する。ビューアは毎フレーム
 * flightStateAt() の結果を描画するだけでよい。
 */

import type { Waypoint } from '@/features/flight-plan/model'

export type Vec3 = [number, number, number]

export interface FlightState {
  /** シーン座標 [x, y, z]（= [東西m, 高度m, 南北m]） */
  position: Vec3
  /** 進行方向のヨー角 [rad]（Three.js の rotation.y に対応） */
  yaw: number
  /** 現在飛行中のセグメント番号（0始まり） */
  segmentIndex: number
  /** セグメント内の進捗 0〜1 */
  segmentProgress: number
  /** プラン全体の進捗 0〜1（距離ベース） */
  overallProgress: number
  /** 現在の速度 [km/h] */
  currentSpeedKmh: number
  /** 次のウェイポイントまでの残距離 [m] */
  distanceToNextM: number
  /** ここまでの飛行距離 [m] */
  traveledDistanceM: number
  /** シミュレーション上の経過時間 [s]（終了後は総所要時間にクランプ） */
  elapsedSec: number
  /** 最終ウェイポイントに到達したか */
  finished: boolean
}

export interface PlanTotals {
  waypointCount: number
  /** 総距離 [m] */
  totalDistanceM: number
  /** 予想飛行時間 [s] */
  totalDurationSec: number
  minAltitudeM: number
  maxAltitudeM: number
}

export const kmhToMs = (kmh: number): number => kmh / 3.6

export const waypointToPosition = (wp: Waypoint): Vec3 => [
  wp.x,
  wp.altitude,
  wp.z,
]

const distanceBetween = (a: Vec3, b: Vec3): number =>
  Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2])

interface Segment {
  from: Vec3
  to: Vec3
  lengthM: number
  /** このセグメントの巡航速度 [km/h]（始点ウェイポイントの速度） */
  speedKmh: number
  durationSec: number
}

export const buildSegments = (waypoints: Waypoint[]): Segment[] => {
  const segments: Segment[] = []
  for (let i = 0; i < waypoints.length - 1; i++) {
    const from = waypointToPosition(waypoints[i])
    const to = waypointToPosition(waypoints[i + 1])
    const lengthM = distanceBetween(from, to)
    const speedKmh = waypoints[i].speed
    const speedMs = kmhToMs(speedKmh)
    segments.push({
      from,
      to,
      lengthM,
      speedKmh,
      durationSec: speedMs > 0 ? lengthM / speedMs : 0,
    })
  }
  return segments
}

export const planTotals = (waypoints: Waypoint[]): PlanTotals => {
  const segments = buildSegments(waypoints)
  const altitudes = waypoints.map((wp) => wp.altitude)
  return {
    waypointCount: waypoints.length,
    totalDistanceM: segments.reduce((sum, s) => sum + s.lengthM, 0),
    totalDurationSec: segments.reduce((sum, s) => sum + s.durationSec, 0),
    minAltitudeM: altitudes.length ? Math.min(...altitudes) : 0,
    maxAltitudeM: altitudes.length ? Math.max(...altitudes) : 0,
  }
}

const lerpVec3 = (a: Vec3, b: Vec3, t: number): Vec3 => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
]

const yawOf = (from: Vec3, to: Vec3, fallback: number): number => {
  const dx = to[0] - from[0]
  const dz = to[2] - from[2]
  if (dx === 0 && dz === 0) return fallback
  return Math.atan2(dx, dz)
}

/**
 * 経過時間 elapsedSec におけるドローンの状態を返す。
 * ウェイポイントが2点未満の場合は null。
 */
export const flightStateAt = (
  waypoints: Waypoint[],
  elapsedSec: number
): FlightState | null => {
  if (waypoints.length < 2) return null

  const segments = buildSegments(waypoints)
  const totalDistanceM = segments.reduce((sum, s) => sum + s.lengthM, 0)

  let remaining = Math.max(0, elapsedSec)
  let traveled = 0
  let lastYaw = yawOf(segments[0].from, segments[0].to, 0)

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i]
    // 長さ0のセグメント（同一点の連続）は瞬時に通過する
    if (segment.durationSec <= 0 || remaining >= segment.durationSec) {
      remaining -= segment.durationSec
      traveled += segment.lengthM
      lastYaw = yawOf(segment.from, segment.to, lastYaw)
      continue
    }

    const t = remaining / segment.durationSec
    return {
      position: lerpVec3(segment.from, segment.to, t),
      yaw: yawOf(segment.from, segment.to, lastYaw),
      segmentIndex: i,
      segmentProgress: t,
      overallProgress:
        totalDistanceM > 0 ? (traveled + segment.lengthM * t) / totalDistanceM : 0,
      currentSpeedKmh: segment.speedKmh,
      distanceToNextM: segment.lengthM * (1 - t),
      traveledDistanceM: traveled + segment.lengthM * t,
      elapsedSec: Math.max(0, elapsedSec),
      finished: false,
    }
  }

  // 全セグメントを消化 → 最終地点に到達
  const last = segments[segments.length - 1]
  return {
    position: last.to,
    yaw: yawOf(last.from, last.to, lastYaw),
    segmentIndex: segments.length - 1,
    segmentProgress: 1,
    overallProgress: 1,
    currentSpeedKmh: last.speedKmh,
    distanceToNextM: 0,
    traveledDistanceM: totalDistanceM,
    elapsedSec: segments.reduce((sum, s) => sum + s.durationSec, 0),
    finished: true,
  }
}
