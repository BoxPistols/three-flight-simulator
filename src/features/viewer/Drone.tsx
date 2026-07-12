'use client'

import { forwardRef, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { VIEWER_COLORS } from './colors'

const ARM_POSITIONS: Array<[number, number]> = [
  [0.85, 0.85],
  [-0.85, 0.85],
  [0.85, -0.85],
  [-0.85, -0.85],
]

/**
 * クアッドコプターの3Dモデル。
 * X字フレーム + モーターポッド + 回転プロペラ + 航行灯（前: 緑 / 後: 赤）。
 * 実寸約1.7mと大きめだが、都市スケールでの視認性を優先している。
 */
const Drone = forwardRef<THREE.Group, { spinning?: boolean }>(
  ({ spinning = false }, ref) => {
    const propRefs = useRef<Array<THREE.Group | null>>([])

    useFrame((_state, delta) => {
      if (!spinning) return
      propRefs.current.forEach((prop, i) => {
        if (prop) prop.rotation.y += delta * 40 * (i % 2 === 0 ? 1 : -1)
      })
    })

    return (
      <group ref={ref}>
        {/* 機体本体 */}
        <mesh castShadow>
          <boxGeometry args={[0.9, 0.32, 1.2]} />
          <meshStandardMaterial
            color={VIEWER_COLORS.drone.body}
            roughness={0.35}
            metalness={0.7}
          />
        </mesh>
        {/* 天板アクセント */}
        <mesh position={[0, 0.18, 0]}>
          <boxGeometry args={[0.5, 0.06, 0.9]} />
          <meshStandardMaterial
            color={VIEWER_COLORS.drone.accent}
            emissive={VIEWER_COLORS.drone.accent}
            emissiveIntensity={0.4}
            roughness={0.3}
            metalness={0.5}
          />
        </mesh>
        {/* カメラジンバル */}
        <mesh position={[0, -0.22, 0.45]}>
          <sphereGeometry args={[0.16, 16, 16]} />
          <meshStandardMaterial color="#0b1220" roughness={0.2} metalness={0.8} />
        </mesh>

        {/* アーム・モーター・プロペラ */}
        {ARM_POSITIONS.map(([ax, az], i) => {
          const armLength = Math.hypot(ax, az)
          const armAngle = Math.atan2(ax, az)
          return (
            <group key={i}>
              {/* アーム */}
              <mesh
                position={[ax / 2, 0, az / 2]}
                rotation={[Math.PI / 2, 0, -armAngle]}
                castShadow
              >
                <cylinderGeometry args={[0.05, 0.07, armLength, 8]} />
                <meshStandardMaterial
                  color={VIEWER_COLORS.drone.body}
                  roughness={0.4}
                  metalness={0.6}
                />
              </mesh>
              {/* モーターポッド */}
              <mesh position={[ax, 0.08, az]} castShadow>
                <cylinderGeometry args={[0.11, 0.13, 0.22, 12]} />
                <meshStandardMaterial color="#0b1220" roughness={0.3} metalness={0.8} />
              </mesh>
              {/* プロペラ（2枚ブレード） */}
              <group
                position={[ax, 0.22, az]}
                ref={(el) => {
                  propRefs.current[i] = el
                }}
              >
                <mesh>
                  <boxGeometry args={[1.0, 0.02, 0.09]} />
                  <meshStandardMaterial
                    color={VIEWER_COLORS.drone.propeller}
                    transparent
                    opacity={spinning ? 0.35 : 0.95}
                    roughness={0.4}
                    metalness={0.4}
                  />
                </mesh>
                <mesh rotation={[0, Math.PI / 2, 0]}>
                  <boxGeometry args={[1.0, 0.02, 0.09]} />
                  <meshStandardMaterial
                    color={VIEWER_COLORS.drone.propeller}
                    transparent
                    opacity={spinning ? 0.35 : 0.95}
                    roughness={0.4}
                    metalness={0.4}
                  />
                </mesh>
              </group>
            </group>
          )
        })}

        {/* 航行灯: 前=緑 / 後=赤 */}
        <mesh position={[0, 0, 0.62]}>
          <sphereGeometry args={[0.07, 12, 12]} />
          <meshStandardMaterial
            color={VIEWER_COLORS.drone.ledFront}
            emissive={VIEWER_COLORS.drone.ledFront}
            emissiveIntensity={2}
          />
        </mesh>
        <mesh position={[0, 0, -0.62]}>
          <sphereGeometry args={[0.07, 12, 12]} />
          <meshStandardMaterial
            color={VIEWER_COLORS.drone.ledRear}
            emissive={VIEWER_COLORS.drone.ledRear}
            emissiveIntensity={2}
          />
        </mesh>
      </group>
    )
  }
)
Drone.displayName = 'Drone'

export default Drone
