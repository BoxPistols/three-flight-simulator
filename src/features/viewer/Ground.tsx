'use client'

import { useRef, useState } from 'react'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import { Grid } from '@react-three/drei'
import * as THREE from 'three'
import { GROUND_SIZE_M } from './city'
import { SCENE_PALETTES, VIEWER_COLORS, type SceneMode } from './colors'

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
 * クリック可能な地面。CAD風の測量グリッド（5mセル / 25mセクション）を重ねる。
 * カメラ操作のドラッグと区別し、短いクリックのみをウェイポイント追加として扱う。
 */
export default function Ground({
  mode,
  onGroundClick,
}: {
  mode: SceneMode
  onGroundClick?: (x: number, z: number) => void
}) {
  const palette = SCENE_PALETTES[mode]
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
        receiveShadow
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <planeGeometry args={[GROUND_SIZE_M, GROUND_SIZE_M]} />
        <meshStandardMaterial
          color={palette.ground}
          roughness={0.95}
          metalness={0.05}
        />
      </mesh>

      {/* 測量グリッド */}
      <Grid
        position={[0, 0.02, 0]}
        args={[GROUND_SIZE_M, GROUND_SIZE_M]}
        cellSize={5}
        cellThickness={0.6}
        cellColor={palette.gridCell}
        sectionSize={25}
        sectionThickness={1.1}
        sectionColor={palette.gridSection}
        fadeDistance={220}
        fadeStrength={1}
        followCamera={false}
      />

      {ripples.map((ripple) => (
        <ClickRipple key={ripple.id} position={ripple.position} />
      ))}
    </>
  )
}
