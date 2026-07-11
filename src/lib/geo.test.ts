import { describe, expect, it } from 'vitest'
import {
  decodeGsiDem,
  latLonToLocal,
  latToTileY,
  localToLatLon,
  lonToTileX,
  tileXToLon,
  tileYToLat,
} from './geo'

const TOKYO_STATION = { lat: 35.6812, lon: 139.7671 }

describe('latLonToLocal / localToLatLon', () => {
  it('原点自身はローカル(0,0)', () => {
    const { x, z } = latLonToLocal(TOKYO_STATION, TOKYO_STATION)
    expect(x).toBeCloseTo(0)
    expect(z).toBeCloseTo(0)
  })

  it('北に0.01度は約1112m北（zは南正なので負）', () => {
    const north = { lat: TOKYO_STATION.lat + 0.01, lon: TOKYO_STATION.lon }
    const { x, z } = latLonToLocal(north, TOKYO_STATION)
    expect(x).toBeCloseTo(0)
    expect(z).toBeCloseTo(-1113.2, 0) // ≈ -0.01° × 111.32km
  })

  it('東に0.01度は緯度で縮む（東京では約904m）', () => {
    const east = { lat: TOKYO_STATION.lat, lon: TOKYO_STATION.lon + 0.01 }
    const { x } = latLonToLocal(east, TOKYO_STATION)
    expect(x).toBeCloseTo(1113.2 * Math.cos((35.6812 * Math.PI) / 180), 0)
  })

  it('ラウンドトリップで元の緯度経度に戻る', () => {
    const point = { lat: 35.6984, lon: 139.7731 } // 秋葉原
    const { x, z } = latLonToLocal(point, TOKYO_STATION)
    const back = localToLatLon(x, z, TOKYO_STATION)
    expect(back.lat).toBeCloseTo(point.lat, 8)
    expect(back.lon).toBeCloseTo(point.lon, 8)
  })
})

describe('タイル座標', () => {
  it('経度・緯度とタイル座標のラウンドトリップ', () => {
    const z = 14
    const tx = lonToTileX(TOKYO_STATION.lon, z)
    const ty = latToTileY(TOKYO_STATION.lat, z)
    expect(tileXToLon(tx, z)).toBeCloseTo(TOKYO_STATION.lon, 8)
    expect(tileYToLat(ty, z)).toBeCloseTo(TOKYO_STATION.lat, 8)
  })

  it('東京駅は z14 で既知のタイルに入る（14/14552/6451 付近）', () => {
    expect(Math.floor(lonToTileX(TOKYO_STATION.lon, 14))).toBe(14552)
    expect(Math.floor(latToTileY(TOKYO_STATION.lat, 14))).toBe(6451)
  })

  it('世界の端: 経度-180はタイル0、+180は2^z', () => {
    expect(lonToTileX(-180, 10)).toBe(0)
    expect(lonToTileX(180, 10)).toBe(1024)
  })
})

describe('decodeGsiDem', () => {
  it('正の標高: x * 0.01', () => {
    // x = 1000 → 10m: R=0, G=3, B=232
    expect(decodeGsiDem(0, 3, 232)).toBeCloseTo(10)
  })

  it('ゼロ標高', () => {
    expect(decodeGsiDem(0, 0, 0)).toBe(0)
  })

  it('無効値 2^23 は 0 扱い', () => {
    // 2^23 = 8388608 → R=128, G=0, B=0
    expect(decodeGsiDem(128, 0, 0)).toBe(0)
  })

  it('負の標高: (x - 2^24) * 0.01', () => {
    // x = 2^24 - 100 → -1m: R=255, G=255, B=156
    expect(decodeGsiDem(255, 255, 156)).toBeCloseTo(-1)
  })
})
