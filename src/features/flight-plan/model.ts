/**
 * フライトプランのドメインモデル。
 *
 * 座標系はシーン座標（メートル単位）:
 * - x: 東西方向 [m]（3D空間の X 軸）
 * - z: 南北方向 [m]（3D空間の Z 軸）
 * - altitude: 地面からの高度 [m]（3D空間の Y 軸）
 * 1 シーン単位 = 1 メートル。
 */

export interface Waypoint {
  id: string
  /** 東西方向の位置 [m] */
  x: number
  /** 南北方向の位置 [m] */
  z: number
  /** 高度 [m] */
  altitude: number
  /** 巡航速度 [km/h] */
  speed: number
}

export interface FlightPlanFile {
  version: 1
  name?: string
  waypoints: Array<Omit<Waypoint, 'id'>>
}

export const SPEED_MIN_KMH = 5
export const SPEED_MAX_KMH = 20
export const ALTITUDE_MIN_M = 5
export const ALTITUDE_MAX_M = 150
export const DEFAULT_SPEED_KMH = 15
export const DEFAULT_CLICK_ALTITUDE_M = 30

export const clampSpeed = (speed: number): number =>
  Math.min(SPEED_MAX_KMH, Math.max(SPEED_MIN_KMH, speed))

export const clampAltitude = (altitude: number): number =>
  Math.min(ALTITUDE_MAX_M, Math.max(ALTITUDE_MIN_M, altitude))

export const createWaypoint = (
  fields: Omit<Waypoint, 'id' | 'speed' | 'altitude'> &
    Partial<Pick<Waypoint, 'speed' | 'altitude'>>
): Waypoint => ({
  id: crypto.randomUUID(),
  x: fields.x,
  z: fields.z,
  altitude: clampAltitude(fields.altitude ?? DEFAULT_CLICK_ALTITUDE_M),
  speed: clampSpeed(fields.speed ?? DEFAULT_SPEED_KMH),
})

/**
 * 建物群（最高25m）の外周を周回するサンプルプラン。
 * 高度30〜38mで全建物の上を安全に通過する。
 */
export const createSampleWaypoints = (): Waypoint[] => {
  const radius = 38
  const numPoints = 16
  // 小数1桁に丸め、-0 は +0 に正規化する（JSONラウンドトリップで差が出ないように）
  const round1 = (v: number): number => {
    const r = Math.round(v * 10) / 10
    return r === 0 ? 0 : r
  }
  const waypoints: Waypoint[] = []
  for (let i = 0; i < numPoints; i++) {
    const angle = (i / numPoints) * 2 * Math.PI
    waypoints.push(
      createWaypoint({
        x: round1(radius * Math.sin(angle)),
        z: round1(radius * Math.cos(angle)),
        altitude: Math.round(34 + 4 * Math.sin(angle * 2)),
        speed: 15 + (i % 3) * 2,
      })
    )
  }
  return waypoints
}

/** index の位置（0始まり）に挿入した新しい配列を返す */
export const insertWaypointAt = (
  waypoints: Waypoint[],
  index: number,
  waypoint: Waypoint
): Waypoint[] => {
  const next = [...waypoints]
  next.splice(Math.max(0, Math.min(index, waypoints.length)), 0, waypoint)
  return next
}

export const updateWaypointById = (
  waypoints: Waypoint[],
  id: string,
  patch: Partial<Omit<Waypoint, 'id'>>
): Waypoint[] =>
  waypoints.map((wp) => {
    if (wp.id !== id) return wp
    const merged = { ...wp, ...patch }
    return {
      ...merged,
      altitude: clampAltitude(merged.altitude),
      speed: clampSpeed(merged.speed),
    }
  })

export const removeWaypointById = (
  waypoints: Waypoint[],
  id: string
): Waypoint[] => waypoints.filter((wp) => wp.id !== id)

/** 指定 id のウェイポイントを前後に1つ移動した新しい配列を返す */
export const moveWaypointById = (
  waypoints: Waypoint[],
  id: string,
  direction: 'up' | 'down'
): Waypoint[] => {
  const index = waypoints.findIndex((wp) => wp.id === id)
  if (index < 0) return waypoints
  const target = direction === 'up' ? index - 1 : index + 1
  if (target < 0 || target >= waypoints.length) return waypoints
  const next = [...waypoints]
  ;[next[index], next[target]] = [next[target], next[index]]
  return next
}

/** エクスポート用のプレーンなJSONを生成する */
export const serializePlan = (
  waypoints: Waypoint[],
  name?: string
): FlightPlanFile => ({
  version: 1,
  ...(name ? { name } : {}),
  waypoints: waypoints.map(({ x, z, altitude, speed }) => ({
    x,
    z,
    altitude,
    speed,
  })),
})

/**
 * インポートされたJSONを検証してウェイポイント配列に変換する。
 * 不正な形式の場合は Error を投げる。
 */
export const parsePlan = (data: unknown): Waypoint[] => {
  if (typeof data !== 'object' || data === null) {
    throw new Error('プランファイルの形式が不正です')
  }
  const file = data as Partial<FlightPlanFile>
  if (file.version !== 1 || !Array.isArray(file.waypoints)) {
    throw new Error('対応していないプランファイルです（version 1 のみ対応）')
  }
  return file.waypoints.map((wp, i) => {
    if (
      typeof wp !== 'object' ||
      wp === null ||
      typeof wp.x !== 'number' ||
      typeof wp.z !== 'number' ||
      typeof wp.altitude !== 'number' ||
      typeof wp.speed !== 'number' ||
      ![wp.x, wp.z, wp.altitude, wp.speed].every(Number.isFinite)
    ) {
      throw new Error(`ウェイポイント ${i + 1} の値が不正です`)
    }
    return createWaypoint({
      x: wp.x,
      z: wp.z,
      altitude: wp.altitude,
      speed: wp.speed,
    })
  })
}
