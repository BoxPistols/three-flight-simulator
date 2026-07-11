'use client'

import { useEffect, useRef, useState } from 'react'
import { type ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import {
  decodeGsiDem,
  latToTileY,
  localToLatLon,
  lonToTileX,
  type GeoPoint,
} from '@/lib/geo'
import type { SceneMode } from '@/features/viewer/colors'

/** 地形の一辺の半分 [m]（原点中心 3km × 3km） */
export const TERRAIN_HALF_SIZE_M = 1500
/** 空中写真タイルのズームレベル（1タイル ≈ 500m） */
const PHOTO_ZOOM = 16
/** 標高タイルのズームレベル（1タイル ≈ 2km） */
const DEM_ZOOM = 14
/** 地形メッシュの分割数（161×161頂点 ≈ 19m間隔） */
const SEGMENTS = 160
const TILE_PX = 256

const GSI_PHOTO_URL = (z: number, x: number, y: number) =>
  `https://cyberjapandata.gsi.go.jp/xyz/seamlessphoto/${z}/${x}/${y}.jpg`
const GSI_DEM_URL = (z: number, x: number, y: number) =>
  `https://cyberjapandata.gsi.go.jp/xyz/dem_png/${z}/${x}/${y}.png`

export type TerrainStatus = 'loading' | 'ready' | 'error'

interface TileRange {
  minX: number
  maxX: number
  minY: number
  maxY: number
}

/** 原点± half [m] を覆うタイル範囲を計算する */
const tileRangeFor = (origin: GeoPoint, half: number, zoom: number): TileRange => {
  const nw = localToLatLon(-half, -half, origin)
  const se = localToLatLon(half, half, origin)
  return {
    minX: Math.floor(lonToTileX(nw.lon, zoom)),
    maxX: Math.floor(lonToTileX(se.lon, zoom)),
    minY: Math.floor(latToTileY(nw.lat, zoom)),
    maxY: Math.floor(latToTileY(se.lat, zoom)),
  }
}

const loadTileImage = (url: string): Promise<HTMLImageElement | null> =>
  new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = url
  })

/** タイル範囲をひとつのキャンバスに合成する。戻り値は失敗タイル数付き。 */
const composeTiles = async (
  range: TileRange,
  urlFor: (x: number, y: number) => string,
  fallbackFill: string
): Promise<{ canvas: HTMLCanvasElement; failed: number; total: number }> => {
  const nx = range.maxX - range.minX + 1
  const ny = range.maxY - range.minY + 1
  const canvas = document.createElement('canvas')
  canvas.width = nx * TILE_PX
  canvas.height = ny * TILE_PX
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = fallbackFill
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  const jobs: Promise<void>[] = []
  let failed = 0
  for (let ty = range.minY; ty <= range.maxY; ty++) {
    for (let tx = range.minX; tx <= range.maxX; tx++) {
      jobs.push(
        loadTileImage(urlFor(tx, ty)).then((img) => {
          if (img) {
            ctx.drawImage(
              img,
              (tx - range.minX) * TILE_PX,
              (ty - range.minY) * TILE_PX
            )
          } else {
            failed++
          }
        })
      )
    }
  }
  await Promise.all(jobs)
  return { canvas, failed, total: jobs.length }
}

/** DEM合成キャンバスから緯度経度の標高をバイリニア補間で取得する */
const makeHeightSampler = (
  demData: ImageData,
  demRange: TileRange
) => {
  const width = demData.width
  const height = demData.height
  const heightAtPixel = (px: number, py: number): number => {
    const cx = Math.max(0, Math.min(width - 1, px))
    const cy = Math.max(0, Math.min(height - 1, py))
    const i = (cy * width + cx) * 4
    return decodeGsiDem(
      demData.data[i],
      demData.data[i + 1],
      demData.data[i + 2]
    )
  }
  return (point: GeoPoint): number => {
    const fx = (lonToTileX(point.lon, DEM_ZOOM) - demRange.minX) * TILE_PX
    const fy = (latToTileY(point.lat, DEM_ZOOM) - demRange.minY) * TILE_PX
    const x0 = Math.floor(fx)
    const y0 = Math.floor(fy)
    const dx = fx - x0
    const dy = fy - y0
    const h00 = heightAtPixel(x0, y0)
    const h10 = heightAtPixel(x0 + 1, y0)
    const h01 = heightAtPixel(x0, y0 + 1)
    const h11 = heightAtPixel(x0 + 1, y0 + 1)
    return (
      h00 * (1 - dx) * (1 - dy) +
      h10 * dx * (1 - dy) +
      h01 * (1 - dx) * dy +
      h11 * dx * dy
    )
  }
}

interface TerrainData {
  geometry: THREE.BufferGeometry
  texture: THREE.CanvasTexture
  /** 原点の標高 [m]（この高さがシーンの y=0 になる） */
  originHeight: number
}

/**
 * 国土地理院タイルによる実地形。
 * 標高タイル（dem_png）で変位した地形メッシュに空中写真をドレープする。
 * クリックで地表点を通知する（Ground と同じドラッグ判定つき）。
 */
