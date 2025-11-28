'use client'

import React, { useRef, useEffect, forwardRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { convertWaypointsTo3D } from '@/lib/coordinateConverter'
import * as THREE from 'three'

// カラーパレット定義
const COLORS = {
  // ドローン
  drone: {
    body: '#3b82f6',      // 青（視認性の高い色）
    propeller: '#1e293b', // ダークグレー
  },
  // ウェイポイント
  waypoint: {
    start: '#10b981',     // エメラルドグリーン
    end: '#ef4444',       // 赤
    middle: '#f59e0b',    // アンバー
    emissive: {
      start: '#064e3b',   // 暗いグリーン
      end: '#7f1d1d',     // 暗い赤
      middle: '#78350f',  // 暗いアンバー
    },
    pole: '#6b7280',      // グレー
  },
  // 建物（統一されたグレー系パレット）
  buildings: {
    highRise: ['#475569', '#64748b'],     // スレートグレー
    midRise: ['#6b7280', '#9ca3af'],      // グレー
    lowRise: ['#d1d5db', '#e5e7eb'],      // ライトグレー
    residential: ['#94a3b8', '#cbd5e1'],  // スレートライトグレー
  },
  // 環境
  environment: {
    ground: '#a3a380',    // オリーブグリーン系
    sky: '#7dd3fc',       // 明るいスカイブルー
  },
  // フライトパス
  flightPath: '#3b82f6', // 青（ドローンと統一）
} as const

export interface Waypoint {
  id: string
  latitude: number
  longitude: number
  altitude: number
  speed: number
  rotation: number
}

// ドローンの3Dモデルをロード
const DroneModel = forwardRef<
  THREE.Group,
  { position?: [number, number, number]; rotation?: [number, number, number] }
>((props, ref) => {
  return (
    <group {...props} ref={ref}>
      {/* ドローン本体 */}
      <mesh>
        <boxGeometry args={[1.5, 0.4, 0.4]} />
        <meshStandardMaterial
          color={COLORS.drone.body}
          roughness={0.4}
          metalness={0.6}
        />
      </mesh>

      {/* プロペラ */}
      <mesh position={[1.0, 0, 0]}>
        <boxGeometry args={[0.15, 0.08, 0.6]} />
        <meshStandardMaterial
          color={COLORS.drone.propeller}
          roughness={0.3}
          metalness={0.8}
        />
      </mesh>
      <mesh position={[-1.0, 0, 0]}>
        <boxGeometry args={[0.15, 0.08, 0.6]} />
        <meshStandardMaterial
          color={COLORS.drone.propeller}
          roughness={0.3}
          metalness={0.8}
        />
      </mesh>
      <mesh position={[0, 0, 1.0]}>
        <boxGeometry args={[0.6, 0.08, 0.15]} />
        <meshStandardMaterial
          color={COLORS.drone.propeller}
          roughness={0.3}
          metalness={0.8}
        />
      </mesh>
      <mesh position={[0, 0, -1.0]}>
        <boxGeometry args={[0.6, 0.08, 0.15]} />
        <meshStandardMaterial
          color={COLORS.drone.propeller}
          roughness={0.3}
          metalness={0.8}
        />
      </mesh>
    </group>
  )
})
DroneModel.displayName = 'DroneModel'

// ウェイポイントマーカーを描画
function WaypointMarkers({
  waypoints,
  onRemoveWaypoint,
  highlightedWaypointId,
}: {
  waypoints: Waypoint[]
  onRemoveWaypoint?: (id: string) => void
  highlightedWaypointId?: string | null
}) {
  const pathPoints = convertWaypointsTo3D(waypoints)

  return (
    <>
      {pathPoints.map((wp, index) => {
        const isHighlighted = waypoints[index].id === highlightedWaypointId
        const isStart = index === 0
        const isEnd = index === pathPoints.length - 1

        return (
          <group key={index} position={wp.position}>
            {/* クリック可能なウェイポイントマーカー */}
            <mesh
              position={[0, 0.2, 0]}
              scale={isHighlighted ? 1.3 : 1}
              onClick={(e) => {
                e.stopPropagation()
                if (onRemoveWaypoint) {
                  onRemoveWaypoint(waypoints[index].id)
                }
              }}
              onPointerOver={() => {
                document.body.style.cursor = 'pointer'
              }}
              onPointerOut={() => {
                document.body.style.cursor = 'default'
              }}
            >
              <sphereGeometry args={[0.15, 16, 16]} />
              <meshStandardMaterial
                color={
                  isStart
                    ? COLORS.waypoint.start
                    : isEnd
                    ? COLORS.waypoint.end
                    : COLORS.waypoint.middle
                }
                emissive={
                  isStart
                    ? COLORS.waypoint.emissive.start
                    : isEnd
                    ? COLORS.waypoint.emissive.end
                    : COLORS.waypoint.emissive.middle
                }
                emissiveIntensity={isHighlighted ? 1.0 : 0.5}
                roughness={0.3}
                metalness={0.4}
              />
            </mesh>

            {/* ハイライト時のリング */}
            {isHighlighted && (
              <mesh position={[0, 0.2, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0.2, 0.25, 32]} />
                <meshBasicMaterial
                  color={isStart ? COLORS.waypoint.start : isEnd ? COLORS.waypoint.end : COLORS.waypoint.middle}
                  transparent
                  opacity={0.6}
                />
              </mesh>
            )}

            {/* 高度を示すポール */}
            <mesh position={[0, 0.1, 0]}>
              <cylinderGeometry args={[0.02, 0.02, 0.2]} />
              <meshStandardMaterial color={COLORS.waypoint.pole} />
            </mesh>
          </group>
        )
      })}
    </>
  )
}

// フライトパスを描画（クリック可能な管として描画）
function FlightPath({
  waypoints,
  onPathClick,
  isFlying,
}: {
  waypoints: Waypoint[]
  onPathClick?: (segmentIndex: number, clickPoint: THREE.Vector3) => void
  isFlying?: boolean
}) {
  if (waypoints.length < 2) return null

  const pathPoints = convertWaypointsTo3D(waypoints).map((wp) => wp.position)

  return (
    <>
      {/* 各セグメントを個別のクリック可能な管として描画 */}
      {pathPoints.map((point, index) => {
        if (index === pathPoints.length - 1) return null

        const start = new THREE.Vector3(...pathPoints[index])
        const end = new THREE.Vector3(...pathPoints[index + 1])

        // 中点を計算
        const midPoint = new THREE.Vector3().lerpVectors(start, end, 0.5)

        // セグメントの長さと方向を計算
        const direction = new THREE.Vector3().subVectors(end, start)
        const length = direction.length()

        // 回転を計算
        const quaternion = new THREE.Quaternion()
        quaternion.setFromUnitVectors(
          new THREE.Vector3(0, 1, 0),
          direction.normalize()
        )

        return (
          <group key={index}>
            {/* クリック可能な太い管 */}
            <mesh
              position={midPoint}
              quaternion={quaternion}
              onClick={(e) => {
                if (!isFlying) {
                  e.stopPropagation()
                  if (onPathClick) {
                    onPathClick(index, e.point)
                  }
                }
              }}
              onPointerOver={() => {
                if (!isFlying) {
                  document.body.style.cursor = 'pointer'
                }
              }}
              onPointerOut={() => {
                document.body.style.cursor = 'default'
              }}
            >
              <cylinderGeometry args={[0.08, 0.08, length, 8]} />
              <meshStandardMaterial
                color={COLORS.flightPath}
                opacity={0.6}
                transparent
                roughness={0.5}
                metalness={0.3}
              />
            </mesh>
          </group>
        )
      })}
    </>
  )
}

// ドローンのアニメーション
function AnimatedDrone({
  waypoints,
  isFlying,
  onFlightComplete,
  onDebugDataUpdate,
  orbitControlsRef,
  visualSpeed = 1.0, // 視覚的な飛行速度を制御するパラメータを追加
}: {
  waypoints: Waypoint[]
  isFlying: boolean
  onFlightComplete?: () => void
  onDebugDataUpdate?: (data: FlightDebugData) => void
  orbitControlsRef: React.RefObject<OrbitControlsImpl | null>
  visualSpeed?: number // 追加
}) {
  const droneRef = useRef<THREE.Group>(null)
  const progressRef = useRef(0)
  const currentIndexRef = useRef(0)
  const flightTimeRef = useRef(0)

  // 3D座標に変換
  const pathPoints = convertWaypointsTo3D(waypoints)

  // フライト停止時にリセット
  useEffect(() => {
    if (!isFlying) {
      progressRef.current = 0
      currentIndexRef.current = 0
      flightTimeRef.current = 0
      // 最初のウェイポイントの位置に戻す
      if (droneRef.current && pathPoints.length > 0) {
        droneRef.current.position.set(...pathPoints[0].position)
      }
    }
  }, [isFlying, pathPoints])

  useFrame((_state, delta) => {
    if (!isFlying || pathPoints.length < 2 || !droneRef.current) return

    // 飛行時間を更新
    flightTimeRef.current += delta

    const currentWaypoint = pathPoints[currentIndexRef.current]
    const nextWaypoint = pathPoints[currentIndexRef.current + 1]

    if (!nextWaypoint) {
      // 最後まで到達したら停止
      if (onFlightComplete) {
        onFlightComplete()
      }
      return
    }

    // 現在のウェイポイントから次のウェイポイントまでの距離
    const distance = Math.sqrt(
      Math.pow(nextWaypoint.position[0] - currentWaypoint.position[0], 2) +
        Math.pow(nextWaypoint.position[1] - currentWaypoint.position[1], 2) +
        Math.pow(nextWaypoint.position[2] - currentWaypoint.position[2], 2)
    )

    // アニメーション速度の計算をシンプルに
    const speed = Math.min(waypoints[currentIndexRef.current]?.speed || 15, 20)
    const baseSpeed = 0.3 // 基本速度係数
    const increment = (speed * baseSpeed * visualSpeed * delta) / Math.max(distance, 1)

    progressRef.current += increment

    if (progressRef.current >= 1) {
      progressRef.current = 0
      currentIndexRef.current += 1

      // 最後のウェイポイントに到達したら停止
      if (currentIndexRef.current >= pathPoints.length - 1) {
        if (onFlightComplete) {
          onFlightComplete()
        }
        return
      }
    }

    // 現在位置と次位置の間を補間
    const current = pathPoints[currentIndexRef.current]
    const next = pathPoints[currentIndexRef.current + 1]

    if (current && next) {
      const x =
        current.position[0] +
        (next.position[0] - current.position[0]) * progressRef.current
      const y =
        current.position[1] +
        (next.position[1] - current.position[1]) * progressRef.current
      const z =
        current.position[2] +
        (next.position[2] - current.position[2]) * progressRef.current

      droneRef.current.position.set(x, y, z)

      // ドローンの向きを設定
      const direction = [
        next.position[0] - current.position[0],
        next.position[1] - current.position[1],
        next.position[2] - current.position[2],
      ]

      if (direction[0] !== 0 || direction[2] !== 0) {
        const angle = Math.atan2(direction[0], direction[2])
        droneRef.current.rotation.y = angle
      }

      // デバッグデータを送信
      if (onDebugDataUpdate) {
        const overallProgress = ((currentIndexRef.current + progressRef.current) / (pathPoints.length - 1)) * 100
        const remainingDistance = distance * (1 - progressRef.current)

        onDebugDataUpdate({
          dronePosition: { x, y, z },
          droneRotation: {
            x: droneRef.current.rotation.x,
            y: droneRef.current.rotation.y,
            z: droneRef.current.rotation.z,
          },
          currentWaypointIndex: currentIndexRef.current,
          totalWaypoints: pathPoints.length,
          currentSpeed: speed,
          segmentProgress: progressRef.current,
          overallProgress,
          distanceToNext: remainingDistance,
          flightTime: flightTimeRef.current,
        })
      }
    }
  })

  // ドローンが最初のウェイポイントから開始するように初期位置を設定
  useEffect(() => {
    if (droneRef.current && pathPoints.length > 0) {
      droneRef.current.position.set(...pathPoints[0].position)
    }
  }, [pathPoints])

  return (
    <>
      <DroneModel ref={droneRef} />
      <DroneCamera droneRef={droneRef} isFlying={isFlying} orbitControlsRef={orbitControlsRef} />
    </>
  )
}

// クリックフィードバック用のリップルコンポーネント
function ClickRipple({ position }: { position: [number, number, number] }) {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame((state, delta) => {
    if (meshRef.current) {
      // スケールアップとフェードアウト
      meshRef.current.scale.x += delta * 2
      meshRef.current.scale.z += delta * 2
      const material = meshRef.current.material as THREE.MeshBasicMaterial
      material.opacity -= delta * 2

      // 完全に透明になったら削除
      if (material.opacity <= 0) {
        meshRef.current.visible = false
      }
    }
  })

  return (
    <mesh ref={meshRef} position={position} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.5, 0.8, 32]} />
      <meshBasicMaterial color={COLORS.waypoint.start} transparent opacity={0.8} />
    </mesh>
  )
}

