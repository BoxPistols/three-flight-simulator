'use client'

import { useMemo, useRef } from 'react'
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import { waypointToPosition } from '@/features/simulation/engine'
import type { Waypoint } from '@/features/flight-plan/model'
import { GROUND_SIZE_M } from './city'
import { VIEWER_COLORS } from './colors'

/** ドラッグとクリックを区別する移動量のしきい値 [px] */
const DRAG_THRESHOLD_PX = 4
/** 地面の可動範囲（中心からの半分） */
const BOUND = GROUND_SIZE_M / 2 - 2

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

const clampToBounds = (v: number) => Math.max(-BOUND, Math.min(BOUND, v))
const round1 = (v: number) => Math.round(v * 10) / 10

interface DragCallbacks {
  onSelect?: (id: string) => void
  onDragActiveChange?: (active: boolean) => void
  onDragBegin?: () => void
  onDrag?: (id: string, x: number, z: number) => void
}

/** クリックで選択、ドラッグで水平移動できる単一マーカー */
function DraggableMarker({
  wp,
  index,
  count,
  selected,
  interactive,
  callbacks,
}: {
  wp: Waypoint
  index: number
  count: number
  selected: boolean
  interactive: boolean
  callbacks: DragCallbacks
}) {
  const { camera, gl } = useThree()
  const raycaster = useMemo(() => new THREE.Raycaster(), [])
  const drag = useRef({
    active: false,
    moved: false,
    planeY: 0,
    startX: 0,
    startY: 0,
  })

  const [x, y, z] = waypointToPosition(wp)
  const isStart = index === 0
  const isEnd = index === count - 1
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

  /** clientX/Y を水平面（y=planeY）上の座標に変換 */
  const projectToPlane = (clientX: number, clientY: number) => {
    const rect = gl.domElement.getBoundingClientRect()
    const ndc = new THREE.Vector2(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1
    )
    raycaster.setFromCamera(ndc, camera)
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -drag.current.planeY)
    const target = new THREE.Vector3()
    return raycaster.ray.intersectPlane(plane, target)
  }

  const handleWindowMove = (e: PointerEvent) => {
    if (!drag.current.active) return
    const dist = Math.hypot(e.clientX - drag.current.startX, e.clientY - drag.current.startY)
    if (!drag.current.moved && dist > DRAG_THRESHOLD_PX) {
      drag.current.moved = true
      callbacks.onDragBegin?.() // 初回移動時に一度だけ履歴を積む
    }
    if (drag.current.moved) {
      const point = projectToPlane(e.clientX, e.clientY)
      if (point) {
        callbacks.onDrag?.(
          wp.id,
          round1(clampToBounds(point.x)),
          round1(clampToBounds(point.z))
        )
      }
    }
  }

  const handleWindowUp = () => {
    window.removeEventListener('pointermove', handleWindowMove)
    window.removeEventListener('pointerup', handleWindowUp)
    const wasClick = !drag.current.moved
    drag.current.active = false
    callbacks.onDragActiveChange?.(false)
    document.body.style.cursor = 'default'
    if (wasClick) callbacks.onSelect?.(wp.id)
  }

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    if (!interactive) return
    e.stopPropagation()
    drag.current = {
      active: true,
      moved: false,
      planeY: y,
      startX: e.clientX,
      startY: e.clientY,
    }
    callbacks.onDragActiveChange?.(true)
    document.body.style.cursor = 'grabbing'
    window.addEventListener('pointermove', handleWindowMove)
    window.addEventListener('pointerup', handleWindowUp)
  }

  return (
    <group position={[x, 0, z]}>
      <mesh
        position={[0, y, 0]}
        scale={selected ? 1.35 : 1}
        onPointerDown={handlePointerDown}
        onPointerOver={() => {
          if (interactive) document.body.style.cursor = 'grab'
        }}
        onPointerOut={() => {
          if (!drag.current.active) document.body.style.cursor = 'default'
        }}
      >
        <sphereGeometry args={[0.8, 20, 20]} />
        <meshStandardMaterial
          color={color}
          emissive={emissive}
          emissiveIntensity={selected ? 1.2 : 0.6}
          roughness={0.25}
          metalness={0.4}
        />
        <NumberSprite
          number={index + 1}
          ringColor={isStart || isEnd ? color : 'rgba(255,255,255,0.9)'}
        />
        {selected && <PulseRing color={VIEWER_COLORS.waypoint.selectedRing} />}
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
}

/**
 * ウェイポイントマーカー。
 * クリックで「選択」、ドラッグで水平移動（削除はサイドパネルから行う）。
 * 高度が分かるよう地面までのポールを描画し、番号ラベルで一覧表と対応づける。
 */
export default function WaypointMarkers({
  waypoints,
  selectedId,
  interactive,
  onSelect,
  onDragActiveChange,
  onDragBegin,
  onDrag,
}: {
  waypoints: Waypoint[]
  selectedId: string | null
  interactive: boolean
  onSelect?: (id: string) => void
  onDragActiveChange?: (active: boolean) => void
  onDragBegin?: () => void
  onDrag?: (id: string, x: number, z: number) => void
}) {
  const callbacks: DragCallbacks = {
    onSelect,
    onDragActiveChange,
    onDragBegin,
    onDrag,
  }
  return (
    <>
      {waypoints.map((wp, index) => (
        <DraggableMarker
          key={wp.id}
          wp={wp}
          index={index}
          count={waypoints.length}
          selected={wp.id === selectedId}
          interactive={interactive}
          callbacks={callbacks}
        />
      ))}
    </>
  )
}
