'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import { Button, Typography, Paper, Box, Divider, Fade, Chip, LinearProgress, Drawer, IconButton, useMediaQuery, useTheme, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff';
import MenuIcon from '@mui/icons-material/Menu';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import TouchAppIcon from '@mui/icons-material/TouchApp';
import BugReportIcon from '@mui/icons-material/BugReport';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import { Waypoint, FlightDebugData } from '@/components/Scene';
import WaypointEditor from '@/components/WaypointEditor';
import ThemeToggle from '@/components/ThemeToggle';
import DebugPanel from '@/components/DebugPanel';

const Scene = dynamic(() => import('@/components/Scene'), { 
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
      <Typography>3Dシーンをロード中...</Typography>
    </div>
  )
});

// サンプルウェイポイントを生成する関数（建物外周を周回する経路）
const generateSampleWaypoints = (): Waypoint[] => {
  // 建物は ±25（軸上）と±15（対角線上）に配置されているため、
  // 半径32で円形に周回する経路を作成
  const radius = 32;
  const baseAltitude = 50; // 3D空間では altitude * 0.5 = 25
  const numPoints = 16; // 円周上の点数

  const samples = [];
  for (let i = 0; i < numPoints; i++) {
    const angle = (i / numPoints) * 2 * Math.PI;
    // 座標系: latitude = Z軸, longitude = X軸
    const latitude = radius * Math.cos(angle);
    const longitude = radius * Math.sin(angle);
    // 高度に少し変化をつける（25-30の範囲）
    const altitudeVariation = 5 * Math.sin(angle * 2);
    const altitude = baseAltitude + altitudeVariation;

    samples.push({
      latitude,
      longitude,
      altitude,
      speed: 15 + Math.floor(i % 3) * 2, // 15-19 km/h の範囲で変化
      rotation: 0,
    });
  }

  return samples.map((wp, index) => ({
    id: `sample_${Date.now()}_${index}`,
    ...wp,
  }));
};

