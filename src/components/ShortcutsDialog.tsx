'use client'

import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import KeyboardIcon from '@mui/icons-material/Keyboard'

const isMac =
  typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)
const mod = isMac ? '⌘' : 'Ctrl'

const SHORTCUTS: Array<{ keys: string[]; label: string }> = [
  { keys: ['Space'], label: 'フライトの開始 / 停止' },
  { keys: ['Delete'], label: '選択中のウェイポイントを削除' },
  { keys: [mod, 'Z'], label: '元に戻す' },
  { keys: [mod, 'Shift', 'Z'], label: 'やり直す' },
  { keys: ['?'], label: 'このヘルプを表示 / 非表示' },
]

const MOUSE: Array<{ action: string; label: string }> = [
  { action: '地面をクリック', label: 'ウェイポイントを追加' },
  { action: '経路をクリック', label: '途中にウェイポイントを挿入' },
  { action: 'マーカーをクリック', label: 'ウェイポイントを選択' },
  { action: 'マーカーをドラッグ', label: '水平方向に移動' },
  { action: 'ドラッグ / ホイール', label: '視点の回転 / ズーム' },
]

function Key({ children }: { children: React.ReactNode }) {
  return (
    <Box
      component="kbd"
      sx={{
        fontFamily: 'var(--font-mono), monospace',
        fontSize: '0.72rem',
        fontWeight: 700,
        minWidth: 22,
        px: 0.75,
        py: 0.25,
        textAlign: 'center',
        borderRadius: 1,
        border: 1,
        borderColor: 'divider',
        bgcolor: 'background.default',
        boxShadow: '0 1px 0 rgba(0,0,0,0.12)',
      }}
    >
      {children}
    </Box>
  )
}

function Row({ left, label }: { left: React.ReactNode; label: string }) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 2,
        py: 0.85,
        borderBottom: 1,
        borderColor: 'divider',
        '&:last-of-type': { borderBottom: 0 },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>{left}</Box>
      <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'right' }}>
        {label}
      </Typography>
    </Box>
  )
}

export default function ShortcutsDialog({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle
        sx={{ display: 'flex', alignItems: 'center', gap: 1, pr: 6 }}
      >
        <KeyboardIcon sx={{ color: 'primary.main' }} />
        キーボード & マウス操作
        <IconButton
          onClick={onClose}
          aria-label="閉じる"
          size="small"
          sx={{ position: 'absolute', right: 12, top: 12 }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Typography variant="overline" sx={{ color: 'text.secondary' }}>
          キーボード
        </Typography>
        <Box sx={{ mb: 2 }}>
          {SHORTCUTS.map((s) => (
            <Row
              key={s.label}
              label={s.label}
              left={s.keys.map((k, i) => (
                <Key key={i}>{k}</Key>
              ))}
            />
          ))}
        </Box>
        <Typography variant="overline" sx={{ color: 'text.secondary' }}>
          マウス
        </Typography>
        <Box>
          {MOUSE.map((m) => (
            <Row
              key={m.action}
              label={m.label}
              left={
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {m.action}
                </Typography>
              }
            />
          ))}
        </Box>
      </DialogContent>
    </Dialog>
  )
}
