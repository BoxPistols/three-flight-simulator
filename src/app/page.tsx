'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import { Button, Typography, Grid } from '@mui/material';
import { Waypoint } from '@/components/Scene';
import WaypointEditor from '@/components/WaypointEditor';
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
      <div className="min-h-screen p-4 md:p-6 bg-gray-50 flex items-center justify-center">
        <Typography>アプリケーションを読み込み中...</Typography>
      </div>
    );
  }

  return (
    <main className="h-screen flex bg-gray-50">
      {/* サイドパネル */}
      <div className="w-80 flex-shrink-0 p-2 bg-white shadow-lg overflow-y-auto">
        <WaypointEditor 
          waypoints={waypoints} 
          setWaypoints={setWaypoints}
        />
        
        <div className="mt-2">
          {isFlying ? (
            <Button 
              variant="contained" 
              color="error" 
              onClick={handleStopFlight}
              fullWidth
              size="small"
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
              size="small"
            >
              開始 ({waypoints.length})
            </Button>
          )}
        </div>
        
        <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
          <Typography variant="caption" className="font-semibold">操作:</Typography>
          <ul className="list-disc pl-3 space-y-0 text-xs">
            <li>3D画面をクリックでウェイポイント追加</li>
            <li>手動入力でも追加可能</li>
            <li>開始でドローン目線飛行</li>
            <li>停止中はマウスで自由視点</li>
          </ul>
        </div>
      </div>
      
      {/* メインフライト画面 */}
      <div className="flex-1 flex flex-col">
        <div className="h-8 bg-white border-b flex justify-between items-center px-3 text-xs">
          <span className="font-medium">3D フライトシミュレーター</span>
          <span className="text-gray-600">
            {isFlying ? '🟢 実行中' : '⚪ 待機中'} | {waypoints.length} waypoints
          </span>
        </div>
        <div className="flex-1">
          <Scene 
            waypoints={waypoints} 
            isFlying={isFlying} 
            onAddWaypoint={handleAddWaypointFromClick}
            onFlightComplete={handleFlightComplete}
          />
        </div>
      </div>
    </main>
  );
}
