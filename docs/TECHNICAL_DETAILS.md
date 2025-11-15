# 技術的な詳細ドキュメント

## プロジェクト概要

Three.js と React を使用した3Dフライトシミュレーターアプリケーション。ドローンのウェイポイントベースの自動飛行をシミュレートし、リアルタイムの3Dビジュアライゼーションを提供します。

## 技術スタック

### コアフレームワーク
- **Next.js 15.1.4** - Reactフレームワーク（App Router使用）
- **React 19** - UIライブラリ
- **TypeScript** - 型安全性

### 3Dグラフィックス
- **Three.js (r171)** - WebGL 3Dライブラリ
- **@react-three/fiber** - ThreeのReactレンダラー
- **@react-three/drei** - 便利なThreeヘルパー（OrbitControls等）

### UIフレームワーク
- **Material-UI v6** - UIコンポーネントライブラリ
- **Emotion** - CSS-in-JSスタイリング
- **Tailwind CSS** - ユーティリティファーストCSS

## アーキテクチャ

### ディレクトリ構造

```
src/
├── app/                      # Next.js App Router
│   ├── layout.tsx           # ルートレイアウト
│   ├── page.tsx             # メインページ
│   └── globals.css          # グローバルスタイル
├── components/              # Reactコンポーネント
│   ├── Scene.tsx            # 3Dシーンコンポーネント
│   ├── WaypointEditor.tsx   # ウェイポイント編集UI
│   └── ThemeToggle.tsx      # テーマ切替ボタン
├── providers/               # Contextプロバイダー
│   ├── ThemeProvider.tsx    # Material-UIテーマ管理
│   └── EmotionProvider.tsx  # Emotionキャッシュ設定
└── lib/                     # ユーティリティ
    └── coordinateConverter.ts # 座標変換ロジック
```

## 主要コンポーネントの詳細

### 1. Scene.tsx - 3Dシーンコンポーネント

#### カラーパレット定義
```typescript
const COLORS = {
  drone: {
    body: '#3b82f6',      // 青（視認性重視）
    propeller: '#1e293b', // ダークグレー
  },
  waypoint: {
    start: '#10b981',     // エメラルドグリーン
    end: '#ef4444',       // 赤
    middle: '#f59e0b',    // アンバー
  },
  environment: {
    ground: '#a3a380',    // オリーブグリーン系
    sky: '#7dd3fc',       // 明るいスカイブルー
  },
  flightPath: '#3b82f6', // 青
}
```

#### 主要サブコンポーネント

**DroneModel**
- ドローンの3Dモデル（本体+4つのプロペラ）
- `forwardRef`でrefを受け取り、親から位置・回転を制御可能
- 材質: `meshStandardMaterial` (PBRレンダリング)

**WaypointMarkers**
- ウェイポイントを球体で可視化
- クリック可能（削除機能）
- 開始点・中間点・終了点で色分け
- Emissive（発光）効果で視認性向上

**FlightPath**
- ウェイポイント間を線で接続
- `BufferGeometry`で効率的に描画
- 半透明表示（opacity: 0.8）

**AnimatedDrone**
- ドローンのアニメーション制御
- `useFrame`フックで毎フレーム更新
- ウェイポイント間の補間移動
- 速度計算式:
  ```typescript
  const baseSpeed = 0.3
  const increment = (speed * baseSpeed * visualSpeed * delta) / distance
  ```

**DroneCamera**
- ドローン目線のカメラ（FPV: First Person View）
- 飛行中のみアクティブ
- `lerp`（線形補間）でスムーズな追従
  - カメラ位置: `lerp(0.2)`
  - カメラ向き: `slerp(0.2)` (球面線形補間)
- オフセット: `(0, 0.5, -1.5)` - ドローンの後ろ上方

**CityBuildings**
- 16個の建物を配置
- 高層・中層・低層・住宅で分類
- グレー系の統一パレットで描画

**ClickableGround**
- 地面をクリックしてウェイポイント追加
- ドラッグ検出（閾値: 0.1単位以上の移動）
- クリック時の座標をY+50mに設定

