# ドローン フライトプランナー

**ドローンの自動飛行ルートを3D空間で計画し、飛行前にプレビュー・検証できるWebツール**です。

ウェイポイントを配置して経路を作り、距離・所要時間・高度・障害物との交差を確認したうえで、設定した速度どおりのプレビュー飛行を3Dで再生できます。

> プロダクトの方向性・設計判断の背景は [docs/ARCHITECTURE_UX_REVIEW.md](./docs/ARCHITECTURE_UX_REVIEW.md) を参照してください。

## ✨ 機能

- 📍 **ウェイポイント編集** — 地面クリック / 座標入力で追加、経路クリックで途中挿入、並べ替え・編集・削除
- 🖱️ **3Dドラッグ移動** — マーカーを掴んで水平方向に直接ドラッグ配置
- ↩️ **Undo / Redo** — すべての編集操作を取り消し・やり直し（Ctrl/⌘+Z）
- 🔢 **番号ラベル** — 3D空間のマーカーと一覧テーブルが番号で対応、クリックで相互に選択
- 📊 **プランサマリー** — 総距離・予想飛行時間・高度範囲を飛行前に確認
- ⚠️ **障害物警告** — 建物と交差するセグメントを自動検出し赤色で点滅表示
- 🚁 **実単位プレビュー飛行** — 設定速度 [km/h] どおりの所要時間でシミュレーション再生
- 🎥 **カメラモード** — 追従 / FPV / 自由視点を切り替え
- 💾 **自動保存 & JSON入出力** — プランはブラウザに自動保存、ファイルとしてエクスポート/インポート可能
- ⌨️ **キーボードショートカット** — Space: 飛行、Delete: 削除、Ctrl+Z: 取り消し（「?」キーで一覧）
- 🌇 **昼夜連動の3Dシーン** — ライト=昼景（太陽・影）、ダーク=夜景（星空・窓明かり・ブルーム発光）

## 🚀 クイックスタート

```bash
git clone https://github.com/BoxPistols/three-flight-simulator.git
cd three-flight-simulator
npm install
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開きます。

### スクリプト

| コマンド | 内容 |
|---|---|
| `npm run dev` | 開発サーバー起動（Turbopack） |
| `npm run build` | プロダクションビルド |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript 型チェック |
| `npm test` | ユニットテスト（Vitest） |

## 📖 使い方

1. **ルート作成** — 3D画面の地面をクリックするとウェイポイントが追加されます（追加時の高度はサイドパネルで設定可能）。細かい調整は一覧テーブルの編集から。
2. **検証** — サイドパネルのプランサマリーで距離・所要時間を確認。経路が赤く表示された区間は建物と交差しています。
3. **プレビュー** — 「フライト開始」で設定速度どおりの飛行を再生。ヘッダーのトグルでカメラ視点（追従 / FPV / 自由）を切り替えられます。
4. **保存・共有** — プランは自動保存されます。「エクスポート」でJSONファイルとして保存、「インポート」で読み込みできます。

### 座標系

シーン座標（メートル単位）を使用します: **X = 東西 [m]、Z = 南北 [m]、高度 = 地面からの高さ [m]**。1シーン単位 = 1m。

## 🛠️ 技術スタック

- **Next.js 15** (App Router) / **React 19** / **TypeScript**
- **Three.js + @react-three/fiber + drei** — 3Dレンダリング
- **@react-three/postprocessing** — ブルーム / ヴィネット
- **Material-UI v7 + Emotion** — UI
- **Zustand** — 状態管理（localStorage 永続化 + Undo/Redo 履歴）
- **Vitest** — ユニットテスト

## 📁 プロジェクト構造

```
src/
├── app/                        # Next.js App Router（ページ骨格）
├── components/                 # 汎用コンポーネント（ThemeToggle）
├── providers/                  # テーマ/Emotionプロバイダー
└── features/
    ├── flight-plan/            # プランのドメイン
    │   ├── model.ts            # Waypoint型・プラン操作の純関数・入出力
    │   ├── store.ts            # Zustandストア（永続化）
    │   └── components/         # WaypointEditor / PlanSummary / PlanIO
    ├── simulation/             # シミュレーション（UI非依存の純関数）
    │   ├── engine.ts           # 実単位の飛行状態計算
    │   ├── collision.ts        # 経路×障害物の交差判定
    │   └── components/         # FlightInfoPanel
    └── viewer/                 # 3Dビューア（React Three Fiber）
        ├── Scene.tsx           # エントリポイント
        ├── AnimatedDrone.tsx   # エンジン駆動のドローン
        ├── CameraRig.tsx       # 追従/FPV/自由カメラ
        └── ...                 # マーカー・経路・建物・地面
```

設計原則: **飛行計算はUIに依存しない純関数**（`simulation/engine.ts`）に分離されており、ビューアは毎フレームその結果を描画するだけです。座標・速度・時間はすべて実単位で扱います。

## 🤝 コントリビューション

プルリクエストを歓迎します。CI（lint / typecheck / test / build）が通ることを確認してください。

## 📄 ライセンス

MIT