// クリック可能な地面コンポーネント
function ClickableGround({
  onGroundClick,
}: {
  onGroundClick: (point: [number, number, number]) => void
}) {
  const [clickRipples, setClickRipples] = React.useState<Array<{ id: number; position: [number, number, number] }>>([])
  const clickState = useRef({
    isDragging: false,
    downPoint: null as THREE.Vector3 | null,
    downTime: 0,
  })

  const handlePointerDown = (
    e: import('@react-three/fiber').ThreeEvent<PointerEvent>
  ) => {
    clickState.current.isDragging = false
    clickState.current.downPoint = e.point.clone()
    clickState.current.downTime = Date.now()
  }

  const handlePointerMove = (
    e: import('@react-three/fiber').ThreeEvent<PointerEvent>
  ) => {
    if (clickState.current.downPoint) {
      // 閾値を超えて動いたらドラッグとみなす（閾値を大きく）
      if (e.point.distanceTo(clickState.current.downPoint) > 2) {
        clickState.current.isDragging = true
      }
    }
  }

  const handlePointerUp = (
    e: import('@react-three/fiber').ThreeEvent<PointerEvent>
  ) => {
    const clickDuration = Date.now() - clickState.current.downTime

    // ドラッグ中でなく、クリック時間が短い場合のみ（500ms以下）
    if (!clickState.current.isDragging && clickDuration < 500) {
      const point = e.point

      // リップル効果を追加
      const ripple = { id: Date.now(), position: [point.x, point.y, point.z] as [number, number, number] }
      setClickRipples([...clickRipples, ripple])

      // 1秒後にリップルを削除
      setTimeout(() => {
        setClickRipples(current => current.filter(r => r.id !== ripple.id))
      }, 1000)

      onGroundClick([point.x, 15, point.z]) // 高度15に設定
    }
    // リセット
    clickState.current.isDragging = false
    clickState.current.downPoint = null
  }

  return (
    <>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -1, 0]}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial
          color={COLORS.environment.ground}
          roughness={0.9}
          metalness={0.1}
        />
      </mesh>

      {/* クリックリップル効果 */}
      {clickRipples.map((ripple) => (
        <ClickRipple key={ripple.id} position={ripple.position} />
      ))}
    </>
  )
}

