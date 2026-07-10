'use client'

import { useRef, useState } from 'react'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import { GROUND_SIZE_M } from './city'
import { VIEWER_COLORS } from './colors'

function ClickRipple({ position }: { position: [number, number, number] }) {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame((_state, delta) => {
    if (!meshRef.current) return
    meshRef.current.scale.x += delta * 2
    meshRef.current.scale.z += delta * 2
    const material = meshRef.current.material as THREE.MeshBasicMaterial
    material.opacity -= delta * 2
    if (material.opacity <= 0) meshRef.current.visible = false
  })

  return (
    <mesh ref={meshRef} position={position} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[1.0, 1.6, 32]} />
      <meshBasicMaterial
        color={VIEWER_COLORS.waypoint.start}
        transparent
        opacity={0.8}
      />
    </mesh>
  )
}

/**
 * クリック可能な地面。
 * カメラ操作のドラッグと区別し、短いクリックのみをウェイポイント追加として扱う。
 */
export default function Ground({
  onGroundClick,
}: {
  onGroundClick?: (x: number, z: number) => void
}) {
  const [ripples, setRipples] = useState<
    Array<{ id: number; position: [number, number, number] }>
  >([])
  const clickState = useRef({
    isDragging: false,
    downPoint: null as THREE.Vector3 | null,
    downTime: 0,
  })

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    clickState.current.isDragging = false
    clickState.current.downPoint = e.point.clone()
    clickState.current.downTime = Date.now()
  }

  const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
    if (
      clickState.current.downPoint &&
      e.point.distanceTo(clickState.current.downPoint) > 2
    ) {
      clickState.current.isDragging = true
    }
  }

  const handlePointerUp = (e: ThreeEvent<PointerEvent>) => {
    const clickDuration = Date.now() - clickState.current.downTime
    if (!clickState.current.isDragging && clickDuration < 500) {
      const point = e.point
      const ripple = {
        id: Date.now(),
        position: [point.x, 0.1, point.z] as [number, number, number],
      }
      setRipples((current) => [...current, ripple])
      setTimeout(() => {
        setRipples((current) => current.filter((r) => r.id !== ripple.id))
      }, 1000)
      onGroundClick?.(point.x, point.z)
    }
    clickState.current.isDragging = false
    clickState.current.downPoint = null
  }

  return (
    <>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <planeGeometry args={[GROUND_SIZE_M, GROUND_SIZE_M]} />
        <meshStandardMaterial
          color={VIEWER_COLORS.environment.ground}
          roughness={0.9}
          metalness={0.1}
        />
      </mesh>
      {ripples.map((ripple) => (
        <ClickRipple key={ripple.id} position={ripple.position} />
      ))}
    </>
  )
}
