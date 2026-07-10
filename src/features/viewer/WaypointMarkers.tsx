'use client'

import { useMemo } from 'react'
import * as THREE from 'three'
import { waypointToPosition } from '@/features/simulation/engine'
import type { Waypoint } from '@/features/flight-plan/model'
import { VIEWER_COLORS } from './colors'

/** 番号ラベル用のキャンバステクスチャスプライト（troika等の追加依存なし） */
function NumberSprite({ number }: { number: number }) {
  const texture = useMemo(() => {
    const size = 128
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')!
    ctx.beginPath()
    ctx.arc(size / 2, size / 2, size / 2 - 6, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)'
    ctx.fill()
    ctx.lineWidth = 6
    ctx.strokeStyle = '#ffffff'
    ctx.stroke()
    ctx.fillStyle = '#ffffff'
    ctx.font = `bold ${number >= 100 ? 52 : 64}px system-ui, sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(String(number), size / 2, size / 2 + 4)
    const tex = new THREE.CanvasTexture(canvas)
    tex.colorSpace = THREE.SRGBColorSpace
    return tex
  }, [number])

  return (
    <sprite position={[0, 2.6, 0]} scale={[2.4, 2.4, 1]}>
      <spriteMaterial map={texture} depthTest={false} transparent />
    </sprite>
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
              scale={isSelected ? 1.4 : 1}
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
              <sphereGeometry args={[0.8, 16, 16]} />
              <meshStandardMaterial
                color={color}
                emissive={emissive}
                emissiveIntensity={isSelected ? 1.0 : 0.5}
                roughness={0.3}
                metalness={0.4}
              />
              {/* 番号ラベル（マーカーに追従） */}
              <NumberSprite number={index + 1} />
              {/* 選択リング */}
              {isSelected && (
                <mesh rotation={[Math.PI / 2, 0, 0]}>
                  <ringGeometry args={[1.1, 1.4, 32]} />
                  <meshBasicMaterial
                    color={VIEWER_COLORS.waypoint.selectedRing}
                    transparent
                    opacity={0.7}
                    side={THREE.DoubleSide}
                  />
                </mesh>
              )}
            </mesh>

            {/* 高度を示す地面からのポール */}
            <mesh position={[0, y / 2, 0]}>
              <cylinderGeometry args={[0.06, 0.06, y]} />
              <meshStandardMaterial
                color={VIEWER_COLORS.waypoint.pole}
                transparent
                opacity={0.6}
              />
            </mesh>
            {/* 地面上の直下点マーク */}
            <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <circleGeometry args={[0.5, 24]} />
              <meshBasicMaterial color={color} transparent opacity={0.5} />
            </mesh>
          </group>
        )
      })}
    </>
  )
}
