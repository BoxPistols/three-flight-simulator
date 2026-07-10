'use client'

import { BUILDINGS } from './city'

/** 都市の建物群（city.ts の静的データから描画） */
export default function CityBuildings() {
  return (
    <>
      {BUILDINGS.map((building, index) => (
        <mesh
          key={index}
          position={[
            building.center[0],
            building.size[1] / 2,
            building.center[1],
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
