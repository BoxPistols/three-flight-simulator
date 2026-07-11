'use client'

import { useEffect, useState } from 'react'
import Terrain, { type TerrainStatus } from './Terrain'
import PlateauTiles, { type TilesStatus } from './PlateauTiles'
import type { RealLocation } from './locations'
import type { SceneMode } from '@/features/viewer/colors'

export interface RealWorldStatus {
  terrain: TerrainStatus
  buildings: TilesStatus
}

/**
 * 実在都市モードの環境レイヤー。
 * 地理院タイルの実地形 + PLATEAU 建築物モデルをまとめて管理する。
 * 建物は地形の原点標高が確定してから高さを合わせて読み込む。
 */
export default function RealWorld({
  location,
  mode,
  onGroundClick,
  onStatusChange,
}: {
  location: RealLocation
  mode: SceneMode
  onGroundClick?: (x: number, z: number, groundY: number) => void
  onStatusChange?: (status: RealWorldStatus) => void
}) {
  const [originHeight, setOriginHeight] = useState<number | null>(null)
  const [terrainStatus, setTerrainStatus] = useState<TerrainStatus>('loading')
  const [buildingsStatus, setBuildingsStatus] = useState<TilesStatus>('loading')

  // ロケーション変更で高さ基準をリセット
  useEffect(() => {
    setOriginHeight(null)
    setTerrainStatus('loading')
    setBuildingsStatus('loading')
  }, [location.id])

  useEffect(() => {
    onStatusChange?.({ terrain: terrainStatus, buildings: buildingsStatus })
  }, [terrainStatus, buildingsStatus, onStatusChange])

  return (
    <>
      <Terrain
        origin={{ lat: location.lat, lon: location.lon }}
        mode={mode}
        onGroundClick={onGroundClick}
        onStatusChange={setTerrainStatus}
        onReady={setOriginHeight}
      />
      {originHeight !== null && (
        <PlateauTiles
          location={location}
          originHeight={originHeight}
          onStatusChange={setBuildingsStatus}
        />
      )}
    </>
  )
}
