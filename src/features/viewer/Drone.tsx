'use client'

import { forwardRef } from 'react'
import * as THREE from 'three'
import { VIEWER_COLORS } from './colors'

/**
 * ドローンの3Dモデル（本体 + 4プロペラ）。
 * 実寸約1.5mと大きめだが、都市スケールでの視認性を優先している。
 */
const Drone = forwardRef<THREE.Group>((_props, ref) => {
  return (
    <group ref={ref}>
      <mesh>
        <boxGeometry args={[1.5, 0.4, 0.4]} />
        <meshStandardMaterial
          color={VIEWER_COLORS.drone.body}
          roughness={0.4}
          metalness={0.6}
        />
      </mesh>
      {(
        [
          [1.0, 0, 0],
          [-1.0, 0, 0],
          [0, 0, 1.0],
          [0, 0, -1.0],
        ] as const
      ).map((position, i) => (
        <mesh key={i} position={position}>
          <boxGeometry
            args={i < 2 ? [0.15, 0.08, 0.6] : [0.6, 0.08, 0.15]}
          />
          <meshStandardMaterial
            color={VIEWER_COLORS.drone.propeller}
            roughness={0.3}
            metalness={0.8}
          />
        </mesh>
      ))}
    </group>
  )
})
Drone.displayName = 'Drone'

export default Drone
