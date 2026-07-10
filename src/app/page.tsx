'use client'

import dynamic from 'next/dynamic'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Paper,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
  Drawer,
} from '@mui/material'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import DragHandleIcon from '@mui/icons-material/DragHandle'
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff'
import MenuIcon from '@mui/icons-material/Menu'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch'
import StopIcon from '@mui/icons-material/Stop'
import TouchAppIcon from '@mui/icons-material/TouchApp'
import PlanIO from '@/features/flight-plan/components/PlanIO'
import PlanSummary from '@/features/flight-plan/components/PlanSummary'
import WaypointEditor from '@/features/flight-plan/components/WaypointEditor'
import { useFlightPlanStore } from '@/features/flight-plan/store'
import FlightInfoPanel from '@/features/simulation/components/FlightInfoPanel'
import { findCollidingSegments } from '@/features/simulation/collision'
import { planTotals, type FlightState } from '@/features/simulation/engine'
import {
  CAMERA_MODE_LABELS,
  type CameraMode,
} from '@/features/viewer/CameraRig'
import { BUILDING_AABBS } from '@/features/viewer/city'
import ThemeToggle from '@/components/ThemeToggle'

const Scene = dynamic(() => import('@/features/viewer/Scene'), {
  ssr: false,
  loading: () => (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'action.hover',
      }}
    >
      <Typography>3Dシーンをロード中...</Typography>
    </Box>
  ),
})

const STORAGE_KEY_VISITED = 'flightSimulator_hasVisited'

const MIN_DRAWER_WIDTH = 280
const MAX_DRAWER_WIDTH = 520
const DEFAULT_DRAWER_WIDTH = 340

