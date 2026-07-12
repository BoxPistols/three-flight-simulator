'use client'

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { waypointToPosition } from '@/features/simulation/engine'
import type { Waypoint } from '@/features/flight-plan/model'
import { VIEWER_COLORS } from './colors'

interface SegmentGeom {
  midPoint: THREE.Vector3
  arrowPoint: THREE.Vector3
  quaternion: THREE.Quaternion
  length: number
}

function PathSegment({
  segment,
  index,
  colliding,
  isFlying,
  onSegmentClick,
}: {
  segment: SegmentGeom
  index: number
  colliding: boolean
  isFlying: boolean
  onSegmentClick?: (segmentIndex: number, point: [number, number, number]) => void
}) {
  const materialRef = useRef<THREE.MeshStandardMaterial>(null)

  // 警告セグメントは点滅させて注意を引く
  useFrame(({ clock }) => {
    if (colliding && materialRef.current) {
      materialRef.current.emissiveIntensity =
        0.6 + 0.5 * Math.sin(clock.elapsedTime * 5)
    }
  })

  const color = colliding
    ? VIEWER_COLORS.flightPathWarning
    : VIEWER_COLORS.flightPath

  return (
    <group>
      <mesh
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
        <cylinderGeometry args={[0.22, 0.22, segment.length, 10]} />
        <meshStandardMaterial
          ref={materialRef}
          color={color}
          emissive={colliding ? VIEWER_COLORS.flightPathWarning : VIEWER_COLORS.flightPathEmissive}
          emissiveIntensity={colliding ? 0.8 : 0.35}
          opacity={0.75}
          transparent
          roughness={0.4}
          metalness={0.2}
        />
      </mesh>
      {/* 進行方向を示す矢印 */}
      {segment.length > 4 && (
        <mesh position={segment.arrowPoint} quaternion={segment.quaternion}>
          <coneGeometry args={[0.55, 1.4, 12]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={0.5}
            opacity={0.9}
            transparent
          />
        </mesh>
      )}
    </group>
  )
}

/**
 * フライトパス。各セグメントをクリック可能な発光チューブとして描画し、
 * 進行方向の矢印を添える。建物と交差するセグメントは警告色で点滅する。
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
  const segments = useMemo<SegmentGeom[]>(() => {
    const result: SegmentGeom[] = []
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
        arrowPoint: new THREE.Vector3().lerpVectors(start, end, 0.62),
        quaternion,
        length,
      })
    }
    return result
  }, [waypoints])

  if (waypoints.length < 2) return null

  return (
    <>
      {segments.map((segment, index) => (
        <PathSegment
          key={index}
          segment={segment}
          index={index}
          colliding={collidingSegments.has(index)}
          isFlying={isFlying}
          onSegmentClick={onSegmentClick}
        />
      ))}
    </>
  )
}