export default function Terrain({
  origin,
  mode,
  onGroundClick,
  onStatusChange,
  onReady,
}: {
  origin: GeoPoint
  mode: SceneMode
  /** 地表クリック（x, z: ローカルm、groundY: 地表の高さ） */
  onGroundClick?: (x: number, z: number, groundY: number) => void
  onStatusChange?: (status: TerrainStatus) => void
  onReady?: (originHeight: number) => void
}) {
  const [data, setData] = useState<TerrainData | null>(null)
  const clickState = useRef({
    isDragging: false,
    downPoint: null as THREE.Vector3 | null,
    downTime: 0,
  })

  useEffect(() => {
    let cancelled = false
    setData(null)
    onStatusChange?.('loading')

    const build = async () => {
      const photoRange = tileRangeFor(origin, TERRAIN_HALF_SIZE_M, PHOTO_ZOOM)
      const demRange = tileRangeFor(origin, TERRAIN_HALF_SIZE_M, DEM_ZOOM)

      const [photo, dem] = await Promise.all([
        composeTiles(photoRange, (x, y) => GSI_PHOTO_URL(PHOTO_ZOOM, x, y), '#2b3950'),
        composeTiles(demRange, (x, y) => GSI_DEM_URL(DEM_ZOOM, x, y), '#000000'),
      ])
      if (cancelled) return

      // 全タイル取得失敗はエラー（ネットワーク遮断・オフライン）
      if (photo.failed >= photo.total && dem.failed >= dem.total) {
        onStatusChange?.('error')
        return
      }

      const demCtx = dem.canvas.getContext('2d')!
      const demData = demCtx.getImageData(0, 0, dem.canvas.width, dem.canvas.height)
      const sampleHeight = makeHeightSampler(demData, demRange)
      const originHeight = sampleHeight(origin)

      // 頂点グリッドを構築（x=東, z=南、y=標高-原点標高）
      const verts = SEGMENTS + 1
      const positions = new Float32Array(verts * verts * 3)
      const uvs = new Float32Array(verts * verts * 2)
      const photoNx = photoRange.maxX - photoRange.minX + 1
      const photoNy = photoRange.maxY - photoRange.minY + 1
      const step = (TERRAIN_HALF_SIZE_M * 2) / SEGMENTS

      for (let iz = 0; iz < verts; iz++) {
        for (let ix = 0; ix < verts; ix++) {
          const x = -TERRAIN_HALF_SIZE_M + ix * step
          const z = -TERRAIN_HALF_SIZE_M + iz * step
          const latLon = localToLatLon(x, z, origin)
          const y = sampleHeight(latLon) - originHeight
          const vi = iz * verts + ix
          positions[vi * 3] = x
          positions[vi * 3 + 1] = y
          positions[vi * 3 + 2] = z
          // UV は頂点の緯度経度をタイル座標に射影して厳密に合わせる
          uvs[vi * 2] =
            (lonToTileX(latLon.lon, PHOTO_ZOOM) - photoRange.minX) / photoNx
          uvs[vi * 2 + 1] =
            1 - (latToTileY(latLon.lat, PHOTO_ZOOM) - photoRange.minY) / photoNy
        }
      }

      const indices: number[] = []
      for (let iz = 0; iz < SEGMENTS; iz++) {
        for (let ix = 0; ix < SEGMENTS; ix++) {
          const a = iz * verts + ix
          const b = a + 1
          const c = a + verts
          const d = c + 1
          indices.push(a, c, b, b, c, d)
        }
      }

      const geometry = new THREE.BufferGeometry()
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
      geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2))
      geometry.setIndex(indices)
      geometry.computeVertexNormals()

      const texture = new THREE.CanvasTexture(photo.canvas)
      texture.colorSpace = THREE.SRGBColorSpace
      texture.anisotropy = 4

      if (cancelled) {
        geometry.dispose()
        texture.dispose()
        return
      }
      setData({ geometry, texture, originHeight })
      onStatusChange?.('ready')
      onReady?.(originHeight)
    }

    build()
    return () => {
      cancelled = true
    }
    // onStatusChange / onReady は安定参照前提（page 側で useCallback）
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [origin.lat, origin.lon])

  // アンマウント時にGPUリソースを解放
  useEffect(() => {
    return () => {
      data?.geometry.dispose()
      data?.texture.dispose()
    }
  }, [data])

  if (!data) return null

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    clickState.current.isDragging = false
    clickState.current.downPoint = e.point.clone()
    clickState.current.downTime = Date.now()
  }
  const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
    if (
      clickState.current.downPoint &&
      e.point.distanceTo(clickState.current.downPoint) > 8
    ) {
      clickState.current.isDragging = true
    }
  }
  const handlePointerUp = (e: ThreeEvent<PointerEvent>) => {
    const duration = Date.now() - clickState.current.downTime
    if (!clickState.current.isDragging && duration < 500) {
      onGroundClick?.(e.point.x, e.point.z, e.point.y)
    }
    clickState.current.isDragging = false
    clickState.current.downPoint = null
  }

  return (
    <mesh
      geometry={data.geometry}
      onPointerDown={onGroundClick ? handlePointerDown : undefined}
      onPointerMove={onGroundClick ? handlePointerMove : undefined}
      onPointerUp={onGroundClick ? handlePointerUp : undefined}
    >
      <meshStandardMaterial
        map={data.texture}
        color={mode === 'night' ? '#8093b8' : '#ffffff'}
        roughness={0.95}
        metalness={0}
      />
    </mesh>
  )
}
