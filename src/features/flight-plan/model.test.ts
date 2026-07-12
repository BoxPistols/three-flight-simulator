import { describe, expect, it } from 'vitest'
import {
  clampAltitude,
  clampSpeed,
  createSampleWaypoints,
  createWaypoint,
  insertWaypointAt,
  moveWaypointById,
  parsePlan,
  removeWaypointById,
  serializePlan,
  updateWaypointById,
  SPEED_MAX_KMH,
  SPEED_MIN_KMH,
} from './model'

describe('createWaypoint', () => {
  it('速度と高度を範囲内にクランプする', () => {
    const wp = createWaypoint({ x: 0, z: 0, altitude: 1000, speed: 100 })
    expect(wp.altitude).toBe(500)
    expect(wp.speed).toBe(SPEED_MAX_KMH)
    expect(clampSpeed(0)).toBe(SPEED_MIN_KMH)
    expect(clampAltitude(-5)).toBe(5)
  })
})

describe('プラン操作', () => {
  const plan = [
    createWaypoint({ x: 0, z: 0 }),
    createWaypoint({ x: 10, z: 0 }),
    createWaypoint({ x: 20, z: 0 }),
  ]

  it('insertWaypointAt は指定位置に挿入する', () => {
    const inserted = createWaypoint({ x: 5, z: 5 })
    const next = insertWaypointAt(plan, 1, inserted)
    expect(next.map((wp) => wp.x)).toEqual([0, 5, 10, 20])
    expect(plan).toHaveLength(3) // 元の配列は不変
  })

  it('updateWaypointById はクランプ付きで更新する', () => {
    const next = updateWaypointById(plan, plan[1].id, { speed: 99, x: 42 })
    expect(next[1].speed).toBe(SPEED_MAX_KMH)
    expect(next[1].x).toBe(42)
    expect(next[0]).toBe(plan[0]) // 他の要素は同一参照
  })

  it('removeWaypointById は該当要素のみ除去する', () => {
    const next = removeWaypointById(plan, plan[0].id)
    expect(next.map((wp) => wp.x)).toEqual([10, 20])
  })

  it('moveWaypointById は前後入れ替え、端では何もしない', () => {
    expect(moveWaypointById(plan, plan[1].id, 'up').map((wp) => wp.x)).toEqual([
      10, 0, 20,
    ])
    expect(moveWaypointById(plan, plan[0].id, 'up')).toBe(plan)
    expect(moveWaypointById(plan, plan[2].id, 'down')).toBe(plan)
  })
})

describe('serializePlan / parsePlan', () => {
  it('エクスポート → インポートで座標が保存される', () => {
    const original = createSampleWaypoints()
    const restored = parsePlan(JSON.parse(JSON.stringify(serializePlan(original))))
    expect(restored.map(({ x, z, altitude, speed }) => ({ x, z, altitude, speed }))).toEqual(
      original.map(({ x, z, altitude, speed }) => ({ x, z, altitude, speed }))
    )
  })

  it('不正なデータを拒否する', () => {
    expect(() => parsePlan(null)).toThrow()
    expect(() => parsePlan({ version: 2, waypoints: [] })).toThrow()
    expect(() =>
      parsePlan({ version: 1, waypoints: [{ x: 'a', z: 0, altitude: 1, speed: 1 }] })
    ).toThrow()
    expect(() =>
      parsePlan({ version: 1, waypoints: [{ x: NaN, z: 0, altitude: 1, speed: 1 }] })
    ).toThrow()
  })
})
