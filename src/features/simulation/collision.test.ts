import { describe, expect, it } from 'vitest'
import type { Waypoint } from '@/features/flight-plan/model'
import {
  aabbFromBase,
  findCollidingSegments,
  segmentIntersectsAabb,
} from './collision'

const wp = (
  x: number,
  z: number,
  altitude: number,
  speed = 15
): Waypoint => ({ id: `${x},${z},${altitude}`, x, z, altitude, speed })

// 中心(0,0)、幅10×高さ20×奥行き10 の建物
const building = aabbFromBase([0, 0], [10, 20, 10])

describe('segmentIntersectsAabb', () => {
  it('建物を貫通する水平セグメントは交差', () => {
    expect(
      segmentIntersectsAabb([-20, 10, 0], [20, 10, 0], building)
    ).toBe(true)
  })

  it('建物の上を通るセグメントは交差しない', () => {
    expect(
      segmentIntersectsAabb([-20, 25, 0], [20, 25, 0], building)
    ).toBe(false)
  })

  it('建物の横を通るセグメントは交差しない', () => {
    expect(
      segmentIntersectsAabb([-20, 10, 8], [20, 10, 8], building)
    ).toBe(false)
  })

  it('建物の上から屋根より下へ降下するセグメントは交差', () => {
    expect(
      segmentIntersectsAabb([0, 30, 0], [0, 5, 0], building)
    ).toBe(true)
  })

  it('始点が建物内部にある場合は交差', () => {
    expect(segmentIntersectsAabb([0, 10, 0], [50, 10, 0], building)).toBe(true)
  })
})

describe('findCollidingSegments', () => {
  it('交差するセグメント番号のみを返す', () => {
    const waypoints = [
      wp(-20, 0, 25), // seg0: 建物の上を通過 → 安全
      wp(20, 0, 25),
      wp(-20, 0, 10), // seg1: 高度10で戻る → 建物(高さ20)を貫通
      wp(-20, 20, 10), // seg2: 建物から離れた場所 → 安全
    ]
    const colliding = findCollidingSegments(waypoints, [building])
    expect(colliding).toEqual(new Set([1]))
  })

  it('障害物がなければ空集合', () => {
    expect(
      findCollidingSegments([wp(0, 0, 10), wp(10, 0, 10)], [])
    ).toEqual(new Set())
  })
})