export default function Home() {
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
  const [isFlying, setIsFlying] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [highlightedWaypointId, setHighlightedWaypointId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [debugData, setDebugData] = useState<FlightDebugData | null>(null);
  const [showDebugPanel, setShowDebugPanel] = useState(true);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    setMounted(true);
    // 初回訪問時にオンボーディングを表示
    const hasVisited = localStorage.getItem('flightSimulator_hasVisited');
    if (!hasVisited) {
      setShowOnboarding(true);
    }
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
    // 3D座標をそのままウェイポイントとして使用
    // position: [x, y, z] → [longitude, altitude, latitude]
    const newWaypoint: Waypoint = {
      id: Date.now().toString(),
      latitude: position[2],      // Z → latitude
      longitude: position[0],     // X → longitude
      altitude: position[1] * 2,  // Y → altitude（スケール戻し）
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

  const handleOnboardingClose = (loadSample: boolean) => {
    setShowOnboarding(false);
    localStorage.setItem('flightSimulator_hasVisited', 'true');
    if (loadSample) {
      setWaypoints(generateSampleWaypoints());
    }
  };

  const handleInsertWaypoint = (segmentIndex: number, position: [number, number, number]) => {
    // 3D座標をそのままウェイポイントとして使用
    const newWaypoint: Waypoint = {
      id: Date.now().toString(),
      latitude: position[2],      // Z → latitude
      longitude: position[0],     // X → longitude
      altitude: position[1] * 2,  // Y → altitude（スケール戻し）
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
        <Tooltip title="パネルを閉じる" arrow>
          <IconButton onClick={() => setDrawerOpen(false)} size="small">
            <ChevronLeftIcon />
          </IconButton>
        </Tooltip>
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
              <Tooltip title="ドローンの飛行を停止してカメラを自由視点に戻す" arrow>
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
              </Tooltip>
            ) : (
              <Tooltip
                title={waypoints.length < 2
                  ? "フライトを開始するには2つ以上のウェイポイントが必要です"
                  : "ウェイポイントに沿ってドローン目線で飛行を開始"
                }
                arrow
              >
                <span style={{ width: '100%' }}>
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
                </span>
              </Tooltip>
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
      {/* サイドパネル（Drawer - デスクトップ/モバイル共通でトグル可能） */}
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        variant={isMobile ? "temporary" : "persistent"}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          width: drawerOpen ? drawerWidth : 0,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: drawerWidth,
            position: isMobile ? 'fixed' : 'relative',
          },
        }}
      >
        {drawerContent}
      </Drawer>

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
            <Tooltip title={drawerOpen ? "パネルを閉じる" : "フライトコントロールパネルを開く"} arrow>
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
            </Tooltip>
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
            <Tooltip title={isFlying ? "ドローンが飛行中です" : "飛行待機状態です"} arrow>
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
            </Tooltip>
            <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', sm: 'block' } }} />
            <Tooltip title={`登録済みウェイポイント数: ${waypoints.length}個 (2個以上で飛行可能)`} arrow>
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
            </Tooltip>
            <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', sm: 'block' } }} />
            <Tooltip title={showDebugPanel ? "デバッグパネルを非表示" : "デバッグパネルを表示"} arrow>
              <IconButton
                onClick={() => setShowDebugPanel(!showDebugPanel)}
                size="small"
                sx={{
                  color: showDebugPanel ? 'primary.main' : 'text.secondary',
                  '&:hover': {
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                  },
                }}
              >
                <BugReportIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <ThemeToggle />
          </Box>
        </Paper>
        <Box sx={{ flex: 1, position: 'relative' }}>
          <Scene
            waypoints={waypoints}
            isFlying={isFlying}
            onAddWaypoint={handleAddWaypointFromClick}
            onInsertWaypoint={handleInsertWaypoint}
            onFlightComplete={handleFlightComplete}
            onDebugDataUpdate={setDebugData}
            highlightedWaypointId={highlightedWaypointId}
          />
          {/* デバッグパネル */}
          <DebugPanel
            isFlying={isFlying}
            debugData={debugData}
            visible={showDebugPanel}
          />
        </Box>
      </Box>

      {/* オンボーディングダイアログ */}
      <Dialog
        open={showOnboarding}
        onClose={() => handleOnboardingClose(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            background: (theme) =>
              theme.palette.mode === 'dark'
                ? 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)'
                : 'linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%)',
          }
        }}
      >
        <DialogTitle sx={{ textAlign: 'center', pt: 4 }}>
          <FlightTakeoffIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            3D フライトシミュレーターへようこそ
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <Typography variant="body1" sx={{ mb: 3, color: 'text.secondary' }}>
              ドローンの飛行経路をシミュレーションできます。
              <br />
              まずはサンプルを読み込んで体験してみましょう。
            </Typography>

            <Paper
              variant="outlined"
              sx={{
                p: 2,
                mb: 2,
                bgcolor: 'action.hover',
                borderRadius: 2,
              }}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                <TouchAppIcon fontSize="small" />
                基本操作
              </Typography>
              <Box component="ul" sx={{ pl: 2, m: 0, textAlign: 'left', '& li': { fontSize: '0.875rem', mb: 0.75, color: 'text.secondary' } }}>
                <li><strong>3D画面をクリック</strong>: ウェイポイントを追加</li>
                <li><strong>経路をクリック</strong>: 途中にウェイポイントを挿入</li>
                <li><strong>マウスドラッグ</strong>: 視点を回転</li>
                <li><strong>スクロール</strong>: ズームイン/アウト</li>
                <li><strong>フライト開始</strong>: ドローン目線で飛行体験</li>
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
            sx={{
              boxShadow: '0 4px 14px rgba(59, 130, 246, 0.3)',
            }}
          >
            サンプルで開始
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