export default function Home() {
  const waypoints = useFlightPlanStore((s) => s.waypoints)
  const selectedId = useFlightPlanStore((s) => s.selectedId)
  const clickAltitude = useFlightPlanStore((s) => s.clickAltitude)
  const addWaypoint = useFlightPlanStore((s) => s.addWaypoint)
  const insertAfterSegment = useFlightPlanStore((s) => s.insertAfterSegment)
  const selectWaypoint = useFlightPlanStore((s) => s.selectWaypoint)
  const removeWaypoint = useFlightPlanStore((s) => s.removeWaypoint)
  const loadSample = useFlightPlanStore((s) => s.loadSample)

  const [mounted, setMounted] = useState(false)
  const [isFlying, setIsFlying] = useState(false)
  const [flightState, setFlightState] = useState<FlightState | null>(null)
  const [cameraMode, setCameraMode] = useState<CameraMode>('follow')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerWidth, setDrawerWidth] = useState(DEFAULT_DRAWER_WIDTH)
  const [isResizing, setIsResizing] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)

  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  const collidingSegments = useMemo(
    () => findCollidingSegments(waypoints, BUILDING_AABBS),
    [waypoints]
  )
  const totals = useMemo(() => planTotals(waypoints), [waypoints])

  // ---- 初期化 ----
  useEffect(() => {
    setMounted(true)
    if (!localStorage.getItem(STORAGE_KEY_VISITED)) {
      setShowOnboarding(true)
    }
  }, [])

  useEffect(() => {
    if (mounted) setDrawerOpen(!isMobile)
  }, [mounted, isMobile])

  // ---- サイドバーのリサイズ ----
  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)
  }, [])

  useEffect(() => {
    if (!isResizing) return
    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = e.clientX
      if (newWidth >= MIN_DRAWER_WIDTH && newWidth <= MAX_DRAWER_WIDTH) {
        setDrawerWidth(newWidth)
      }
    }
    const handleMouseUp = () => setIsResizing(false)
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [isResizing])

  // ---- フライト制御 ----
  const canFly = waypoints.length >= 2

  const handleStartFlight = useCallback(() => {
    if (!canFly) return
    selectWaypoint(null)
    setFlightState(null)
    setIsFlying(true)
  }, [canFly, selectWaypoint])

  const handleStopFlight = useCallback(() => {
    setIsFlying(false)
    setFlightState(null)
  }, [])

  const handleFlightComplete = useCallback(() => {
    setIsFlying(false)
    setFlightState(null)
  }, [])

  // ---- キーボードショートカット ----
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return
      }
      if (e.code === 'Space') {
        e.preventDefault()
        if (isFlying) handleStopFlight()
        else handleStartFlight()
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && !isFlying && selectedId) {
        removeWaypoint(selectedId)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isFlying, selectedId, handleStartFlight, handleStopFlight, removeWaypoint])

  // ---- 3Dシーンからのイベント ----
  const handleGroundClick = useCallback(
    (x: number, z: number) => {
      addWaypoint({ x: Math.round(x * 10) / 10, z: Math.round(z * 10) / 10, altitude: clickAltitude })
    },
    [addWaypoint, clickAltitude]
  )

  const handleSegmentClick = useCallback(
    (segmentIndex: number, point: [number, number, number]) => {
      insertAfterSegment(segmentIndex, {
        x: Math.round(point[0] * 10) / 10,
        z: Math.round(point[2] * 10) / 10,
        altitude: Math.round(point[1]),
      })
    },
    [insertAfterSegment]
  )

  const handleOnboardingClose = (loadSamplePlan: boolean) => {
    setShowOnboarding(false)
    localStorage.setItem(STORAGE_KEY_VISITED, 'true')
    if (loadSamplePlan) loadSample()
  }

  if (!mounted) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.default',
        }}
      >
        <Typography>アプリケーションを読み込み中...</Typography>
      </Box>
    )
  }

  const drawerContent = (
    <Box sx={{ display: 'flex', height: '100%' }}>
      <Box
        sx={{
          flex: 1,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: 1.5,
          p: 2,
          overflow: 'auto',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <FlightTakeoffIcon sx={{ fontSize: 26, color: 'primary.main' }} />
            <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
              フライトプラン
            </Typography>
          </Box>
          <Tooltip title="パネルを閉じる" arrow>
            <IconButton
              onClick={() => setDrawerOpen(false)}
              size="small"
              aria-label="パネルを閉じる"
            >
              <ChevronLeftIcon />
            </IconButton>
          </Tooltip>
        </Box>

        <Divider />

        <WaypointEditor disabled={isFlying} />

        <PlanSummary waypoints={waypoints} collidingSegments={collidingSegments} />

        <PlanIO disabled={isFlying} />

        <Box sx={{ mt: 'auto', pt: 1 }}>
          {isFlying ? (
            <Tooltip title="飛行を停止してプラン編集に戻る（Space）" arrow>
              <Button
                variant="contained"
                color="error"
                onClick={handleStopFlight}
                fullWidth
                size="large"
                startIcon={<StopIcon />}
                sx={{ py: 1.5 }}
              >
                停止
              </Button>
            </Tooltip>
          ) : (
            <Tooltip
              title={
                canFly
                  ? '設定した速度どおりにプランをプレビュー飛行（Space）'
                  : 'フライトには2つ以上のウェイポイントが必要です'
              }
              arrow
            >
              <span style={{ width: '100%', display: 'block' }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleStartFlight}
                  disabled={!canFly}
                  fullWidth
                  size="large"
                  startIcon={<PlayArrowIcon />}
                  sx={{ py: 1.5 }}
                >
                  フライト開始
                  {canFly && (
                    <Chip
                      label={waypoints.length}
                      size="small"
                      sx={{
                        ml: 1,
                        height: 20,
                        fontSize: '0.75rem',
                        bgcolor: 'rgba(255, 255, 255, 0.2)',
                        color: 'inherit',
                        fontWeight: 700,
                      }}
                    />
                  )}
                </Button>
              </span>
            </Tooltip>
          )}

          <Paper
            variant="outlined"
            sx={{ mt: 1.5, p: 1.5, bgcolor: 'action.hover', borderRadius: 2 }}
          >
            <Typography
              variant="caption"
              sx={{ fontWeight: 700, display: 'block', mb: 0.5 }}
            >
              💡 操作ガイド
            </Typography>
            <Box
              component="ul"
              sx={{
                pl: 2.5,
                m: 0,
                '& li': {
                  fontSize: '0.72rem',
                  mb: 0.5,
                  color: 'text.secondary',
                  lineHeight: 1.5,
                },
              }}
            >
              <li>地面クリック: ウェイポイント追加</li>
              <li>経路クリック: 途中に挿入</li>
              <li>マーカークリック: 選択（編集・削除は一覧から）</li>
              <li>Space: フライト開始/停止・Delete: 選択を削除</li>
              <li>ドラッグ: 視点回転・ホイール: ズーム</li>
            </Box>
          </Paper>
        </Box>
      </Box>

      {/* リサイズハンドル（デスクトップのみ） */}
      {!isMobile && (
        <Tooltip title="ドラッグで幅を調整" placement="right" arrow>
          <Box
            onMouseDown={handleResizeStart}
            sx={{
              width: 8,
              height: '100%',
              cursor: 'col-resize',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: isResizing ? 'primary.main' : 'transparent',
              transition: 'background-color 0.2s',
              '&:hover': { bgcolor: 'action.hover' },
            }}
          >
            <DragHandleIcon
              sx={{
                transform: 'rotate(90deg)',
                fontSize: 16,
                color: 'text.secondary',
                opacity: 0.7,
              }}
            />
          </Box>
        </Tooltip>
      )}
    </Box>
  )

  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        bgcolor: 'background.default',
        overflow: 'hidden',
      }}
    >
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        variant={isMobile ? 'temporary' : 'persistent'}
        ModalProps={{ keepMounted: true }}
        sx={{
          width: drawerOpen ? drawerWidth : 0,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: drawerWidth,
            position: isMobile ? 'fixed' : 'relative',
            overflow: 'visible',
          },
        }}
      >
        {drawerContent}
      </Drawer>

      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* ヘッダー */}
        <Paper
          elevation={1}
          sx={{
            height: 56,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            px: { xs: 1.5, md: 2.5 },
            borderRadius: 0,
            borderBottom: 1,
            borderColor: 'divider',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Tooltip title={drawerOpen ? 'パネルを閉じる' : 'フライトプランパネルを開く'} arrow>
              <IconButton
                onClick={() => setDrawerOpen(!drawerOpen)}
                edge="start"
                aria-label="フライトプランパネルの開閉"
                sx={{ color: 'primary.main' }}
              >
                <MenuIcon />
              </IconButton>
            </Tooltip>
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: 700,
                letterSpacing: '-0.02em',
                fontSize: { xs: '0.9rem', md: '1rem' },
              }}
            >
              ドローン フライトプランナー
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, md: 1.5 } }}>
            <Tooltip title={isFlying ? 'プレビュー飛行中' : '編集モード'} arrow>
              <Chip
                label={isFlying ? '飛行中' : '編集中'}
                color={isFlying ? 'success' : 'default'}
                size="small"
                sx={{
                  fontWeight: 600,
                  height: 28,
                  display: { xs: 'none', sm: 'flex' },
                  animation: isFlying ? 'pulse 2s ease-in-out infinite' : 'none',
                  '@keyframes pulse': {
                    '0%, 100%': { opacity: 1 },
                    '50%': { opacity: 0.7 },
                  },
                }}
              />
            </Tooltip>
            <Tooltip
              title={`ウェイポイント数: ${waypoints.length}（2個以上で飛行可能）`}
              arrow
            >
              <Chip
                label={`${waypoints.length} WP`}
                size="small"
                variant="outlined"
                sx={{
                  fontWeight: 600,
                  height: 28,
                  borderColor: canFly ? 'primary.main' : 'divider',
                  color: canFly ? 'primary.main' : 'text.secondary',
                }}
              />
            </Tooltip>
            <Divider
              orientation="vertical"
              flexItem
              sx={{ display: { xs: 'none', sm: 'block' } }}
            />
            <Tooltip title="飛行中のカメラ視点" arrow>
              <ToggleButtonGroup
                value={cameraMode}
                exclusive
                size="small"
                onChange={(_, value: CameraMode | null) => {
                  if (value) setCameraMode(value)
                }}
                aria-label="カメラ視点"
                sx={{ height: 28, display: { xs: 'none', sm: 'flex' } }}
              >
                {(Object.keys(CAMERA_MODE_LABELS) as CameraMode[]).map((mode) => (
                  <ToggleButton
                    key={mode}
                    value={mode}
                    sx={{ px: 1, fontSize: '0.7rem' }}
                  >
                    {CAMERA_MODE_LABELS[mode]}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            </Tooltip>
            <ThemeToggle />
          </Box>
        </Paper>

        {/* 3Dビューア */}
        <Box sx={{ flex: 1, position: 'relative' }}>
          <Scene
            waypoints={waypoints}
            isFlying={isFlying}
            cameraMode={cameraMode}
            selectedId={selectedId}
            collidingSegments={collidingSegments}
            onGroundClick={handleGroundClick}
            onSegmentClick={handleSegmentClick}
            onSelectWaypoint={(id) =>
              selectWaypoint(id === selectedId ? null : id)
            }
            onFlightUpdate={setFlightState}
            onFlightComplete={handleFlightComplete}
          />
          {isFlying && (
            <FlightInfoPanel flightState={flightState} totals={totals} />
          )}
        </Box>
      </Box>

      {/* オンボーディング */}
      <Dialog
        open={showOnboarding}
        onClose={() => handleOnboardingClose(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ textAlign: 'center', pt: 4 }}>
          <FlightTakeoffIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
          <Typography variant="h5" component="div" sx={{ fontWeight: 700 }}>
            ドローン フライトプランナーへようこそ
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ textAlign: 'center', py: 1 }}>
            <Typography variant="body1" sx={{ mb: 3, color: 'text.secondary' }}>
              ドローンの自動飛行ルートを3D空間で計画し、
              <br />
              飛行前にプレビュー・検証できるツールです。
            </Typography>
            <Paper
              variant="outlined"
              sx={{ p: 2, mb: 1, bgcolor: 'action.hover', borderRadius: 2 }}
            >
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 600,
                  mb: 1.5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 1,
                }}
              >
                <TouchAppIcon fontSize="small" />
                できること
              </Typography>
              <Box
                component="ul"
                sx={{
                  pl: 2,
                  m: 0,
                  textAlign: 'left',
                  '& li': {
                    fontSize: '0.875rem',
                    mb: 0.75,
                    color: 'text.secondary',
                  },
                }}
              >
                <li><strong>地面をクリック</strong>してウェイポイントを追加・経路を作成</li>
                <li><strong>距離・所要時間・高度</strong>を飛行前に確認</li>
                <li><strong>建物と交差する経路</strong>は自動で警告</li>
                <li><strong>フライト開始</strong>で実速度どおりのプレビュー飛行</li>
                <li>プランは自動保存され、<strong>JSONで入出力</strong>も可能</li>
              </Box>
            </Paper>
          </Box>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 3, gap: 2 }}>
          <Button
            variant="outlined"
            onClick={() => handleOnboardingClose(false)}
            startIcon={<TouchAppIcon />}
          >
            自分で作成
          </Button>
          <Button
            variant="contained"
            onClick={() => handleOnboardingClose(true)}
            startIcon={<RocketLaunchIcon />}
          >
            サンプルで開始
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
