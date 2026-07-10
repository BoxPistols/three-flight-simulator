/**
 * 3D都市の静的データ。
 * 1 シーン単位 = 1 メートル。建物の最高高さは 25m。
 */

import { aabbFromBase, type Aabb } from '@/features/simulation/collision'

export interface Building {
  /** 底面中心の位置 [x, z] [m] */
  center: [number, number]
  /** [幅, 高さ, 奥行き] [m] */
  size: [number, number, number]
  color: string
}

// 統一されたグレー系パレット
const HIGH_RISE = ['#475569', '#64748b']
const MID_RISE = ['#6b7280', '#9ca3af']
const LOW_RISE = ['#d1d5db', '#e5e7eb']
const RESIDENTIAL = ['#94a3b8', '#cbd5e1']

export const BUILDINGS: Building[] = [
  // 高層ビル群
  { center: [15, 15], size: [8, 20, 8], color: HIGH_RISE[0] },
  { center: [-15, 15], size: [6, 15, 6], color: HIGH_RISE[1] },
  { center: [15, -15], size: [10, 25, 10], color: HIGH_RISE[0] },
  { center: [-15, -15], size: [7, 18, 7], color: HIGH_RISE[1] },

  // 中層ビル群
  { center: [8, 8], size: [5, 12, 5], color: MID_RISE[0] },
  { center: [-8, 8], size: [4, 10, 4], color: MID_RISE[1] },
  { center: [8, -8], size: [6, 14, 6], color: MID_RISE[0] },
  { center: [-8, -8], size: [5, 11, 5], color: MID_RISE[1] },

  // 低層ビル群
  { center: [25, 0], size: [4, 8, 4], color: LOW_RISE[0] },
  { center: [-25, 0], size: [3, 6, 3], color: LOW_RISE[1] },
  { center: [0, 25], size: [5, 9, 5], color: LOW_RISE[0] },
  { center: [0, -25], size: [4, 7, 4], color: LOW_RISE[1] },

  // 住宅群
  { center: [30, 30], size: [3, 5, 3], color: RESIDENTIAL[0] },
  { center: [-30, 30], size: [2, 4, 2], color: RESIDENTIAL[1] },
  { center: [30, -30], size: [2, 4, 2], color: RESIDENTIAL[0] },
  { center: [-30, -30], size: [3, 5, 3], color: RESIDENTIAL[1] },
]

export const BUILDING_AABBS: Aabb[] = BUILDINGS.map((b) =>
  aabbFromBase(b.center, b.size)
)

export const GROUND_SIZE_M = 200
