'use client'

import { useState, type ReactNode } from 'react'
import {
  alpha,
  Box,
  Collapse,
  IconButton,
  LinearProgress,
  Paper,
  Typography,
} from '@mui/material'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import FlightIcon from '@mui/icons-material/Flight'
import RouteIcon from '@mui/icons-material/Route'
import ScheduleIcon from '@mui/icons-material/Schedule'
import SpeedIcon from '@mui/icons-material/Speed'
import type { FlightState, PlanTotals } from '../engine'
import {
  formatDistance,
  formatDuration,
} from '@/features/flight-plan/components/PlanSummary'

const monoSx = {
  fontFamily: 'var(--font-mono), monospace',
  fontWeight: 700,
  fontVariantNumeric: 'tabular-nums',
} as const

function Readout({
  icon,
  label,
  value,
}: {
  icon: ReactNode
  label: string
  value: string
}) {
  return (
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.4,
          color: 'text.secondary',
          '& svg': { fontSize: 12 },
        }}
      >
        {icon}
        <Typography variant="overline" sx={{ lineHeight: 1.6 }}>
          {label}
        </Typography>
      </Box>
      <Typography sx={{ ...monoSx, fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
        {value}
      </Typography>
    </Box>
  )
}

/**
 * 飛行中のフライト情報パネル（グラスパネル）。
 * シミュレーションエンジンの実単位データ（進捗・速度・残時間）を表示する。
 */
export default function FlightInfoPanel({
  flightState,
  totals,
}: {
  flightState: FlightState | null
  totals: PlanTotals
}) {
  const [expanded, setExpanded] = useState(true)

  if (!flightState) return null

  const remainingSec = Math.max(
    0,
    totals.totalDurationSec - flightState.elapsedSec
  )
  const progressPct = flightState.overallProgress * 100

  return (
    <Box
      sx={{ position: 'absolute', top: 14, right: 14, zIndex: 10, width: 292 }}
    >
      <Paper
        elevation={4}
        sx={{
          p: 1.75,
          bgcolor: (theme) =>
            alpha(theme.palette.background.paper, theme.palette.mode === 'dark' ? 0.78 : 0.82),
          backdropFilter: 'blur(14px) saturate(1.4)',
          borderRadius: 3,
          border: 1,
          borderColor: 'divider',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box
              sx={{
                width: 26,
                height: 26,
                borderRadius: 1.5,
                display: 'grid',
                placeItems: 'center',
                color: '#fff',
                background: 'linear-gradient(135deg, #38bdf8, #0284c7)',
              }}
            >
              <FlightIcon sx={{ fontSize: 16, transform: 'rotate(45deg)' }} />
            </Box>
            <Typography variant="subtitle2">フライト情報</Typography>
          </Box>
          <IconButton
            size="small"
            aria-label={expanded ? 'フライト情報を折りたたむ' : 'フライト情報を展開'}
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? (
              <ExpandLessIcon fontSize="small" />
            ) : (
              <ExpandMoreIcon fontSize="small" />
            )}
          </IconButton>
        </Box>

        <Collapse in={expanded}>
          <Box sx={{ mt: 1.25 }}>
            {/* 全体進捗 */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'space-between',
                mb: 0.5,
              }}
            >
              <Typography sx={{ ...monoSx, fontSize: '1.5rem', lineHeight: 1 }}>
                {progressPct.toFixed(0)}
                <Typography component="span" sx={{ fontSize: '0.8rem', ml: 0.25 }}>
                  %
                </Typography>
              </Typography>
              <Typography
                variant="caption"
                sx={{ ...monoSx, color: 'text.secondary' }}
              >
                WP {flightState.segmentIndex + 1}/{totals.waypointCount}
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={progressPct}
              sx={{ height: 7, mb: 1.5 }}
            />

            <Box sx={{ display: 'flex', gap: 1 }}>
              <Readout
                icon={<SpeedIcon />}
                label="速度"
                value={`${flightState.currentSpeedKmh} km/h`}
              />
              <Readout
                icon={<RouteIcon />}
                label="次まで"
                value={formatDistance(flightState.distanceToNextM)}
              />
              <Readout
                icon={<ScheduleIcon />}
                label="残り"
                value={formatDuration(remainingSec)}
              />
            </Box>

            <Typography
              variant="caption"
              sx={{
                color: 'text.secondary',
                display: 'block',
                mt: 1.25,
                pt: 1,
                borderTop: 1,
                borderColor: 'divider',
              }}
            >
              飛行距離 {formatDistance(flightState.traveledDistanceM)} /{' '}
              {formatDistance(totals.totalDistanceM)}・経過{' '}
              {formatDuration(flightState.elapsedSec)}
            </Typography>
          </Box>
        </Collapse>
      </Paper>
    </Box>
  )
}
