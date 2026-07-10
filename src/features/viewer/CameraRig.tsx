'use client'

import { useRef, type RefObject } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'

export type CameraMode = 'follow' | 'fpv' | 'free'

export const CAMERA_MODE_LABELS: Record<CameraMode, string> = {
  follow: '追従',
  fpv: 'FPV',
  free: '自由',
}

/**
 * カメラ制御。
 * - 追従: OrbitControls のターゲットがドローンを追う（回転・ズーム操作は可能）
 * - FPV: ドローン後方視点（操作不可）
 * - 自由: 通常の OrbitControls（飛行中も固定視点で観察）
 */
export default function CameraRig({
  mode,
  isFlying,
  droneRef,
}: {
  mode: CameraMode
  isFlying: boolean
  droneRef: RefObject<THREE.Group | null>
}) {
  const controlsRef = useRef<React.ElementRef<typeof OrbitControls>>(null)
  const { camera } = useThree()
  const fpvActive = isFlying && mode === 'fpv'

  useFrame(() => {
    const drone = droneRef.current
    const controls = controlsRef.current
    if (!isFlying || !drone || !controls) return

    if (mode === 'follow') {
      const target = controls.target as THREE.Vector3
      target.lerp(drone.position, 0.1)
      // 離れすぎた場合のみカメラを引き寄せる
      if (camera.position.distanceTo(drone.position) > 80) {
        const idealPosition = drone.position
          .clone()
          .add(new THREE.Vector3(20, 25, 20))
        camera.position.lerp(idealPosition, 0.05)
      }
      controls.update()
    } else if (mode === 'fpv') {
      const yaw = drone.rotation.y
      const forward = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw))
      const idealPosition = drone.position
        .clone()
        .addScaledVector(forward, -6)
        .add(new THREE.Vector3(0, 2.5, 0))
      camera.position.lerp(idealPosition, 0.15)
      const lookTarget = drone.position.clone().addScaledVector(forward, 12)
      camera.lookAt(lookTarget)
    }
  })

  return (
    <OrbitControls
      ref={controlsRef}
      enabled={!fpvActive}
      enablePan
      enableZoom
      enableRotate
      enableDamping
      dampingFactor={0.05}
      rotateSpeed={0.8}
      zoomSpeed={1.2}
      panSpeed={1.0}
      minDistance={5}
      maxDistance={300}
      minPolarAngle={0.1}
      maxPolarAngle={Math.PI / 2 - 0.05}
      target={new THREE.Vector3(0, 15, 0)}
    />
  )
}
