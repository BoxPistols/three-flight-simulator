'use client'

import { useMemo } from 'react'
import * as THREE from 'three'
import { BUILDINGS } from './city'
import { SCENE_PALETTES, type SceneMode } from './colors'

/** テクスチャ1タイル = 幅4m × 高さ6m（窓2列×2段、一部は消灯） */
const TILE_W = 4
const TILE_H = 6

/** 窓明かりのパターンテクスチャ（黒地に暖色の窓、決定的な点灯パターン） */
function createWindowsTexture(): THREE.Texture {
  const canvas = document.createElement('canvas')
  canvas.width = 128
  canvas.height = 192
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#000000'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  // 2列 × 2段の窓。座標に基づく擬似乱数で一部を消灯させる
  const cols = 2
  const rows = 2
  const cellW = canvas.width / cols
  const cellH = canvas.height / rows
  for (let cx = 0; cx < cols; cx++) {
    for (let cy = 0; cy < rows; cy++) {
      const seed = Math.sin(cx * 127.1 + cy * 311.7) * 43758.5453
      const rand = seed - Math.floor(seed)
      if (rand < 0.35) continue // 消灯
      const brightness = 0.55 + rand * 0.45
      ctx.fillStyle = `rgba(255, 214, 150, ${brightness})`
      ctx.fillRect(
        cx * cellW + cellW * 0.22,
        cy * cellH + cellH * 0.18,
        cellW * 0.56,
        cellH * 0.5
      )
    }
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

function BuildingMesh({
  center,
  size,
  color,
  windowsTexture,
  emissiveIntensity,
}: {
  center: [number, number]
  size: [number, number, number]
  color: string
  windowsTexture: THREE.Texture
  emissiveIntensity: number
}) {
  // 建物サイズに合わせて窓の繰り返し数を調整（各建物ごとにテクスチャ設定を複製）
  const emissiveMap = useMemo(() => {
    const tex = windowsTexture.clone()
    tex.repeat.set(
      Math.max(1, Math.round(size[0] / TILE_W)),
      Math.max(1, Math.round(size[1] / TILE_H))
    )
    return tex
  }, [windowsTexture, size])

  return (
    <mesh
      position={[center[0], size[1] / 2, center[1]]}
      castShadow
      receiveShadow
    >
      <boxGeometry args={size} />
      <meshStandardMaterial
        color={color}
        roughness={0.85}
        metalness={0.15}
        emissive="#ffd696"
        emissiveMap={emissiveMap}
        emissiveIntensity={emissiveIntensity}
      />
    </mesh>
  )
}

/** 都市の建物群。夜モードでは窓明かりが灯る。 */
export default function CityBuildings({ mode }: { mode: SceneMode }) {
  const windowsTexture = useMemo(() => createWindowsTexture(), [])
  const emissiveIntensity = SCENE_PALETTES[mode].buildingEmissiveIntensity

  return (
    <>
      {BUILDINGS.map((building, index) => (
        <BuildingMesh
          key={index}
          center={building.center}
          size={building.size}
          color={building.color}
          windowsTexture={windowsTexture}
          emissiveIntensity={emissiveIntensity}
        />
      ))}
    </>
  )
}
