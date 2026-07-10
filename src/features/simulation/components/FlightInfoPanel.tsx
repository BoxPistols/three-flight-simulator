'use client'

import { useState } from 'react'
import {
  Box,
  Chip,
  Collapse,
  Divider,
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

/**
 * 飛行中のフライト情報パネル。
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

  const remainingSec = Math.max(0, totals.totalDurationSec - flightState.elapsedSec)

  return (
    <Box
      sx={{
        position: 'absolute',
        top: 12,
        right: 12,
        zIndex: 10,
        width: 280,
      }}
    >
      <Paper
        elevation={4}
        sx={{
          p: 1.5,
          bgcolor: (theme) =>
            theme.palette.mode === 'dark'
              ? 'rgba(15, 23, 42, 0.9)'
              : 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(10px)',
          borderRadius: 2,
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
            <FlightIcon sx={{ fontSize: 18, color: 'primary.main' }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              フライト情報
            </Typography>
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
          <Box sx={{ mt: 1 }}>
            {/* 全体進捗 */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                進捗 {(flightState.overallProgress * 100).toFixed(0)}%
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                WP {flightState.segmentIndex + 1} / {totals.waypointCount}
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={flightState.overallProgress * 100}
              sx={{ height: 6, borderRadius: 3, mb: 1.5 }}
            />

            <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
              <Chip
                icon={<SpeedIcon sx={{ fontSize: 14 }} />}
                label={`${flightState.currentSpeedKmh} km/h`}
                size="small"
                sx={{ fontSize: '0.7rem' }}
              />
              <Chip
                icon={<RouteIcon sx={{ fontSize: 14 }} />}
                label={`次まで ${formatDistance(flightState.distanceToNextM)}`}
                size="small"
                variant="outlined"
                sx={{ fontSize: '0.7rem' }}
              />
              <Chip
                icon={<ScheduleIcon sx={{ fontSize: 14 }} />}
                label={`残り ${formatDuration(remainingSec)}`}
                size="small"
                variant="outlined"
                sx={{ fontSize: '0.7rem' }}
              />
            </Box>

            <Divider sx={{ my: 1 }} />

            <Typography
              variant="caption"
              sx={{ color: 'text.secondary', display: 'block' }}
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
