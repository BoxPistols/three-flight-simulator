'use client'

import { useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { Sky, Stars } from '@react-three/drei'
import * as THREE from 'three'
import type { Waypoint } from '@/features/flight-plan/model'
import type { FlightState } from '@/features/simulation/engine'
import AnimatedDrone from './AnimatedDrone'
import CameraRig, { type CameraMode } from './CameraRig'
import CityBuildings from './CityBuildings'
import FlightPath from './FlightPath'
import Ground from './Ground'
import WaypointMarkers from './WaypointMarkers'
import { SCENE_PALETTES, type SceneMode } from './colors'

export interface SceneProps {
  waypoints: Waypoint[]
  isFlying: boolean
  cameraMode: CameraMode
  /** UIテーマに連動した昼/夜モード */
  mode: SceneMode
  selectedId: string | null
  collidingSegments: Set<number>
  onGroundClick?: (x: number, z: number) => void
  onSegmentClick?: (
    segmentIndex: number,
    point: [number, number, number]
  ) => void
  onSelectWaypoint?: (id: string) => void
  onFlightUpdate?: (state: FlightState) => void
  onFlightComplete?: () => void
}

/** 3Dビューア本体。状態は持たず、propsの描画とイベント通知に徹する。 */
export default function Scene(props: SceneProps) {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [55, 55, 55], fov: 50 }}
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
  selectedId,
  collidingSegments,
  onGroundClick,
  onSegmentClick,
  onSelectWaypoint,
  onFlightUpdate,
  onFlightComplete,
}: SceneProps) {
  const droneRef = useRef<THREE.Group>(null)
  const palette = SCENE_PALETTES[mode]

  return (
    <>
      <color attach="background" args={[palette.sky]} />
      <fog attach="fog" args={[palette.fog, 120, 380]} />

      {/* 空: 昼は太陽と大気散乱、夜は星空 */}
      {mode === 'day' ? (
        <Sky
          distance={4000}
          sunPosition={[60, 45, 30]}
          turbidity={6}
          rayleigh={1.2}
          mieCoefficient={0.004}
          mieDirectionalG={0.85}
        />
      ) : (
        <Stars radius={280} depth={60} count={4500} factor={5} saturation={0} fade speed={0.6} />
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
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-90}
        shadow-camera-right={90}
        shadow-camera-top={90}
        shadow-camera-bottom={-90}
        shadow-camera-far={300}
        shadow-bias={-0.0004}
      />

      <Ground mode={mode} onGroundClick={isFlying ? undefined : onGroundClick} />
      <CityBuildings mode={mode} />

      <WaypointMarkers
        waypoints={waypoints}
        selectedId={selectedId}
        onSelect={isFlying ? undefined : onSelectWaypoint}
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

      <CameraRig mode={cameraMode} isFlying={isFlying} droneRef={droneRef} />
    </>
  )
}
