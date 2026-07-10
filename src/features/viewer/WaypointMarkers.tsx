'use client'

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { waypointToPosition } from '@/features/simulation/engine'
import type { Waypoint } from '@/features/flight-plan/model'
import { VIEWER_COLORS } from './colors'

/** 番号ラベル用のキャンバステクスチャスプライト（役割ごとに縁の色を変える） */
function NumberSprite({ number, ringColor }: { number: number; ringColor: string }) {
  const texture = useMemo(() => {
    const size = 128
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')!
    ctx.beginPath()
    ctx.arc(size / 2, size / 2, size / 2 - 8, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(10, 17, 32, 0.88)'
    ctx.fill()
    ctx.lineWidth = 8
    ctx.strokeStyle = ringColor
    ctx.stroke()
    ctx.fillStyle = '#ffffff'
    ctx.font = `700 ${number >= 100 ? 50 : 62}px system-ui, sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(String(number), size / 2, size / 2 + 4)
    const tex = new THREE.CanvasTexture(canvas)
    tex.colorSpace = THREE.SRGBColorSpace
    return tex
  }, [number, ringColor])

  return (
    <sprite position={[0, 2.4, 0]} scale={[2.2, 2.2, 1]}>
      <spriteMaterial map={texture} depthTest={false} transparent />
    </sprite>
  )
}

/** 選択中マーカーのパルスリング */
function PulseRing({ color }: { color: string }) {
  const ringRef = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    if (!ringRef.current) return
    const pulse = 1 + 0.18 * Math.sin(clock.elapsedTime * 4)
    ringRef.current.scale.setScalar(pulse)
    const material = ringRef.current.material as THREE.MeshBasicMaterial
    material.opacity = 0.55 + 0.25 * Math.sin(clock.elapsedTime * 4)
  })

  return (
    <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
      <ringGeometry args={[1.15, 1.5, 32]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={0.7}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}

/**
 * ウェイポイントマーカー。
 * クリックで「選択」（削除はサイドパネルから行う安全な導線）。
 * 高度が分かるよう地面までのポールを描画し、番号ラベルで一覧表と対応づける。
 */
export default function WaypointMarkers({
  waypoints,
  selectedId,
  onSelect,
}: {
  waypoints: Waypoint[]
  selectedId: string | null
  onSelect?: (id: string) => void
}) {
  return (
    <>
      {waypoints.map((wp, index) => {
        const [x, y, z] = waypointToPosition(wp)
        const isSelected = wp.id === selectedId
        const isStart = index === 0
        const isEnd = index === waypoints.length - 1
        const color = isStart
          ? VIEWER_COLORS.waypoint.start
          : isEnd
            ? VIEWER_COLORS.waypoint.end
            : VIEWER_COLORS.waypoint.middle
        const emissive = isStart
          ? VIEWER_COLORS.waypoint.emissive.start
          : isEnd
            ? VIEWER_COLORS.waypoint.emissive.end
            : VIEWER_COLORS.waypoint.emissive.middle

        return (
          <group key={wp.id} position={[x, 0, z]}>
            {/* マーカー本体（クリック=選択） */}
            <mesh
              position={[0, y, 0]}
              scale={isSelected ? 1.35 : 1}
              onClick={(e) => {
                e.stopPropagation()
                onSelect?.(wp.id)
              }}
              onPointerOver={() => {
                document.body.style.cursor = 'pointer'
              }}
              onPointerOut={() => {
                document.body.style.cursor = 'default'
              }}
            >
              <sphereGeometry args={[0.8, 20, 20]} />
              <meshStandardMaterial
                color={color}
                emissive={emissive}
                emissiveIntensity={isSelected ? 1.2 : 0.6}
                roughness={0.25}
                metalness={0.4}
              />
              <NumberSprite
                number={index + 1}
                ringColor={isStart || isEnd ? color : 'rgba(255,255,255,0.9)'}
              />
              {isSelected && (
                <PulseRing color={VIEWER_COLORS.waypoint.selectedRing} />
              )}
            </mesh>

            {/* 高度を示す地面からのポール */}
            <mesh position={[0, y / 2, 0]}>
              <cylinderGeometry args={[0.05, 0.05, y]} />
              <meshStandardMaterial
                color={VIEWER_COLORS.waypoint.pole}
                transparent
                opacity={0.45}
              />
            </mesh>
            {/* 地面上の直下点マーク */}
            <mesh position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.3, 0.55, 24]} />
              <meshBasicMaterial color={color} transparent opacity={0.6} />
            </mesh>
          </group>
        )
      })}
    </>
  )
}
