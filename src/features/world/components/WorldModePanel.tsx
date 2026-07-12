'use client'

import { useMemo, useState } from 'react'
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Grid,
  IconButton,
  MenuItem,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material'
import AddLocationAltIcon from '@mui/icons-material/AddLocationAlt'
import DeleteIcon from '@mui/icons-material/Delete'
import PublicIcon from '@mui/icons-material/Public'
import ViewInArIcon from '@mui/icons-material/ViewInAr'
import { useFlightPlanStore, type WorldMode } from '@/features/flight-plan/store'
import {
  DEFAULT_GEOID_HEIGHT,
  PRESET_LOCATIONS,
  type RealLocation,
} from '../locations'

const emptyForm = {
  name: '',
  lat: '',
  lon: '',
  tilesetUrl: '',
}

/**
 * 環境切替パネル。
 * 仮想都市 / 実在都市（PLATEAU + 国土地理院の実地形）を切り替え、
 * 実在都市ではロケーションのプリセット選択とカスタム地点の追加ができる。
 */
export default function WorldModePanel({ disabled }: { disabled?: boolean }) {
  const worldMode = useFlightPlanStore((s) => s.worldMode)
  const locationId = useFlightPlanStore((s) => s.locationId)
  const customLocations = useFlightPlanStore((s) => s.customLocations)
  const setWorldMode = useFlightPlanStore((s) => s.setWorldMode)
  const setLocationId = useFlightPlanStore((s) => s.setLocationId)
  const addCustomLocation = useFlightPlanStore((s) => s.addCustomLocation)
  const removeCustomLocation = useFlightPlanStore((s) => s.removeCustomLocation)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)

  const allLocations = useMemo(
    () => [...PRESET_LOCATIONS, ...customLocations],
    [customLocations]
  )
  const selected = allLocations.find((l) => l.id === locationId)

  const formValid =
    form.name.trim() !== '' &&
    Number.isFinite(parseFloat(form.lat)) &&
    Math.abs(parseFloat(form.lat)) <= 90 &&
    Number.isFinite(parseFloat(form.lon)) &&
    Math.abs(parseFloat(form.lon)) <= 180 &&
    /^https:\/\/.+tileset\.json$/.test(form.tilesetUrl.trim())

  const handleAdd = () => {
    if (!formValid) return
    const location: RealLocation = {
      id: `custom-${crypto.randomUUID()}`,
      name: form.name.trim(),
      lat: parseFloat(form.lat),
      lon: parseFloat(form.lon),
      tilesetUrl: form.tilesetUrl.trim(),
      geoidHeight: DEFAULT_GEOID_HEIGHT,
      custom: true,
    }
    addCustomLocation(location)
    setForm(emptyForm)
    setDialogOpen(false)
  }

  return (
    <Box>
      <Typography
        variant="overline"
        sx={{ color: 'text.secondary', display: 'block', mb: 0.75 }}
      >
        環境
      </Typography>
      <ToggleButtonGroup
        value={worldMode}
        exclusive
        fullWidth
        size="small"
        onChange={(_, value: WorldMode | null) => {
          if (value) setWorldMode(value)
        }}
        aria-label="環境モード"
        disabled={disabled}
      >
        <ToggleButton value="virtual" sx={{ gap: 0.75, py: 0.75 }}>
          <ViewInArIcon sx={{ fontSize: 16 }} />
          仮想都市
        </ToggleButton>
        <ToggleButton value="real" sx={{ gap: 0.75, py: 0.75 }}>
          <PublicIcon sx={{ fontSize: 16 }} />
          実在都市
        </ToggleButton>
      </ToggleButtonGroup>

      {worldMode === 'real' && (
        <>
          <Box sx={{ display: 'flex', gap: 0.75, mt: 1.25, alignItems: 'center' }}>
            <TextField
              select
              fullWidth
              size="small"
              label="ロケーション"
              value={selected ? locationId : PRESET_LOCATIONS[0].id}
              onChange={(e) => setLocationId(e.target.value)}
              disabled={disabled}
            >
              {allLocations.map((location) => (
                <MenuItem key={location.id} value={location.id}>
                  {location.custom ? `📍 ${location.name}` : location.name}
                </MenuItem>
              ))}
            </TextField>
            {selected?.custom && (
              <Tooltip title="このカスタム地点を削除" arrow>
                <span>
                  <IconButton
                    size="small"
                    color="error"
                    aria-label="カスタム地点を削除"
                    onClick={() => removeCustomLocation(selected.id)}
                    disabled={disabled}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
            )}
          </Box>
          <Button
            size="small"
            startIcon={<AddLocationAltIcon />}
            onClick={() => setDialogOpen(true)}
            disabled={disabled}
            sx={{ mt: 0.75 }}
          >
            カスタム地点を追加
          </Button>
          <Typography
            variant="caption"
            sx={{ display: 'block', color: 'text.secondary', lineHeight: 1.5, mt: 0.5 }}
          >
            地形・写真: 国土地理院タイル / 建物: Project PLATEAU（国土交通省）
          </Typography>
        </>
      )}

      {/* カスタム地点の追加ダイアログ */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>カスタム地点を追加</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontSize: '0.8rem', mb: 2 }}>
            PLATEAU の建築物モデル（3D Tiles）の tileset.json URL と中心座標を指定します。
            配信URLは PLATEAU のデータカタログ（plateauview.mlit.go.jp）で確認できます。
          </DialogContentText>
          <Grid container spacing={1.5}>
            <Grid size={12}>
              <TextField
                fullWidth
                size="small"
                label="地点名"
                placeholder="例: 大阪駅周辺"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </Grid>
            <Grid size={6}>
              <TextField
                fullWidth
                size="small"
                label="緯度"
                placeholder="34.7025"
                value={form.lat}
                onChange={(e) => setForm({ ...form, lat: e.target.value })}
              />
            </Grid>
            <Grid size={6}>
              <TextField
                fullWidth
                size="small"
                label="経度"
                placeholder="135.4959"
                value={form.lon}
                onChange={(e) => setForm({ ...form, lon: e.target.value })}
              />
            </Grid>
            <Grid size={12}>
              <TextField
                fullWidth
                size="small"
                label="3D Tiles URL（tileset.json）"
                placeholder="https://assets.cms.plateau.reearth.io/.../tileset.json"
                value={form.tilesetUrl}
                onChange={(e) => setForm({ ...form, tilesetUrl: e.target.value })}
                error={form.tilesetUrl !== '' && !/^https:\/\/.+tileset\.json$/.test(form.tilesetUrl.trim())}
                helperText={
                  form.tilesetUrl !== '' &&
                  !/^https:\/\/.+tileset\.json$/.test(form.tilesetUrl.trim())
                    ? 'https:// で始まり tileset.json で終わるURLを指定してください'
                    : ' '
                }
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>キャンセル</Button>
          <Button variant="contained" onClick={handleAdd} disabled={!formValid}>
            追加
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
