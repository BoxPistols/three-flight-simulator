/**
 * 地理座標の計算ユーティリティ（純関数）。
 *
 * シーン座標系: 原点 = 選択ロケーションの中心、1単位 = 1m、
 * +X = 東、+Z = 南（three.js の -Z 前方 = 北に対応）。
 * 数km範囲を想定した原点基準の等距離近似を使う。
 */

export interface GeoPoint {
  /** 緯度 [度] */
  lat: number
  /** 経度 [度] */
  lon: number
}

/** WGS84 準拠球体半径 [m]（Webメルカトルと同一） */
export const EARTH_RADIUS_M = 6378137

const DEG2RAD = Math.PI / 180
const RAD2DEG = 180 / Math.PI

/** 緯度経度 → 原点基準のローカル座標 [m]（x=東, z=南） */
export const latLonToLocal = (
  point: GeoPoint,
  origin: GeoPoint
): { x: number; z: number } => ({
  x:
    (point.lon - origin.lon) *
    DEG2RAD *
    EARTH_RADIUS_M *
    Math.cos(origin.lat * DEG2RAD),
  z: (origin.lat - point.lat) * DEG2RAD * EARTH_RADIUS_M,
})

/** 原点基準のローカル座標 [m] → 緯度経度 */
export const localToLatLon = (
  x: number,
  z: number,
  origin: GeoPoint
): GeoPoint => ({
  lat: origin.lat - (z / EARTH_RADIUS_M) * RAD2DEG,
  lon:
    origin.lon +
    (x / (EARTH_RADIUS_M * Math.cos(origin.lat * DEG2RAD))) * RAD2DEG,
})

/** 経度 → Webメルカトルのタイル X 座標（小数、z: ズームレベル） */
export const lonToTileX = (lon: number, z: number): number =>
  ((lon + 180) / 360) * 2 ** z

/** 緯度 → Webメルカトルのタイル Y 座標（小数、z: ズームレベル） */
export const latToTileY = (lat: number, z: number): number => {
  const latRad = lat * DEG2RAD
  return ((1 - Math.asinh(Math.tan(latRad)) / Math.PI) / 2) * 2 ** z
}

/** タイル X 座標 → 経度 */
export const tileXToLon = (x: number, z: number): number =>
  (x / 2 ** z) * 360 - 180

/** タイル Y 座標 → 緯度 */
export const tileYToLat = (y: number, z: number): number => {
  const n = Math.PI - (2 * Math.PI * y) / 2 ** z
  return Math.atan(Math.sinh(n)) * RAD2DEG
}

/**
 * 地理院標高タイル（dem_png）のピクセル値から標高 [m] をデコードする。
 * 仕様: x = R*2^16 + G*2^8 + B、
 *   x < 2^23  → h = x * 0.01
 *   x = 2^23  → 無効値（水面など）→ 0 とみなす
 *   x > 2^23  → h = (x - 2^24) * 0.01
 */
export const decodeGsiDem = (r: number, g: number, b: number): number => {
  const x = r * 65536 + g * 256 + b
  if (x === 8388608) return 0
  return x < 8388608 ? x * 0.01 : (x - 16777216) * 0.01
}
