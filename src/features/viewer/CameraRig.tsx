'use client'

import { useEffect, useRef, type RefObject } from 'react'
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
  locked = false,
  maxDistance = 300,
  worldKind = 'virtual',
}: {
  mode: CameraMode
  isFlying: boolean
  droneRef: RefObject<THREE.Group | null>
  /** ウェイポイントのドラッグ中などにカメラ操作を一時停止する */
  locked?: boolean
  /** ズームアウトの上限 [m]（実在都市モードでは広く取る） */
  maxDistance?: number
  /** 環境の種類。切替時に適した視点距離へカメラを移動する */
  worldKind?: 'virtual' | 'real'
}) {
  const controlsRef = useRef<React.ElementRef<typeof OrbitControls>>(null)
  const { camera } = useThree()
  const fpvActive = isFlying && mode === 'fpv'

  // 環境切替時にスケールに合った俯瞰位置へ移動
  useEffect(() => {
    const controls = controlsRef.current
    if (!controls) return
    if (worldKind === 'real') {
      camera.position.set(450, 380, 450)
      ;(controls.target as THREE.Vector3).set(0, 0, 0)
    } else {
      camera.position.set(55, 55, 55)
      ;(controls.target as THREE.Vector3).set(0, 15, 0)
    }
    controls.update()
  }, [worldKind, camera])

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
      // チェイスカメラ: ドローン後方やや上から進行方向を見下ろす
      // （経路チューブが視界中央を塞がないよう高めに配置）
      const yaw = drone.rotation.y
      const forward = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw))
      const idealPosition = drone.position
        .clone()
        .addScaledVector(forward, -9)
        .add(new THREE.Vector3(0, 4, 0))
      camera.position.lerp(idealPosition, 0.22)
      const lookTarget = drone.position.clone().addScaledVector(forward, 7)
      camera.lookAt(lookTarget)
    }
  })

  return (
    <OrbitControls
      ref={controlsRef}
      enabled={!fpvActive && !locked}
      enablePan
      enableZoom
      enableRotate
      enableDamping
      dampingFactor={0.05}
      rotateSpeed={0.8}
      zoomSpeed={1.2}
      panSpeed={1.0}
      minDistance={5}
      maxDistance={maxDistance}
      minPolarAngle={0.1}
      maxPolarAngle={Math.PI / 2 - 0.05}
      target={new THREE.Vector3(0, 15, 0)}
    />
  )
}