#### パフォーマンス最適化

1. **ジオメトリの再利用**
   - 同じ形状の建物は複数描画しても効率的

2. **条件付きレンダリング**
   - FlightPathは2点以上のウェイポイントがある時のみ表示

3. **useFrame最適化**
   - 飛行中のみアニメーション計算
   - 早期リターンで不要な計算をスキップ

### 2. page.tsx - メインUIページ

#### 状態管理
```typescript
const [waypoints, setWaypoints] = useState<Waypoint[]>([])
const [isFlying, setIsFlying] = useState(false)
const [mounted, setMounted] = useState(false)
```

#### デザインパターン

**グラデーション背景**
```typescript
background: (theme) =>
  theme.palette.mode === 'dark'
    ? 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)'
    : 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)'
```

**動的スタイリング**
- 飛行状態に応じたUI変化
- LinearProgressで進行状況表示
- パルスアニメーションでステータス表示

**レスポンシブデザイン**
- サイドパネル: 固定幅320px
- メインエリア: `flex: 1`で残りを占有

### 3. ThemeProvider.tsx - テーマ管理

#### カラーパレット
```typescript
palette: {
  primary: {
    main: '#3b82f6',    // ライトモード
    main: '#60a5fa',    // ダークモード
  },
  background: {
    default: '#f8fafc', // ライトモード
    default: '#0f172a', // ダークモード
    paper: '#ffffff',   // ライトモード
    paper: '#1e293b',   // ダークモード
  },
}
```

#### アニメーション・トランジション

**ボタンホバー効果**
```typescript
'&:hover': {
  transform: 'translateY(-1px)',
  boxShadow: '0 4px 12px rgba(59, 130, 246, 0.2)',
}
```

**グラデーションボタン**
```typescript
containedPrimary: {
  background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
}
```

**スムーズトランジション**
- すべてのコンポーネントで`transition`プロパティ設定
- イージング関数: `cubic-bezier(0.4, 0, 0.2, 1)`
- 時間: 0.2s〜0.3s

### 4. coordinateConverter.ts - 座標変換

#### 座標系の定義

**緯度経度 → 3D座標**
- 簡易平面投影（メルカトル図法風）
- 基準点からの相対位置を計算

```typescript
export function convertWaypointsTo3D(waypoints: Waypoint[]) {
  // 基準点（最初のウェイポイント）を取得
  const reference = waypoints[0]

  return waypoints.map(wp => ({
    position: [
      (wp.longitude - reference.longitude) * scaleFactor,
      wp.altitude,
      (wp.latitude - reference.latitude) * scaleFactor
    ] as [number, number, number]
  }))
}
```

**3D座標 → 緯度経度**
```typescript
export function convert3DToLatLon(
  x: number,
  y: number,
  z: number,
  reference: { latitude: number; longitude: number }
) {
  return {
    latitude: reference.latitude + z / scaleFactor,
    longitude: reference.longitude + x / scaleFactor,
    altitude: y
  }
}
```

## データフロー

### ウェイポイント追加フロー

1. **3D画面クリック**
   ```
   ClickableGround.onPointerUp
   → Scene.handleGroundClick
   → page.handleAddWaypointFromClick
   → convert3DToLatLon (座標変換)
   → setWaypoints (状態更新)
   ```

2. **手動入力**
   ```
   WaypointEditor.addWaypoint
   → setWaypoints
   ```

### フライト実行フロー

1. **開始**
   ```
   page.handleStartFlight
   → setIsFlying(true)
   → AnimatedDrone.useFrame (開始)
   → DroneCamera.useFrame (開始)
   ```

2. **アニメーション**
   ```
   useFrame (毎フレーム)
   → 速度計算
   → 位置補間 (lerp)
   → 回転計算 (atan2)
   → ドローン更新
   → カメラ追従
   ```

3. **停止**
   ```
   最終ウェイポイント到達 or ユーザー停止
   → onFlightComplete
   → page.handleFlightComplete
   → setIsFlying(false)
   ```