// ドローン目線のカメラコントローラー
function DroneCamera({
  droneRef,
  isFlying,
  orbitControlsRef,
}: {
  droneRef: React.RefObject<THREE.Group | null>
  isFlying: boolean
  orbitControlsRef: React.RefObject<OrbitControlsImpl | null>
}) {
  const { camera } = useThree()

  useFrame(() => {
    if (isFlying && droneRef.current && orbitControlsRef.current) {
      const dronePosition = droneRef.current.position

      // OrbitControlsのターゲットをドローン位置に追従させる
      // これによりユーザーはズームや回転が可能
      const target = orbitControlsRef.current.target as THREE.Vector3
      target.lerp(dronePosition, 0.1)

      // カメラもドローンに向かって緩やかに移動（遠すぎる場合のみ）
      const distanceToTarget = camera.position.distanceTo(dronePosition)
      if (distanceToTarget > 50) {
        const idealPosition = dronePosition.clone().add(new THREE.Vector3(15, 20, 15))
        camera.position.lerp(idealPosition, 0.05)
      }

      orbitControlsRef.current.update()
    }
  })

  return null
}

// 建物群を描画
function CityBuildings() {
  const buildings: {
    position: [number, number, number]
    size: [number, number, number]
    color: string
  }[] = [
    // 高層ビル群（統一されたスレートグレー）
    { position: [15, 0, 15], size: [8, 20, 8], color: COLORS.buildings.highRise[0] },
    { position: [-15, 0, 15], size: [6, 15, 6], color: COLORS.buildings.highRise[1] },
    { position: [15, 0, -15], size: [10, 25, 10], color: COLORS.buildings.highRise[0] },
    { position: [-15, 0, -15], size: [7, 18, 7], color: COLORS.buildings.highRise[1] },

    // 中層ビル群（グレー系）
    { position: [8, 0, 8], size: [5, 12, 5], color: COLORS.buildings.midRise[0] },
    { position: [-8, 0, 8], size: [4, 10, 4], color: COLORS.buildings.midRise[1] },
    { position: [8, 0, -8], size: [6, 14, 6], color: COLORS.buildings.midRise[0] },
    { position: [-8, 0, -8], size: [5, 11, 5], color: COLORS.buildings.midRise[1] },

    // 低層ビル群（ライトグレー）
    { position: [25, 0, 0], size: [4, 8, 4], color: COLORS.buildings.lowRise[0] },
    { position: [-25, 0, 0], size: [3, 6, 3], color: COLORS.buildings.lowRise[1] },
    { position: [0, 0, 25], size: [5, 9, 5], color: COLORS.buildings.lowRise[0] },
    { position: [0, 0, -25], size: [4, 7, 4], color: COLORS.buildings.lowRise[1] },

    // 住宅群（スレートライトグレー）
    { position: [30, 0, 30], size: [3, 5, 3], color: COLORS.buildings.residential[0] },
    { position: [-30, 0, 30], size: [2, 4, 2], color: COLORS.buildings.residential[1] },
    { position: [30, 0, -30], size: [2, 4, 2], color: COLORS.buildings.residential[0] },
    { position: [-30, 0, -30], size: [3, 5, 3], color: COLORS.buildings.residential[1] },
  ]

  return (
    <>
      {buildings.map((building, index) => (
        <mesh
          key={index}
          position={[
            building.position[0],
            building.position[1] + building.size[1] / 2,
            building.position[2],
          ]}
        >
          <boxGeometry args={building.size} />
          <meshStandardMaterial
            color={building.color}
            roughness={0.8}
            metalness={0.2}
          />
        </mesh>
      ))}
    </>
  )
}

