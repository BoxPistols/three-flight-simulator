'use client'

import { useEffect, useRef, type RefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import {
  flightStateAt,
  waypointToPosition,
  type FlightState,
} from '@/features/simulation/engine'
import type { Waypoint } from '@/features/flight-plan/model'
import Drone from './Drone'

/** UIへの状態通知の間隔 [s]（毎フレーム再レンダーさせないための間引き） */
const REPORT_INTERVAL_SEC = 0.1

/**
 * シミュレーションエンジン駆動のドローン。
 * 経過時間を積算し、flightStateAt() が返す実単位の状態を毎フレーム描画する。
 */
export default function AnimatedDrone({
  waypoints,
  isFlying,
  droneRef,
  onFlightUpdate,
  onFlightComplete,
}: {
  waypoints: Waypoint[]
  isFlying: boolean
  droneRef: RefObject<THREE.Group | null>
  onFlightUpdate?: (state: FlightState) => void
  onFlightComplete?: () => void
}) {
  const elapsedRef = useRef(0)
  const lastReportRef = useRef(0)
  const finishedRef = useRef(false)

  // 飛行の開始・停止でシミュレーション時刻をリセット
  useEffect(() => {
    elapsedRef.current = 0
    lastReportRef.current = 0
    finishedRef.current = false
  }, [isFlying])

  useFrame((_state, delta) => {
    const drone = droneRef.current
    if (!drone) return

    if (!isFlying || waypoints.length < 2) {
      // 待機中は開始地点に配置
      if (waypoints.length > 0) {
        drone.position.set(...waypointToPosition(waypoints[0]))
        if (waypoints.length > 1) {
          const next = waypointToPosition(waypoints[1])
          const from = waypointToPosition(waypoints[0])
          const dx = next[0] - from[0]
          const dz = next[2] - from[2]
          if (dx !== 0 || dz !== 0) drone.rotation.y = Math.atan2(dx, dz)
        }
      }
      return
    }

    if (finishedRef.current) return

    elapsedRef.current += delta
    const state = flightStateAt(waypoints, elapsedRef.current)
    if (!state) return

    drone.position.set(...state.position)
    drone.rotation.y = state.yaw

    const shouldReport =
      elapsedRef.current - lastReportRef.current >= REPORT_INTERVAL_SEC ||
      state.finished
    if (shouldReport) {
      lastReportRef.current = elapsedRef.current
      onFlightUpdate?.(state)
    }

    if (state.finished) {
      finishedRef.current = true
      onFlightComplete?.()
    }
  })

  return <Drone ref={droneRef} spinning={isFlying} />
}
