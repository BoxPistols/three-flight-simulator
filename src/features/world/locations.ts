/**
 * 実在都市モードのロケーション定義。
 *
 * 建物モデルは 国土交通省 Project PLATEAU の 3D Tiles 配信
 * （https://github.com/Project-PLATEAU/plateau-streaming-tutorial）を利用する。
 * プリセットは配信URLを検証済みの千代田区（東京駅・丸の内・秋葉原・皇居を含む）。
 * その他の都市は PLATEAU のデータカタログから tileset.json URL を取得して
 * カスタム地点として追加できる。
 */

export interface RealLocation {
  id: string
  name: string
  /** 中心（シーン原点）の緯度 [度] */
  lat: number
  /** 中心（シーン原点）の経度 [度] */
  lon: number
  /** PLATEAU 建築物モデル 3D Tiles の tileset.json URL */
  tilesetUrl: string
  /**
   * ジオイド高 [m]。PLATEAU 3D Tiles は楕円体高で配置されるため、
   * 標高（ジオイド基準）との差をこの値で補正する。関東は約36.7m。
   */
  geoidHeight: number
  /** ユーザーが追加したカスタム地点か */
  custom?: boolean
}

/** 千代田区 建築物モデル LOD1（PLATEAU 2023・配信URL検証済み） */
const CHIYODA_BLDG_LOD1 =
  'https://assets.cms.plateau.reearth.io/assets/0e/e5948a-e95c-4e31-be85-1f8c066ed996/13101_chiyoda-ku_pref_2023_citygml_1_op_bldg_3dtiles_13101_chiyoda-ku_lod1/tileset.json'

/** 関東平野の概算ジオイド高 [m] */
const GEOID_KANTO = 36.7

export const PRESET_LOCATIONS: RealLocation[] = [
  {
    id: 'tokyo-station',
    name: '東京駅・丸の内',
    lat: 35.6812,
    lon: 139.7671,
    tilesetUrl: CHIYODA_BLDG_LOD1,
    geoidHeight: GEOID_KANTO,
  },
  {
    id: 'akihabara',
    name: '秋葉原',
    lat: 35.69837,
    lon: 139.77313,
    tilesetUrl: CHIYODA_BLDG_LOD1,
    geoidHeight: GEOID_KANTO,
  },
  {
    id: 'imperial-palace',
    name: '皇居・大手町',
    lat: 35.6852,
    lon: 139.7528,
    tilesetUrl: CHIYODA_BLDG_LOD1,
    geoidHeight: GEOID_KANTO,
  },
]

export const DEFAULT_LOCATION_ID = PRESET_LOCATIONS[0].id

/** 日本国内のジオイド高の目安（カスタム地点のデフォルト値） */
export const DEFAULT_GEOID_HEIGHT = 37
