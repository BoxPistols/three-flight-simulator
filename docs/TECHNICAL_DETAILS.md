# 技術詳細

このドキュメントは現行アーキテクチャの技術的な詳細を説明します。見直しの経緯と設計判断は [ARCHITECTURE_UX_REVIEW.md](./ARCHITECTURE_UX_REVIEW.md) を参照してください。

## アーキテクチャ概要

3層構造で、依存方向は常に「UI → ドメイン」の一方向です。

```
┌─────────────────────────────────────────────┐
│ UI層                                         │
│  app/page.tsx（配線）                         │
│  flight-plan/components/（エディタ・サマリー）   │
│  simulation/components/（フライト情報）         │
│  viewer/（React Three Fiber シーン）           │
├─────────────────────────────────────────────┤
│ 状態層                                        │
│  flight-plan/store.ts（Zustand + persist）    │
├─────────────────────────────────────────────┤
│ ドメイン層（純関数・UI非依存・テスト対象）          │
│  flight-plan/model.ts   プラン操作・入出力       │
│  simulation/engine.ts   飛行状態の計算          │
│  simulation/collision.ts 障害物交差判定         │
└─────────────────────────────────────────────┘
```

## 座標系と単位

- シーン座標: **1単位 = 1メートル**
- `Waypoint { x, z, altitude, speed }` — x=東西[m]、z=南北[m]、altitude=高度[m]、speed=巡航速度[km/h]
- 3D空間へのマッピング: `[x, altitude, z]`（Three.js の Y-up に対応）
- 速度は 5〜20 km/h、高度は 5〜150 m にクランプされる（`model.ts` の定数で変更可能）

## シミュレーションエンジン（simulation/engine.ts）

「経過時間 t 秒におけるドローンの状態」を計算する純関数 `flightStateAt(waypoints, elapsedSec)` が中核です。

- 各セグメントの所要時間 = 距離[m] ÷ 速度[m/s]（始点ウェイポイントの速度を使用）
- 返り値 `FlightState` は位置・ヨー角・セグメント進捗・全体進捗（距離ベース）・残距離・経過時間を含む
- 長さ0のセグメント（同一点の連続）は瞬時に通過する
- `planTotals()` が総距離・総所要時間・高度範囲を返す（プランサマリーとフライト情報パネルで使用）

ビューア側（`viewer/AnimatedDrone.tsx`）は `useFrame` で delta を積算し、`flightStateAt` の結果をドローンの Transform に反映するだけです。UIへの状態通知は 0.1 秒間隔に間引いて、飛行中の React 再レンダーを抑えています。

## 障害物交差判定（simulation/collision.ts）

- 建物は軸平行境界ボックス（AABB）として `viewer/city.ts` に定義
- 線分×AABB の交差はスラブ法で判定
- `findCollidingSegments()` が交差セグメント番号の集合を返し、
  - ビューア: 該当セグメントを警告色（赤）で描画
  - プランサマリー: 警告アラートを表示

## 状態管理（flight-plan/store.ts）

- Zustand + `persist` ミドルウェア（localStorage キー: `flight-simulator-plan`）
- 永続化対象は `waypoints` と `clickAltitude` のみ（選択状態・履歴は揮発）
- 配列操作のロジックは `model.ts` の純関数（`insertWaypointAt` / `moveWaypointById` など）に委譲
- 飛行中フラグ・カメラモード・フライト状態は `page.tsx` のローカル state（セッション限りで良いため）

### Undo / Redo

- `past` / `future` の2スタックで実装（各最大50ステップ）
- 全ての破壊的アクションは変更前に現在の `waypoints` を `past` に積み、`future` をクリア
- ドラッグは `beginDrag()` で1度だけ履歴を積み、`dragWaypoint()` は履歴を積まずに位置更新（1ドラッグ=1 Undo単位）
- `undo()` / `redo()` は Ctrl/⌘+Z・Ctrl/⌘+Shift+Z にバインド

## 3Dドラッグ移動（viewer/WaypointMarkers.tsx）

- マーカーの `onPointerDown` で `window` に pointermove/up リスナーを登録
- 画面座標をカメラのレイと水平面（y=マーカー高度）の交点に射影して新しい X/Z を算出
- 4px 未満の移動はクリック（＝選択）、それ以上はドラッグとして扱う
- ドラッグ中は `CameraRig` の OrbitControls を `locked` で無効化
- 位置は地面範囲にクランプし 0.1m 単位に丸める

## ポストプロセス（viewer/Scene.tsx）

- `@react-three/postprocessing` の `EffectComposer` で Bloom と Vignette を適用
- 夜モードでは Bloom を強め（intensity 1.15 / 閾値 0.6）、窓明かり・航行灯・発光経路を強調
- 昼モードは控えめ（intensity 0.3 / 閾値 0.85）にして白飛びを防ぐ

## カメラ制御（viewer/CameraRig.tsx）

| モード | 挙動 |
|---|---|
| 追従 | OrbitControls のターゲットがドローンに lerp 追従。ユーザーの回転・ズーム操作は有効 |
| FPV | ドローン後方 6m・上方 2.5m から進行方向を注視。OrbitControls は無効化 |
| 自由 | 通常の OrbitControls（飛行中も固定視点で観察可能） |

## プランの入出力

- エクスポート形式: `{ "version": 1, "waypoints": [{ x, z, altitude, speed }] }`
- インポートは `model.ts` の `parsePlan()` が検証し、不正値（型不一致・NaN・未対応バージョン）は明示的なエラーメッセージで拒否

## テスト

```bash
npm test
```

- `simulation/engine.test.ts` — 実単位の移動・進捗・境界条件（開始/終了/ゼロ長セグメント）
- `simulation/collision.test.ts` — スラブ法の交差判定（貫通・上空通過・内部始点）
- `flight-plan/model.test.ts` — プラン操作の不変性・クランプ・入出力ラウンドトリップ
- `flight-plan/store.test.ts` — Undo/Redo の履歴挙動（分岐破棄・ドラッグ1単位化）

ドメイン層はDOM・Three.jsに依存しないため、Node環境で高速に実行できます。

## CI

`.github/workflows/ci.yml` が push / PR ごとに lint → typecheck → test → build を実行します。
