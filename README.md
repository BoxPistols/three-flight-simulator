# 3D フライトシミュレーター

Three.js と React を使用した、インタラクティブな3Dドローンフライトシミュレーターです。ウェイポイントベースの自動飛行をリアルタイムで3D可視化できます。

## ✨ 特徴

- 🎮 **インタラクティブな3Dシーン** - Three.jsによる滑らかな3Dレンダリング
- 🚁 **ドローン飛行シミュレーション** - ウェイポイント間の自動飛行
- 👁️ **FPVカメラ** - ドローン目線のリアルタイム追従カメラ
- 🎨 **洗練されたUI** - Material-UIによるモダンなデザイン
- 🌓 **ダークモード対応** - ライト/ダークテーマの切り替え
- 📍 **ウェイポイント管理** - クリックまたは手動入力で追加・編集
- 🏙️ **都市環境** - 建物やランドマークを含む3D都市
- ⚡ **高速レンダリング** - 最適化された描画パイプライン

## 🚀 クイックスタート

### 前提条件

- Node.js 18.x以上
- npm / yarn / pnpm / bunのいずれか

### インストール

```bash
# リポジトリをクローン
git clone https://github.com/BoxPistols/three-flight-simulator.git
cd three-flight-simulator

# 依存関係をインストール
npm install
# or
yarn install
# or
pnpm install
```

### 開発サーバーの起動

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開きます。

### ビルド

```bash
npm run build
npm start
```

## 📖 使い方

### ウェイポイントの追加

**方法1: 3D画面をクリック**
1. 地面をクリックするとその位置にウェイポイントが追加されます
2. 高度は自動的に50mに設定されます

**方法2: 手動入力**
1. サイドパネルの入力フォームで緯度・経度・高度・速度を指定
2. 「追加」ボタンをクリック

**方法3: サンプル**
- 「サンプル」ボタンで事前定義された円形経路を読み込み

### フライトの実行

1. 2つ以上のウェイポイントを追加
2. 「フライト開始」ボタンをクリック
3. ドローンがウェイポイント間を自動飛行
4. カメラがドローン目線で追従
5. 「停止」ボタンで中断可能

### ウェイポイントの編集・削除

- **編集**: テーブルの編集アイコン（鉛筆）をクリック
- **削除**: テーブルの削除アイコン（ゴミ箱）をクリック

### カメラ操作（停止中のみ）

- **回転**: 左ドラッグ
- **パン**: 右ドラッグ
- **ズーム**: マウスホイール

## 🛠️ 技術スタック

### フロントエンド
- **Next.js 15.1.4** - Reactフレームワーク（App Router）
- **React 19** - UIライブラリ
- **TypeScript** - 型安全性

### 3Dグラフィックス
- **Three.js (r171)** - WebGL 3Dライブラリ
- **@react-three/fiber** - ThreeのReactレンダラー
- **@react-three/drei** - Three.jsヘルパーコンポーネント

### UIフレームワーク
- **Material-UI v6** - UIコンポーネントライブラリ
- **Emotion** - CSS-in-JSスタイリング
- **Tailwind CSS** - ユーティリティCSS

## 📁 プロジェクト構造

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
│   ├── ThemeProvider.tsx    # テーマ管理
│   └── EmotionProvider.tsx  # Emotionキャッシュ
└── lib/                     # ユーティリティ
    └── coordinateConverter.ts # 座標変換
```

## 🎨 デザインシステム

### カラーパレット

#### ライトモード
- 背景: `#f8fafc`
- 前景: `#0f172a`
- プライマリ: `#3b82f6`

#### ダークモード
- 背景: `#0f172a`
- 前景: `#f1f5f9`
- プライマリ: `#60a5fa`

### アニメーション
- トランジション: `0.2s cubic-bezier(0.4, 0, 0.2, 1)`
- ホバーエフェクト: `translateY(-1px)` + シャドウ
- グラデーションボタン

## 📚 ドキュメント

詳細な技術仕様は [TECHNICAL_DETAILS.md](./docs/TECHNICAL_DETAILS.md) を参照してください。

## 🤝 コントリビューション

プルリクエストを歓迎します！大きな変更の場合は、まずissueを開いて変更内容を議論してください。

## 📄 ライセンス

このプロジェクトはMITライセンスの下で公開されています。

## 🙏 謝辞

- [Three.js](https://threejs.org/) - 3Dグラフィックスライブラリ
- [React Three Fiber](https://docs.pmnd.rs/react-three-fiber) - ThreeのReactレンダラー
- [Material-UI](https://mui.com/) - UIコンポーネントライブラリ
- [Next.js](https://nextjs.org/) - Reactフレームワーク

## 🔗 リンク

- [ライブデモ](#) - デプロイ後に追加
- [GitHub Issues](https://github.com/BoxPistols/three-flight-simulator/issues)
- [プロジェクトボード](https://github.com/BoxPistols/three-flight-simulator/projects)

---

Made with ❤️ by [BoxPistols](https://github.com/BoxPistols)
