'use client'

import { useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import * as THREE from 'three'
import type { Waypoint } from '@/features/flight-plan/model'
import type { FlightState } from '@/features/simulation/engine'
import AnimatedDrone from './AnimatedDrone'
import CameraRig, { type CameraMode } from './CameraRig'
import CityBuildings from './CityBuildings'
import FlightPath from './FlightPath'
import Ground from './Ground'
import WaypointMarkers from './WaypointMarkers'
import { VIEWER_COLORS } from './colors'

export interface SceneProps {
  waypoints: Waypoint[]
  isFlying: boolean
  cameraMode: CameraMode
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
export default function Scene({
  waypoints,
  isFlying,
  cameraMode,
  selectedId,
  collidingSegments,
  onGroundClick,
  onSegmentClick,
  onSelectWaypoint,
  onFlightUpdate,
  onFlightComplete,
}: SceneProps) {
  return (
    <Canvas camera={{ position: [55, 55, 55], fov: 50 }}>
      <SceneContent
        waypoints={waypoints}
        isFlying={isFlying}
        cameraMode={cameraMode}
        selectedId={selectedId}
        collidingSegments={collidingSegments}
        onGroundClick={onGroundClick}
        onSegmentClick={onSegmentClick}
        onSelectWaypoint={onSelectWaypoint}
        onFlightUpdate={onFlightUpdate}
        onFlightComplete={onFlightComplete}
      />
    </Canvas>
  )
}

function SceneContent({
  waypoints,
  isFlying,
  cameraMode,
  selectedId,
  collidingSegments,
  onGroundClick,
  onSegmentClick,
  onSelectWaypoint,
  onFlightUpdate,
  onFlightComplete,
}: SceneProps) {
  const droneRef = useRef<THREE.Group>(null)

  return (
    <>
      <color attach="background" args={[VIEWER_COLORS.environment.sky]} />
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[0, 10, 0]} intensity={0.5} />

      <Ground onGroundClick={isFlying ? undefined : onGroundClick} />
      <CityBuildings />

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
