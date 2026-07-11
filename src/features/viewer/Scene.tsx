'use client'

import { useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { Sky, Stars } from '@react-three/drei'
import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing'
import * as THREE from 'three'
import type { Waypoint } from '@/features/flight-plan/model'
import type { FlightState } from '@/features/simulation/engine'
import RealWorld, { type RealWorldStatus } from '@/features/world/RealWorld'
import type { RealLocation } from '@/features/world/locations'
import AnimatedDrone from './AnimatedDrone'
import CameraRig, { type CameraMode } from './CameraRig'
import CityBuildings from './CityBuildings'
import FlightPath from './FlightPath'
import Ground from './Ground'
import WaypointMarkers from './WaypointMarkers'
import { SCENE_PALETTES, type SceneMode } from './colors'

/** シーンの環境設定: 仮想都市 or 実在都市（PLATEAU + 実地形） */
export type WorldSettings =
  | { kind: 'virtual' }
  | { kind: 'real'; location: RealLocation }

export interface SceneProps {
  waypoints: Waypoint[]
  isFlying: boolean
  cameraMode: CameraMode
  /** UIテーマに連動した昼/夜モード */
  mode: SceneMode
  world: WorldSettings
  selectedId: string | null
  collidingSegments: Set<number>
  /** 地面クリック（groundY は実在都市モードでの地表高） */
  onGroundClick?: (x: number, z: number, groundY: number) => void
  onSegmentClick?: (
    segmentIndex: number,
    point: [number, number, number]
  ) => void
  onSelectWaypoint?: (id: string) => void
  onWaypointDragBegin?: () => void
  onWaypointDrag?: (id: string, x: number, z: number) => void
  onFlightUpdate?: (state: FlightState) => void
  onFlightComplete?: () => void
  onRealWorldStatus?: (status: RealWorldStatus) => void
}

/** 環境ごとの描画スケール設定 */
const ENV_SCALE = {
  virtual: { fogNear: 120, fogFar: 380, starsRadius: 280, maxDistance: 300 },
  real: { fogNear: 1500, fogFar: 7000, starsRadius: 6500, maxDistance: 3200 },
} as const

/** 3Dビューア本体。状態は持たず、propsの描画とイベント通知に徹する。 */
export default function Scene(props: SceneProps) {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      gl={{ antialias: true }}
      camera={{ position: [55, 55, 55], fov: 50, near: 1, far: 15000 }}
    >
      <SceneContent {...props} />
    </Canvas>
  )
}

function SceneContent({
  waypoints,
  isFlying,
  cameraMode,
  mode,
  world,
  selectedId,
  collidingSegments,
  onGroundClick,
  onSegmentClick,
  onSelectWaypoint,
  onWaypointDragBegin,
  onWaypointDrag,
  onFlightUpdate,
  onFlightComplete,
  onRealWorldStatus,
}: SceneProps) {
  const droneRef = useRef<THREE.Group>(null)
  const [draggingWaypoint, setDraggingWaypoint] = useState(false)
  const palette = SCENE_PALETTES[mode]
  const isNight = mode === 'night'
  const scale = ENV_SCALE[world.kind]

  return (
    <>
      <color attach="background" args={[palette.sky]} />
      <fog attach="fog" args={[palette.fog, scale.fogNear, scale.fogFar]} />

      {/* 空: 昼は太陽と大気散乱、夜は星空 */}
      {mode === 'day' ? (
        <Sky
          distance={40000}
          sunPosition={[60, 45, 30]}
          turbidity={6}
          rayleigh={1.2}
          mieCoefficient={0.004}
          mieDirectionalG={0.85}
        />
      ) : (
        <Stars
          radius={scale.starsRadius}
          depth={60}
          count={4500}
          factor={mode === 'night' && world.kind === 'real' ? 60 : 5}
          saturation={0}
          fade
          speed={0.6}
        />
      )}

      {/* ライティング */}
      <hemisphereLight
        args={[palette.hemisphereSky, palette.hemisphereGround, 0.8]}
      />
      <ambientLight intensity={palette.ambientIntensity} />
      <directionalLight
        position={[60, 80, 40]}
        intensity={palette.sunIntensity}
        color={mode === 'day' ? '#fff5e0' : '#8fb8ff'}
        castShadow={world.kind === 'virtual'}
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-90}
        shadow-camera-right={90}
        shadow-camera-top={90}
        shadow-camera-bottom={-90}
        shadow-camera-far={300}
        shadow-bias={-0.0004}
      />

      {/* 環境: 仮想都市 or 実在都市 */}
      {world.kind === 'virtual' ? (
        <>
          <Ground
            mode={mode}
            onGroundClick={
              isFlying || !onGroundClick
                ? undefined
                : (x, z) => onGroundClick(x, z, 0)
            }
          />
          <CityBuildings mode={mode} />
        </>
      ) : (
        <RealWorld
          location={world.location}
          mode={mode}
          onGroundClick={isFlying ? undefined : onGroundClick}
          onStatusChange={onRealWorldStatus}
        />
      )}

      <WaypointMarkers
        waypoints={waypoints}
        selectedId={selectedId}
        interactive={!isFlying}
        onSelect={onSelectWaypoint}
        onDragActiveChange={setDraggingWaypoint}
        onDragBegin={onWaypointDragBegin}
        onDrag={onWaypointDrag}
      />
      <FlightPath
        waypoints={waypoints}
        collidingSegments={collidingSegments}
        isFlying={isFlying}
        onSegmentClick={onSegmentClick}
      />

      <AnimatedDrone
        waypoints={waypoints}
        isFlying={isFlying}
        droneRef={droneRef}
        onFlightUpdate={onFlightUpdate}
        onFlightComplete={onFlightComplete}
      />

      <CameraRig
        mode={cameraMode}
        isFlying={isFlying}
        droneRef={droneRef}
        locked={draggingWaypoint}
        maxDistance={scale.maxDistance}
        worldKind={world.kind}
      />

      {/* ポストプロセス: 発光を強調するブルーム + 周辺減光 */}
      <EffectComposer enableNormalPass={false}>
        <Bloom
          intensity={isNight ? 1.15 : 0.3}
          luminanceThreshold={isNight ? 0.6 : 0.85}
          luminanceSmoothing={0.9}
          mipmapBlur
          radius={0.7}
        />
        <Vignette eskil={false} offset={0.25} darkness={isNight ? 0.6 : 0.35} />
      </EffectComposer>
    </>
  )
}
