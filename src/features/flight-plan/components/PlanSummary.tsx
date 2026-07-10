'use client'

import { useMemo, type ReactNode } from 'react'
import { alpha, Alert, Box, Paper, Typography } from '@mui/material'
import RouteIcon from '@mui/icons-material/Route'
import ScheduleIcon from '@mui/icons-material/Schedule'
import HeightIcon from '@mui/icons-material/Height'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import { planTotals } from '@/features/simulation/engine'
import type { Waypoint } from '../model'

export const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.round(seconds % 60)
  return mins > 0 ? `${mins}分${secs}秒` : `${secs}秒`
}

export const formatDistance = (meters: number): string =>
  meters >= 1000 ? `${(meters / 1000).toFixed(2)} km` : `${Math.round(meters)} m`

function StatTile({
  icon,
  label,
  value,
}: {
  icon: ReactNode
  label: string
  value: string
}) {
  return (
    <Paper
      variant="outlined"
      sx={{
        flex: 1,
        minWidth: 0,
        p: 1.25,
        borderRadius: 2.5,
        display: 'flex',
        flexDirection: 'column',
        gap: 0.25,
        bgcolor: (theme) => alpha(theme.palette.primary.main, 0.04),
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          color: 'text.secondary',
          '& svg': { fontSize: 13 },
        }}
      >
        {icon}
        <Typography variant="overline" sx={{ lineHeight: 1.4 }}>
          {label}
        </Typography>
      </Box>
      <Typography
        sx={{
          fontFamily: 'var(--font-mono), monospace',
          fontWeight: 700,
          fontSize: '0.92rem',
          letterSpacing: '-0.01em',
          whiteSpace: 'nowrap',
        }}
      >
        {value}
      </Typography>
    </Paper>
  )
}

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
    <Box>
      <Typography
        variant="overline"
        sx={{ color: 'text.secondary', display: 'block', mb: 0.75 }}
      >
        プランサマリー
      </Typography>
      <Box sx={{ display: 'flex', gap: 1 }}>
        <StatTile
          icon={<RouteIcon />}
          label="総距離"
          value={formatDistance(totals.totalDistanceM)}
        />
        <StatTile
          icon={<ScheduleIcon />}
          label="予想時間"
          value={formatDuration(totals.totalDurationSec)}
        />
        <StatTile
          icon={<HeightIcon />}
          label="高度"
          value={`${totals.minAltitudeM}-${totals.maxAltitudeM}m`}
        />
      </Box>
      {collidingSegments.size > 0 && (
        <Alert
          severity="warning"
          icon={<WarningAmberIcon fontSize="small" />}
          sx={{ mt: 1, py: 0.25, fontSize: '0.75rem', alignItems: 'center' }}
        >
          {collidingSegments.size}
          区間が建物と交差（3D画面の赤い点滅経路）。高度か位置を調整してください。
        </Alert>
      )}
    </Box>
  )
}
