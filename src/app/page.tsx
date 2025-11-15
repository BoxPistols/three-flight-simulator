'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import { Button, Typography, Paper, Box, Divider, Fade, Chip, LinearProgress, Drawer, IconButton, useMediaQuery, useTheme } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import { Waypoint } from '@/components/Scene';
import WaypointEditor from '@/components/WaypointEditor';
import ThemeToggle from '@/components/ThemeToggle';
import { convert3DToLatLon } from '@/lib/coordinateConverter';

const Scene = dynamic(() => import('@/components/Scene'), { 
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
      <Typography>3Dシーンをロード中...</Typography>
    </div>
  )
});

export default function Home() {
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
  const [isFlying, setIsFlying] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [highlightedWaypointId, setHighlightedWaypointId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    setMounted(true);
  }, []);

  // モバイルの場合は初期状態で閉じる
  useEffect(() => {
    if (mounted) {
      setDrawerOpen(!isMobile);
    }
  }, [mounted, isMobile]);

  const handleStartFlight = () => {
    if (waypoints.length > 1) {
      setIsFlying(true);
    }
  };

    const handleStopFlight = () => {
    setIsFlying(false);
  };

  const handleFlightComplete = () => {
    setIsFlying(false);
  };

  const handleAddWaypointFromClick = (position: [number, number, number]) => {
    // 基準点として最初のウェイポイント、または東京駅を使用
    const reference = waypoints.length > 0
      ? { latitude: waypoints[0].latitude, longitude: waypoints[0].longitude }
      : { latitude: 35.6812, longitude: 139.7671 };

    const { latitude, longitude, altitude } = convert3DToLatLon(position[0], position[1], position[2], reference);

    const newWaypoint: Waypoint = {
      id: Date.now().toString(),
      latitude,
      longitude,
      altitude,
      speed: 15,
      rotation: 0
    };

    setWaypoints([...waypoints, newWaypoint]);

    // 新しく追加されたウェイポイントをハイライト
    setHighlightedWaypointId(newWaypoint.id);

    // 3秒後にハイライトを解除
    setTimeout(() => {
      setHighlightedWaypointId(null);
    }, 3000);
  };

  const handleInsertWaypoint = (segmentIndex: number, position: [number, number, number]) => {
    // 基準点として最初のウェイポイント、または東京駅を使用
    const reference = waypoints.length > 0
      ? { latitude: waypoints[0].latitude, longitude: waypoints[0].longitude }
      : { latitude: 35.6812, longitude: 139.7671 };

    const { latitude, longitude, altitude } = convert3DToLatLon(position[0], position[1], position[2], reference);

    const newWaypoint: Waypoint = {
      id: Date.now().toString(),
      latitude,
      longitude,
      altitude,
      speed: 15,
      rotation: 0
    };

    // segmentIndexの後に挿入（segmentIndex + 1の位置）
    const newWaypoints = [...waypoints];
    newWaypoints.splice(segmentIndex + 1, 0, newWaypoint);
    setWaypoints(newWaypoints);

    // 新しく追加されたウェイポイントをハイライト
    setHighlightedWaypointId(newWaypoint.id);

    // 3秒後にハイライトを解除
    setTimeout(() => {
      setHighlightedWaypointId(null);
    }, 3000);
  };

  if (!mounted) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.default'
        }}
      >
        <Typography>アプリケーションを読み込み中...</Typography>
      </Box>
    );
  }

  const drawerWidth = 320;

  const drawerContent = (
    <Box
      sx={{
        width: drawerWidth,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        p: 2.5,
        background: (theme) =>
          theme.palette.mode === 'dark'
            ? 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)'
            : 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <FlightTakeoffIcon sx={{ fontSize: 28, color: 'primary.main' }} />
          <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
            フライトコントロール
          </Typography>
        </Box>
        {isMobile && (
          <IconButton onClick={() => setDrawerOpen(false)} size="small">
            <CloseIcon />
          </IconButton>
        )}
      </Box>

      <Divider sx={{ my: 0.5 }} />

      <WaypointEditor
        waypoints={waypoints}
        setWaypoints={setWaypoints}
        highlightedWaypointId={highlightedWaypointId}
      />

      <Box sx={{ mt: 'auto', pt: 2 }}>
        <Fade in={true} timeout={500}>
          <Box>
            {isFlying && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" sx={{ display: 'block', mb: 0.5, color: 'text.secondary' }}>
                  飛行中...
                </Typography>
                <LinearProgress
                  sx={{
                    height: 6,
                    borderRadius: 3,
                    bgcolor: 'action.hover',
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 3,
                      background: 'linear-gradient(90deg, #10b981 0%, #3b82f6 50%, #ef4444 100%)',
                    }
                  }}
                />
              </Box>
            )}

            {isFlying ? (
              <Button
                variant="contained"
                color="error"
                onClick={handleStopFlight}
                fullWidth
                size="large"
                startIcon={<StopIcon />}
                sx={{
                  py: 1.5,
                  boxShadow: '0 4px 14px rgba(239, 68, 68, 0.3)',
                }}
              >
                停止
              </Button>
            ) : (
              <Button
                variant="contained"
                color="primary"
                onClick={handleStartFlight}
                disabled={waypoints.length < 2}
                fullWidth
                size="large"
                startIcon={<PlayArrowIcon />}
                sx={{
                  py: 1.5,
                  boxShadow: waypoints.length >= 2 ? '0 4px 14px rgba(59, 130, 246, 0.3)' : 'none',
                }}
              >
                フライト開始
                {waypoints.length >= 2 && (
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
            )}
          </Box>
        </Fade>

        <Paper
          variant="outlined"
          sx={{
            mt: 2,
            p: 2,
            bgcolor: 'action.hover',
            borderRadius: 2,
            borderColor: 'divider',
          }}
        >
          <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mb: 1, color: 'text.primary' }}>
            💡 操作ガイド
          </Typography>
          <Box component="ul" sx={{ pl: 2.5, m: 0, '& li': { fontSize: '0.75rem', mb: 0.75, color: 'text.secondary', lineHeight: 1.5 } }}>
            <li>3D画面をクリックでウェイポイント追加</li>
            <li>フライトプラン（経路）をクリックで途中に挿入</li>
            <li>手動入力でも追加可能</li>
            <li>開始ボタンでドローン目線飛行</li>
            <li>停止中はマウスで自由視点操作</li>
          </Box>
        </Paper>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ height: '100vh', display: 'flex', bgcolor: 'background.default' }}>
      {/* デスクトップ: 固定サイドパネル、モバイル: Drawer */}
      {isMobile ? (
        <Drawer
          anchor="left"
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          ModalProps={{
            keepMounted: true, // モバイルパフォーマンス向上
          }}
          sx={{
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
            },
          }}
        >
          {drawerContent}
        </Drawer>
      ) : (
        <Paper
          elevation={3}
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            borderRadius: 0,
            overflowY: 'auto',
          }}
        >
          {drawerContent}
        </Paper>
      )}

      {/* メインフライト画面 */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Paper
          elevation={1}
          sx={{
            height: 56,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            px: { xs: 2, md: 3 },
            borderRadius: 0,
            borderBottom: 1,
            borderColor: 'divider',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {isMobile && (
              <IconButton
                onClick={() => setDrawerOpen(!drawerOpen)}
                edge="start"
                sx={{
                  color: 'primary.main',
                  '&:hover': {
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                  },
                }}
              >
                <MenuIcon />
              </IconButton>
            )}
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: 700,
                letterSpacing: '-0.02em',
                fontSize: { xs: '0.9rem', md: '1rem' },
              }}
            >
              3D フライトシミュレーター
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, md: 2 } }}>
            <Chip
              label={isFlying ? '実行中' : '待機中'}
              color={isFlying ? 'success' : 'default'}
              size="small"
              icon={isFlying ? <span style={{ fontSize: '8px' }}>🟢</span> : <span style={{ fontSize: '8px' }}>⚪</span>}
              sx={{
                fontWeight: 600,
                fontSize: { xs: '0.7rem', md: '0.75rem' },
                height: 28,
                display: { xs: 'none', sm: 'flex' },
                animation: isFlying ? 'pulse 2s ease-in-out infinite' : 'none',
                '@keyframes pulse': {
                  '0%, 100%': { opacity: 1 },
                  '50%': { opacity: 0.7 },
                },
              }}
            />
            <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', sm: 'block' } }} />
            <Chip
              label={`${waypoints.length} WP`}
              size="small"
              variant="outlined"
              sx={{
                fontWeight: 600,
                fontSize: { xs: '0.7rem', md: '0.75rem' },
                height: 28,
                borderColor: waypoints.length >= 2 ? 'primary.main' : 'divider',
                color: waypoints.length >= 2 ? 'primary.main' : 'text.secondary',
              }}
            />
            <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', sm: 'block' } }} />
            <ThemeToggle />
          </Box>
        </Paper>
        <Box sx={{ flex: 1 }}>
          <Scene
            waypoints={waypoints}
            isFlying={isFlying}
            onAddWaypoint={handleAddWaypointFromClick}
            onInsertWaypoint={handleInsertWaypoint}
            onFlightComplete={handleFlightComplete}
            highlightedWaypointId={highlightedWaypointId}
          />
        </Box>
      </Box>
    </Box>
  );
}