## レンダリングパイプライン

### Three.jsレンダリング

1. **Canvas初期化**
   - `@react-three/fiber`の`<Canvas>`コンポーネント
   - カメラ設定: `position: [20, 25, 20], fov: 45`

2. **ライティング**
   ```tsx
   <ambientLight intensity={0.6} />
   <directionalLight position={[10, 10, 10]} intensity={1} />
   <pointLight position={[0, 10, 0]} intensity={0.5} />
   ```

3. **マテリアル**
   - `meshStandardMaterial`: PBR (Physically Based Rendering)
   - `roughness`, `metalness`で質感表現
   - `emissive`で発光効果

### Material-UIレンダリング

1. **CssBaseline**
   - ブラウザのデフォルトスタイルをリセット
   - グローバルスタイル適用

2. **テーマコンテキスト**
   - ライト/ダークモードの切り替え
   - localStorageに保存
   - システム設定を検出

## パフォーマンス考慮事項

### 最適化ポイント

1. **React最適化**
   - `dynamic import`でScene.tsxを遅延ロード
   - `ssr: false`でSSRを無効化（Three.jsはクライアントサイドのみ）
   - `useEffect`でマウント状態を管理

2. **Three.js最適化**
   - `BufferGeometry`で効率的なジオメトリ
   - `useFrame`内で不要な計算を削減
   - 条件付きレンダリングでオブジェクト数を削減

3. **レンダリング最適化**
   - `useRef`で再レンダリングを防止
   - `useMemo`でメモ化（必要に応じて）
   - アニメーション中の状態更新を最小化

### メモリ管理

- ジオメトリとマテリアルの適切な破棄
- イベントリスナーのクリーンアップ
- `useEffect`のreturnでクリーンアップ関数を実装

## カスタマイズガイド

### 配色変更

`Scene.tsx`のCOLORSオブジェクトを編集:
```typescript
const COLORS = {
  drone: {
    body: '#your-color',
  },
  // ...
}
```

`ThemeProvider.tsx`のpaletteを編集:
```typescript
palette: {
  primary: {
    main: '#your-color',
  },
}
```

### アニメーション速度調整

`Scene.tsx`のAnimatedDroneコンポーネント:
```typescript
const baseSpeed = 0.3  // この値を変更
```

### カメラ追従の調整

`Scene.tsx`のDroneCameraコンポーネント:
```typescript
camera.position.lerp(cameraPosition, 0.2)  // 0.1〜0.5で調整
```

## トラブルシューティング

### よくある問題

1. **3Dシーンが表示されない**
   - ブラウザのWebGL対応を確認
   - コンソールエラーを確認
   - `next.config.ts`のtranspilePackages設定を確認

2. **アニメーションが遅い**
   - `baseSpeed`を大きくする
   - ウェイポイント数を減らす
   - ブラウザのハードウェアアクセラレーションを有効化

3. **テーマが切り替わらない**
   - localStorageをクリア
   - ブラウザキャッシュをクリア
   - ThemeProviderのマウント状態を確認

## 今後の拡張案

### 機能追加
- [ ] ウェイポイントのドラッグ&ドロップ移動
- [ ] 複数ドローンの同時飛行
- [ ] 地形の追加（山、川など）
- [ ] 天候エフェクト（雨、霧など）
- [ ] カメラアングルの切り替え
- [ ] フライトパスのエクスポート/インポート

### UI/UX改善
- [ ] レスポンシブデザインの強化
- [ ] タッチデバイス対応の改善
- [ ] キーボードショートカット
- [ ] ツアーガイド/オンボーディング

### パフォーマンス
- [ ] WebWorkerでアニメーション計算
- [ ] LOD (Level of Detail) システム
- [ ] オフスクリーンレンダリング
- [ ] インスタンシング（同じモデルの大量配置）

## まとめ

このプロジェクトは、モダンなWebフロントエンド技術を活用した3Dインタラクティブアプリケーションです。Three.js、React、Material-UIを組み合わせることで、高品質なビジュアルと使いやすいUIを実現しています。
