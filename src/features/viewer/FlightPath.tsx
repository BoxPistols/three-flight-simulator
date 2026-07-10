'use client'

import { useMemo } from 'react'
import * as THREE from 'three'
import { waypointToPosition } from '@/features/simulation/engine'
import type { Waypoint } from '@/features/flight-plan/model'
import { VIEWER_COLORS } from './colors'

/**
 * フライトパス。各セグメントをクリック可能な管として描画する。
 * 建物と交差するセグメントは警告色で表示する。
 */
export default function FlightPath({
  waypoints,
  collidingSegments,
  isFlying,
  onSegmentClick,
}: {
  waypoints: Waypoint[]
  collidingSegments: Set<number>
  isFlying: boolean
  onSegmentClick?: (segmentIndex: number, point: [number, number, number]) => void
}) {
  const segments = useMemo(() => {
    const result: Array<{
      midPoint: THREE.Vector3
      quaternion: THREE.Quaternion
      length: number
    }> = []
    for (let i = 0; i < waypoints.length - 1; i++) {
      const start = new THREE.Vector3(...waypointToPosition(waypoints[i]))
      const end = new THREE.Vector3(...waypointToPosition(waypoints[i + 1]))
      const direction = new THREE.Vector3().subVectors(end, start)
      const length = direction.length()
      const quaternion = new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        direction.clone().normalize()
      )
      result.push({
        midPoint: new THREE.Vector3().lerpVectors(start, end, 0.5),
        quaternion,
        length,
      })
    }
    return result
  }, [waypoints])

  if (waypoints.length < 2) return null

  return (
    <>
      {segments.map((segment, index) => {
        const colliding = collidingSegments.has(index)
        return (
          <mesh
            key={index}
            position={segment.midPoint}
            quaternion={segment.quaternion}
            onClick={(e) => {
              if (isFlying) return
              e.stopPropagation()
              onSegmentClick?.(index, [e.point.x, e.point.y, e.point.z])
            }}
            onPointerOver={() => {
              if (!isFlying) document.body.style.cursor = 'pointer'
            }}
            onPointerOut={() => {
              document.body.style.cursor = 'default'
            }}
          >
            <cylinderGeometry args={[0.25, 0.25, segment.length, 8]} />
            <meshStandardMaterial
              color={
                colliding
                  ? VIEWER_COLORS.flightPathWarning
                  : VIEWER_COLORS.flightPath
              }
              emissive={colliding ? VIEWER_COLORS.flightPathWarning : '#000000'}
              emissiveIntensity={colliding ? 0.5 : 0}
              opacity={0.6}
              transparent
              roughness={0.5}
              metalness={0.3}
            />
          </mesh>
        )
      })}
    </>
  )
}
