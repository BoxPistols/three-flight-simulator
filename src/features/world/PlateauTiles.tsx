'use client'

import { useEffect, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { TilesRenderer } from '3d-tiles-renderer'
import { GLTFExtensionsPlugin, ReorientationPlugin } from '3d-tiles-renderer/plugins'
import { DRACOLoader } from 'three-stdlib'
import * as THREE from 'three'
import type { RealLocation } from './locations'

export type TilesStatus = 'loading' | 'ready' | 'error'

/**
 * Project PLATEAU の建築物モデル（3D Tiles）を読み込むレイヤー。
 * ReorientationPlugin でロケーション中心をシーン原点（Y-up）に配置し、
 * 楕円体高とジオイド高の差 + 原点標高で高さを合わせる。
 */
export default function PlateauTiles({
  location,
  originHeight,
  onStatusChange,
}: {
  location: RealLocation
  /** 地形の原点標高 [m]（Terrain が算出、シーン y=0 に対応） */
  originHeight: number
  onStatusChange?: (status: TilesStatus) => void
}) {
  const { camera, gl } = useThree()

  const tiles = useMemo(() => {
    const renderer = new TilesRenderer(location.tilesetUrl)
    const dracoLoader = new DRACOLoader()
    dracoLoader.setDecoderPath('/draco/')
    renderer.registerPlugin(
      new GLTFExtensionsPlugin({
        dracoLoader: dracoLoader as never,
      })
    )
    renderer.registerPlugin(
      new ReorientationPlugin({
        lat: (location.lat * Math.PI) / 180,
        lon: (location.lon * Math.PI) / 180,
        // 3D Tiles は楕円体高基準のため、ジオイド高+原点標高だけ持ち上げた点を
        // 原点に合わせることで、地物の足元が地形（y≈0）に揃う
        height: location.geoidHeight + originHeight,
        recenter: true,
      })
    )
    renderer.errorTarget = 16
    renderer.fetchOptions = { mode: 'cors' }
    return renderer
  }, [location.tilesetUrl, location.lat, location.lon, location.geoidHeight, originHeight])

  useEffect(() => {
    let errored = false
    onStatusChange?.('loading')
    const handleLoaded = () => {
      if (!errored) onStatusChange?.('ready')
    }
    const handleError = () => {
      errored = true
      onStatusChange?.('error')
    }
    tiles.addEventListener('load-tileset', handleLoaded)
    tiles.addEventListener('load-error', handleError)

    tiles.setCamera(camera)
    tiles.setResolutionFromRenderer(camera, gl)

    return () => {
      tiles.removeEventListener('load-tileset', handleLoaded)
      tiles.removeEventListener('load-error', handleError)
      tiles.dispose()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tiles])

  useFrame(() => {
    tiles.setCamera(camera)
    tiles.setResolutionFromRenderer(camera, gl)
    camera.updateMatrixWorld()
    tiles.update()
  })

  return <primitive object={tiles.group as THREE.Object3D} />
}
