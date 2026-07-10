'use client'

import { useMemo } from 'react'
import { Alert, Box, Chip, Paper, Tooltip, Typography } from '@mui/material'
import RouteIcon from '@mui/icons-material/Route'
import ScheduleIcon from '@mui/icons-material/Schedule'
import HeightIcon from '@mui/icons-material/Height'
import { planTotals } from '@/features/simulation/engine'
import type { Waypoint } from '../model'

export const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.round(seconds % 60)
  return mins > 0 ? `${mins}分${secs}秒` : `${secs}秒`
}

export const formatDistance = (meters: number): string =>
  meters >= 1000 ? `${(meters / 1000).toFixed(2)} km` : `${Math.round(meters)} m`

/** 飛行前に総距離・予想時間・高度範囲・衝突警告を確認できるサマリー */
export default function PlanSummary({
  waypoints,
  collidingSegments,
}: {
  waypoints: Waypoint[]
  collidingSegments: Set<number>
}) {
  const totals = useMemo(() => planTotals(waypoints), [waypoints])

  if (waypoints.length < 2) return null

  return (
    <Paper
      variant="outlined"
      sx={{ p: 1.5, borderRadius: 2, bgcolor: 'action.hover' }}
    >
      <Typography
        variant="caption"
        sx={{ fontWeight: 700, display: 'block', mb: 1, color: 'text.primary' }}
      >
        プランサマリー
      </Typography>
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <Tooltip title="総飛行距離" arrow>
          <Chip
            icon={<RouteIcon sx={{ fontSize: 14 }} />}
            label={formatDistance(totals.totalDistanceM)}
            size="small"
            sx={{ fontSize: '0.7rem' }}
          />
        </Tooltip>
        <Tooltip title="設定速度に基づく予想飛行時間" arrow>
          <Chip
            icon={<ScheduleIcon sx={{ fontSize: 14 }} />}
            label={formatDuration(totals.totalDurationSec)}
            size="small"
            sx={{ fontSize: '0.7rem' }}
          />
        </Tooltip>
        <Tooltip title="高度範囲" arrow>
          <Chip
            icon={<HeightIcon sx={{ fontSize: 14 }} />}
            label={`${totals.minAltitudeM}〜${totals.maxAltitudeM} m`}
            size="small"
            sx={{ fontSize: '0.7rem' }}
          />
        </Tooltip>
      </Box>
      {collidingSegments.size > 0 && (
        <Alert severity="warning" sx={{ mt: 1, py: 0, fontSize: '0.75rem' }}>
          {collidingSegments.size}
          区間が建物と交差しています（3D画面の赤い経路）。高度または位置を調整してください。
        </Alert>
      )}
    </Paper>
  )
}
