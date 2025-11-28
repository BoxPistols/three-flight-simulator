'use client'

import { useState } from 'react'
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Tooltip,
  Collapse,
  Chip,
  Divider,
} from '@mui/material'
import BugReportIcon from '@mui/icons-material/BugReport'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import SpeedIcon from '@mui/icons-material/Speed'
import PlaceIcon from '@mui/icons-material/Place'
import HeightIcon from '@mui/icons-material/Height'
import RotateRightIcon from '@mui/icons-material/RotateRight'
import RouteIcon from '@mui/icons-material/Route'
import FlightIcon from '@mui/icons-material/Flight'

export interface FlightDebugData {
  // ドローン位置
  dronePosition: { x: number; y: number; z: number }
  // ドローン回転
  droneRotation: { x: number; y: number; z: number }
  // 現在のウェイポイントインデックス
  currentWaypointIndex: number
  // 総ウェイポイント数
  totalWaypoints: number
  // 現在の速度 (km/h)
  currentSpeed: number
  // セグメント進捗 (0-1)
  segmentProgress: number
  // フライト進捗 (0-100%)
  overallProgress: number
  // 次のウェイポイントまでの距離
  distanceToNext: number
  // 飛行時間 (秒)
  flightTime: number
}

interface DebugPanelProps {
  isFlying: boolean
  debugData: FlightDebugData | null
  visible?: boolean
}

export default function DebugPanel({ isFlying, debugData, visible = true }: DebugPanelProps) {
  const [expanded, setExpanded] = useState(true)
  const [panelVisible, setPanelVisible] = useState(true)

  if (!visible) return null

  const formatNumber = (num: number, decimals: number = 2) => {
    return num.toFixed(decimals)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 70,
        right: 16,
        zIndex: 1000,
        maxWidth: 320,
      }}
    >
      {/* トグルボタン */}
      <Tooltip title={panelVisible ? "デバッグパネルを隠す" : "デバッグパネルを表示"} arrow>
        <IconButton
          onClick={() => setPanelVisible(!panelVisible)}
          size="small"
          sx={{
            position: 'absolute',
            top: 0,
            right: 0,
            bgcolor: 'background.paper',
            boxShadow: 2,
            '&:hover': {
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
            },
          }}
        >
          <BugReportIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <Collapse in={panelVisible}>
        <Paper
          elevation={4}
          sx={{
            mt: 5,
            p: 2,
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
          {/* ヘッダー */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <BugReportIcon sx={{ fontSize: 18, color: 'primary.main' }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                Debug Mode
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip
                label={isFlying ? 'FLYING' : 'IDLE'}
                size="small"
                color={isFlying ? 'success' : 'default'}
                sx={{ fontSize: '0.65rem', height: 20 }}
              />
              <IconButton size="small" onClick={() => setExpanded(!expanded)}>
                {expanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
              </IconButton>
            </Box>
          </Box>

          <Collapse in={expanded}>
            {!isFlying || !debugData ? (
              <Box sx={{ py: 2, textAlign: 'center' }}>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  フライト開始でデータが表示されます
                </Typography>
              </Box>
            ) : (
              <Box sx={{ '& > *': { mb: 1.5 } }}>
                {/* フライト進捗 */}
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                    <FlightIcon sx={{ fontSize: 14 }} />
                    Flight Progress
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Chip
                      label={`${formatNumber(debugData.overallProgress, 1)}%`}
                      size="small"
                      color="primary"
                      sx={{ fontSize: '0.7rem' }}
                    />
                    <Chip
                      label={`WP ${debugData.currentWaypointIndex + 1}/${debugData.totalWaypoints}`}
                      size="small"
                      variant="outlined"
                      sx={{ fontSize: '0.7rem' }}
                    />
                    <Chip
                      label={formatTime(debugData.flightTime)}
                      size="small"
                      variant="outlined"
                      sx={{ fontSize: '0.7rem' }}
                    />
                  </Box>
                </Box>

                <Divider />

                {/* ドローン位置 */}
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                    <PlaceIcon sx={{ fontSize: 14 }} />
                    Drone Position
                  </Typography>
                  <Box sx={{ fontFamily: 'monospace', fontSize: '0.75rem', bgcolor: 'action.hover', p: 1, borderRadius: 1 }}>
                    <Box>X: {formatNumber(debugData.dronePosition.x)}</Box>
                    <Box>Y: {formatNumber(debugData.dronePosition.y)}</Box>
                    <Box>Z: {formatNumber(debugData.dronePosition.z)}</Box>
                  </Box>
                </Box>

                {/* ドローン回転 */}
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                    <RotateRightIcon sx={{ fontSize: 14 }} />
                    Drone Rotation (deg)
                  </Typography>
                  <Box sx={{ fontFamily: 'monospace', fontSize: '0.75rem', bgcolor: 'action.hover', p: 1, borderRadius: 1 }}>
                    <Box>Pitch: {formatNumber((debugData.droneRotation.x * 180) / Math.PI)}</Box>
                    <Box>Yaw: {formatNumber((debugData.droneRotation.y * 180) / Math.PI)}</Box>
                    <Box>Roll: {formatNumber((debugData.droneRotation.z * 180) / Math.PI)}</Box>
                  </Box>
                </Box>

                <Divider />

                {/* 速度・距離情報 */}
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                    <SpeedIcon sx={{ fontSize: 14 }} />
                    Speed & Distance
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Chip
                      icon={<SpeedIcon sx={{ fontSize: 14 }} />}
                      label={`${formatNumber(debugData.currentSpeed, 1)} km/h`}
                      size="small"
                      sx={{ fontSize: '0.7rem' }}
                    />
                    <Chip
                      icon={<RouteIcon sx={{ fontSize: 14 }} />}
                      label={`${formatNumber(debugData.distanceToNext, 1)}m to next`}
                      size="small"
                      variant="outlined"
                      sx={{ fontSize: '0.7rem' }}
                    />
                  </Box>
                </Box>

                {/* セグメント進捗バー */}
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                    <HeightIcon sx={{ fontSize: 14 }} />
                    Segment Progress
                  </Typography>
                  <Box sx={{
                    height: 6,
                    bgcolor: 'action.hover',
                    borderRadius: 3,
                    overflow: 'hidden'
                  }}>
                    <Box
                      sx={{
                        height: '100%',
                        width: `${debugData.segmentProgress * 100}%`,
                        bgcolor: 'primary.main',
                        borderRadius: 3,
                        transition: 'width 0.1s ease',
                      }}
                    />
                  </Box>
                </Box>
              </Box>
            )}
          </Collapse>
        </Paper>
      </Collapse>
    </Box>
  )
}
