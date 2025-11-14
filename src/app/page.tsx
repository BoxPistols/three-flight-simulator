'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import { Button, Typography, Grid, Paper, Box, Divider } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
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

  useEffect(() => {
    setMounted(true);
  }, []);

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
      speed: 5,
      rotation: 0
    };
    
    setWaypoints([...waypoints, newWaypoint]);
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

  return (
    <Box sx={{ height: '100vh', display: 'flex', bgcolor: 'background.default' }}>
      {/* サイドパネル */}
      <Paper
        elevation={3}
        sx={{
          width: 320,
          flexShrink: 0,
          p: 2,
          overflowY: 'auto',
          borderRadius: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 2
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
          フライトコントロール
        </Typography>

        <Divider />

        <WaypointEditor
          waypoints={waypoints}
          setWaypoints={setWaypoints}
        />

        <Box sx={{ mt: 'auto', pt: 2 }}>
          {isFlying ? (
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
          ) : (
            <Button
              variant="contained"
              color="primary"
              onClick={handleStartFlight}
              disabled={waypoints.length < 2}
              fullWidth
              size="large"
              startIcon={<PlayArrowIcon />}
              sx={{ py: 1.5 }}
            >
              フライト開始 ({waypoints.length})
            </Button>
          )}

          <Paper
            variant="outlined"
            sx={{ mt: 2, p: 2, bgcolor: 'action.hover' }}
          >
            <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 1 }}>
              操作ガイド
            </Typography>
            <Box component="ul" sx={{ pl: 2, m: 0, '& li': { fontSize: '0.75rem', mb: 0.5 } }}>
              <li>3D画面をクリックでウェイポイント追加</li>
              <li>手動入力でも追加可能</li>
              <li>開始ボタンでドローン目線飛行</li>
              <li>停止中はマウスで自由視点操作</li>
            </Box>
          </Paper>
        </Box>
      </Paper>

      {/* メインフライト画面 */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Paper
          elevation={1}
          sx={{
            height: 48,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            px: 3,
            borderRadius: 0
          }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            3D フライトシミュレーター
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography
              variant="body2"
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                color: isFlying ? 'success.main' : 'text.secondary',
                fontWeight: 500
              }}
            >
              {isFlying ? '🟢 実行中' : '⚪ 待機中'}
            </Typography>
            <Divider orientation="vertical" flexItem />
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {waypoints.length} waypoints
            </Typography>
            <Divider orientation="vertical" flexItem />
            <ThemeToggle />
          </Box>
        </Paper>
        <Box sx={{ flex: 1 }}>
          <Scene
            waypoints={waypoints}
            isFlying={isFlying}
            onAddWaypoint={handleAddWaypointFromClick}
            onFlightComplete={handleFlightComplete}
          />
        </Box>
      </Box>
    </Box>
  );
}
