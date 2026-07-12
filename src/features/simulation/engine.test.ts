import { describe, expect, it } from 'vitest'
import type { Waypoint } from '@/features/flight-plan/model'
import { flightStateAt, kmhToMs, planTotals } from './engine'

const wp = (
  x: number,
  z: number,
  altitude: number,
  speed: number
): Waypoint => ({ id: `${x},${z},${altitude}`, x, z, altitude, speed })

describe('planTotals', () => {
  it('空のプランではゼロを返す', () => {
    const totals = planTotals([])
    expect(totals.totalDistanceM).toBe(0)
    expect(totals.totalDurationSec).toBe(0)
    expect(totals.waypointCount).toBe(0)
  })

  it('総距離・所要時間・高度範囲を実単位で計算する', () => {
    // 100m を 18km/h (=5m/s) で → 20秒、続けて 50m を 10km/h で → 18秒
    const waypoints = [wp(0, 0, 30, 18), wp(100, 0, 30, 10), wp(100, 50, 40, 15)]
    const totals = planTotals(waypoints)
    expect(totals.totalDistanceM).toBeCloseTo(100 + Math.hypot(50, 10))
    expect(totals.totalDurationSec).toBeCloseTo(
      100 / kmhToMs(18) + Math.hypot(50, 10) / kmhToMs(10)
    )
    expect(totals.minAltitudeM).toBe(30)
    expect(totals.maxAltitudeM).toBe(40)
  })
})

describe('flightStateAt', () => {
  const straight = [wp(0, 0, 30, 18), wp(100, 0, 30, 18)] // 100m @ 5m/s = 20s

  it('2点未満では null を返す', () => {
    expect(flightStateAt([], 0)).toBeNull()
    expect(flightStateAt([wp(0, 0, 30, 15)], 0)).toBeNull()
  })

  it('t=0 で始点にいる', () => {
    const state = flightStateAt(straight, 0)!
    expect(state.position).toEqual([0, 30, 0])
    expect(state.overallProgress).toBe(0)
    expect(state.finished).toBe(false)
  })

  it('実速度どおりに進む（18km/h で 10秒 → 50m 地点）', () => {
    const state = flightStateAt(straight, 10)!
    expect(state.position[0]).toBeCloseTo(50)
    expect(state.overallProgress).toBeCloseTo(0.5)
    expect(state.distanceToNextM).toBeCloseTo(50)
    expect(state.currentSpeedKmh).toBe(18)
  })

  it('所要時間を超えたら終点で finished になる', () => {
    const state = flightStateAt(straight, 25)!
    expect(state.finished).toBe(true)
    expect(state.position).toEqual([100, 30, 0])
    expect(state.overallProgress).toBe(1)
  })

  it('セグメントごとに始点ウェイポイントの速度を使う', () => {
    // seg0: 100m @ 5m/s = 20s, seg1: 100m @ 10km/h(2.78m/s) = 36s
    const waypoints = [wp(0, 0, 30, 18), wp(100, 0, 30, 10), wp(200, 0, 30, 15)]
    const inSecond = flightStateAt(waypoints, 20 + 18)! // seg1 の半分
    expect(inSecond.segmentIndex).toBe(1)
    expect(inSecond.position[0]).toBeCloseTo(150)
    expect(inSecond.currentSpeedKmh).toBe(10)
  })

  it('+X 方向への飛行のヨー角は π/2', () => {
    const state = flightStateAt(straight, 5)!
    expect(state.yaw).toBeCloseTo(Math.PI / 2)
  })

  it('同一座標が連続していてもクラッシュせず瞬時に通過する', () => {
    const waypoints = [wp(0, 0, 30, 15), wp(0, 0, 30, 15), wp(100, 0, 30, 18)]
    const state = flightStateAt(waypoints, 1)!
    expect(state.segmentIndex).toBe(1)
    expect(state.finished).toBe(false)
  })
})