// サンプルウェイポイントを建物に沿った曲線経路で生成する関数を修正
export function generateSampleWaypoints(): Waypoint[] {
  return [
    // 高層ビル群の周りを円形に飛行（建物に沿った曲線経路）
    {
      id: '1',
      latitude: 15,
      longitude: 15,
      altitude: 25,
      speed: 15, // 15km/h
      rotation: 0,
    },
    {
      id: '2',
      latitude: 12,
      longitude: 18,
      altitude: 25,
      speed: 16,
      rotation: 0,
    },
    {
      id: '3',
      latitude: 8,
      longitude: 20,
      altitude: 25,
      speed: 17,
      rotation: 0,
    },
    {
      id: '4',
      latitude: 4,
      longitude: 21,
      altitude: 25,
      speed: 18,
      rotation: 0,
    },
    {
      id: '5',
      latitude: 0,
      longitude: 22,
      altitude: 25,
      speed: 19,
      rotation: 0,
    },
    {
      id: '6',
      latitude: -4,
      longitude: 21,
      altitude: 22,
      speed: 20, // 最大20km/h
      rotation: 0,
    },
    {
      id: '7',
      latitude: -8,
      longitude: 20,
      altitude: 22,
      speed: 18,
      rotation: 0,
    },
    {
      id: '8',
      latitude: -12,
      longitude: 18,
      altitude: 22,
      speed: 17,
      rotation: 0,
    },
    {
      id: '9',
      latitude: -15,
      longitude: 15,
      altitude: 22,
      speed: 16,
      rotation: 0,
    },
    {
      id: '10',
      latitude: -18,
      longitude: 12,
      altitude: 22,
      speed: 15,
      rotation: 0,
    },
    {
      id: '11',
      latitude: -20,
      longitude: 8,
      altitude: 22,
      speed: 16,
      rotation: 0,
    },
    {
      id: '12',
      latitude: -21,
      longitude: 4,
      altitude: 22,
      speed: 17,
      rotation: 0,
    },
    {
      id: '13',
      latitude: -22,
      longitude: 0,
      altitude: 22,
      speed: 18,
      rotation: 0,
    },
    {
      id: '14',
      latitude: -21,
      longitude: -4,
      altitude: 24,
      speed: 19,
      rotation: 0,
    },
    {
      id: '15',
      latitude: -20,
      longitude: -8,
      altitude: 24,
      speed: 20,
      rotation: 0,
    },
    {
      id: '16',
      latitude: -18,
      longitude: -12,
      altitude: 24,
      speed: 18,
      rotation: 0,
    },
    {
      id: '17',
      latitude: -15,
      longitude: -15,
      altitude: 24,
      speed: 17,
      rotation: 0,
    },
    {
      id: '18',
      latitude: -12,
      longitude: -18,
      altitude: 24,
      speed: 16,
      rotation: 0,
    },
    {
      id: '19',
      latitude: -8,
      longitude: -20,
      altitude: 24,
      speed: 15,
      rotation: 0,
    },
    {
      id: '20',
      latitude: -4,
      longitude: -21,
      altitude: 26,
      speed: 16,
      rotation: 0,
    },
    {
      id: '21',
      latitude: 0,
      longitude: -22,
      altitude: 26,
      speed: 17,
      rotation: 0,
    },
    {
      id: '22',
      latitude: 4,
      longitude: -21,
      altitude: 26,
      speed: 18,
      rotation: 0,
    },
    {
      id: '23',
      latitude: 8,
      longitude: -20,
      altitude: 26,
      speed: 19,
      rotation: 0,
    },
    {
      id: '24',
      latitude: 12,
      longitude: -18,
      altitude: 26,
      speed: 20,
      rotation: 0,
    },
    {
      id: '25',
      latitude: 15,
      longitude: -15,
      altitude: 26,
      speed: 18,
      rotation: 0,
    },
    {
      id: '26',
      latitude: 18,
      longitude: -12,
      altitude: 26,
      speed: 17,
      rotation: 0,
    },
    {
      id: '27',
      latitude: 20,
      longitude: -8,
      altitude: 26,
      speed: 16,
      rotation: 0,
    },
    {
      id: '28',
      latitude: 21,
      longitude: -4,
      altitude: 28,
      speed: 15,
      rotation: 0,
    },
    {
      id: '29',
      latitude: 22,
      longitude: 0,
      altitude: 28,
      speed: 16,
      rotation: 0,
    },
    {
      id: '30',
      latitude: 21,
      longitude: 4,
      altitude: 28,
      speed: 17,
      rotation: 0,
    },
    {
      id: '31',
      latitude: 20,
      longitude: 8,
      altitude: 28,
      speed: 18,
      rotation: 0,
    },
    {
      id: '32',
      latitude: 18,
      longitude: 12,
      altitude: 28,
      speed: 19,
      rotation: 0,
    },

    // 中層ビル群の周りを8の字で飛行（ゆらぎを持たせた経路）
    {
      id: '33',
      latitude: 8,
      longitude: 8,
      altitude: 18,
      speed: 15,
      rotation: 0,
    },
    {
      id: '34',
      latitude: 6,
      longitude: 11,
      altitude: 18,
      speed: 16,
      rotation: 0,
    },
    {
      id: '35',
      latitude: 3,
      longitude: 13,
      altitude: 18,
      speed: 17,
      rotation: 0,
    },
    {
      id: '36',
      latitude: 0,
      longitude: 14,
      altitude: 18,
      speed: 18,
      rotation: 0,
    },
    {
      id: '37',
      latitude: -3,
      longitude: 13,
      altitude: 16,
      speed: 19,
      rotation: 0,
    },
    {
      id: '38',
      latitude: -6,
      longitude: 11,
      altitude: 16,
      speed: 20,
      rotation: 0,
    },
    {
      id: '39',
      latitude: -8,
      longitude: 8,
      altitude: 16,
      speed: 18,
      rotation: 0,
    },
    {
      id: '40',
      latitude: -11,
      longitude: 6,
      altitude: 16,
      speed: 17,
      rotation: 0,
    },
    {
      id: '41',
      latitude: -13,
      longitude: 3,
      altitude: 16,
      speed: 16,
      rotation: 0,
    },
    {
      id: '42',
      latitude: -14,
      longitude: 0,
      altitude: 16,
      speed: 15,
      rotation: 0,
    },
    {
      id: '43',
      latitude: -13,
      longitude: -3,
      altitude: 17,
      speed: 16,
      rotation: 0,
    },
    {
      id: '44',
      latitude: -11,
      longitude: -6,
      altitude: 17,
      speed: 17,
      rotation: 0,
    },
    {
      id: '45',
      latitude: -8,
      longitude: -8,
      altitude: 17,
      speed: 18,
      rotation: 0,
    },
    {
      id: '46',
      latitude: -6,
      longitude: -11,
      altitude: 17,
      speed: 19,
      rotation: 0,
    },
    {
      id: '47',
      latitude: -3,
      longitude: -13,
      altitude: 17,
      speed: 20,
      rotation: 0,
    },
    {
      id: '48',
      latitude: 0,
      longitude: -14,
      altitude: 17,
      speed: 18,
      rotation: 0,
    },
    {
      id: '49',
      latitude: 3,
      longitude: -13,
      altitude: 19,
      speed: 17,
      rotation: 0,
    },
    {
      id: '50',
      latitude: 6,
      longitude: -11,
      altitude: 19,
      speed: 16,
      rotation: 0,
    },
    {
      id: '51',
      latitude: 8,
      longitude: -8,
      altitude: 19,
      speed: 15,
      rotation: 0,
    },
    {
      id: '52',
      latitude: 11,
      longitude: -6,
      altitude: 19,
      speed: 16,
      rotation: 0,
    },
    {
      id: '53',
      latitude: 13,
      longitude: -3,
      altitude: 19,
      speed: 17,
      rotation: 0,
    },
    {
      id: '54',
      latitude: 14,
      longitude: 0,
      altitude: 19,
      speed: 18,
      rotation: 0,
    },
    {
      id: '55',
      latitude: 13,
      longitude: 3,
      altitude: 19,
      speed: 19,
      rotation: 0,
    },
    {
      id: '56',
      latitude: 11,
      longitude: 6,
      altitude: 19,
      speed: 20,
      rotation: 0,
    },
  ]
}

export interface FlightDebugData {
  dronePosition: { x: number; y: number; z: number }
  droneRotation: { x: number; y: number; z: number }
  currentWaypointIndex: number
  totalWaypoints: number
  currentSpeed: number
  segmentProgress: number
  overallProgress: number
  distanceToNext: number
  flightTime: number
}

export interface SceneProps {
  waypoints?: Waypoint[]
  isFlying?: boolean
  onAddWaypoint?: (position: [number, number, number]) => void
  onInsertWaypoint?: (segmentIndex: number, position: [number, number, number]) => void
  onRemoveWaypoint?: (id: string) => void
  onFlightComplete?: () => void
  onDebugDataUpdate?: (data: FlightDebugData) => void
  visualSpeed?: number
  highlightedWaypointId?: string | null
}

// OrbitControls用のラッパーコンポーネント
function SceneContent({
  waypoints,
  isFlying,
  onAddWaypoint,
  onInsertWaypoint,
  onRemoveWaypoint,
  onFlightComplete,
  onDebugDataUpdate,
  visualSpeed,
  highlightedWaypointId,
}: {
  waypoints: Waypoint[]
  isFlying: boolean
  onAddWaypoint?: (position: [number, number, number]) => void
  onInsertWaypoint?: (segmentIndex: number, position: [number, number, number]) => void
  onRemoveWaypoint?: (id: string) => void
  onFlightComplete: () => void
  onDebugDataUpdate?: (data: FlightDebugData) => void
  visualSpeed: number
  highlightedWaypointId: string | null
}) {
  const orbitControlsRef = useRef<OrbitControlsImpl | null>(null)

  const handleGroundClick = (point: [number, number, number]) => {
    if (onAddWaypoint) {
      onAddWaypoint(point)
    }
  }

  const handlePathClick = (segmentIndex: number, clickPoint: THREE.Vector3) => {
    if (onInsertWaypoint) {
      onInsertWaypoint(segmentIndex, [clickPoint.x, clickPoint.y, clickPoint.z])
    }
  }

  return (
    <>
      <color attach='background' args={[COLORS.environment.sky]} />
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[0, 10, 0]} intensity={0.5} />

      {/* クリック可能な地面 */}
      <ClickableGround onGroundClick={handleGroundClick} />

      {/* ウェイポイントマーカー */}
      <WaypointMarkers
        waypoints={waypoints}
        onRemoveWaypoint={onRemoveWaypoint}
        highlightedWaypointId={highlightedWaypointId}
      />

      {/* フライトパス */}
      <FlightPath waypoints={waypoints} onPathClick={handlePathClick} isFlying={isFlying} />

      {/* ドローン */}
      <AnimatedDrone
        waypoints={waypoints}
        isFlying={isFlying}
        onFlightComplete={onFlightComplete}
        onDebugDataUpdate={onDebugDataUpdate}
        orbitControlsRef={orbitControlsRef}
        visualSpeed={visualSpeed}
      />

      {/* 建物群 */}
      <CityBuildings />

      {/* OrbitControls */}
      <OrbitControls
        ref={orbitControlsRef}
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        enableDamping={true}
        dampingFactor={0.05}
        rotateSpeed={0.8}
        zoomSpeed={1.2}
        panSpeed={1.0}
        minDistance={5}
        maxDistance={200}
        minPolarAngle={0.1}
        maxPolarAngle={Math.PI / 2 - 0.1}
        target={new THREE.Vector3(0, 10, 0)}
      />
    </>
  )
}

export default function Scene({
  waypoints = [],
  isFlying = false,
  onAddWaypoint,
  onInsertWaypoint,
  onRemoveWaypoint,
  onFlightComplete = () => {},
  onDebugDataUpdate,
  visualSpeed = 1.0,
  highlightedWaypointId = null,
}: SceneProps) {
  return (
    <Canvas
      className='w-full h-full'
      camera={{ position: [30, 40, 30], fov: 50 }}
    >
      <SceneContent
        waypoints={waypoints}
        isFlying={isFlying}
        onAddWaypoint={onAddWaypoint}
        onInsertWaypoint={onInsertWaypoint}
        onRemoveWaypoint={onRemoveWaypoint}
        onFlightComplete={onFlightComplete}
        onDebugDataUpdate={onDebugDataUpdate}
        visualSpeed={visualSpeed}
        highlightedWaypointId={highlightedWaypointId}
      />
    </Canvas>
  )
}
