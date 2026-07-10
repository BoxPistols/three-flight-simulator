'use client'

import { useEffect, useRef, useState } from 'react'
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
  Paper,
  Slider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep'
import EditIcon from '@mui/icons-material/Edit'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp'
import MapIcon from '@mui/icons-material/Map'
import {
  ALTITUDE_MAX_M,
  ALTITUDE_MIN_M,
  DEFAULT_SPEED_KMH,
  SPEED_MAX_KMH,
  SPEED_MIN_KMH,
  type Waypoint,
} from '../model'
import { useFlightPlanStore } from '../store'

const headerCellSx = {
  fontSize: '0.68rem',
  p: 0.75,
  fontWeight: 700,
  letterSpacing: '0.04em',
  color: 'text.secondary',
  bgcolor: 'background.paper',
  whiteSpace: 'nowrap',
} as const

const bodyCellSx = {
  fontSize: '0.72rem',
  p: 0.5,
  fontFamily: 'var(--font-mono), monospace',
  fontVariantNumeric: 'tabular-nums',
  whiteSpace: 'nowrap',
} as const

const actionButtonSx = { p: 0.4 } as const

/** 行頭の役割インジケータ（開始=緑 / 終了=ローズ / 中間=アンバー） */
const roleColor = (index: number, count: number): string =>
  index === 0 ? '#10b981' : index === count - 1 ? '#f43f5e' : '#f59e0b'

/**
 * ウェイポイント一覧・追加・編集。
 * 座標はシーン座標（X=東西 [m] / Z=南北 [m]）— 3D画面の位置と一致する。
 */
export default function WaypointEditor({ disabled }: { disabled?: boolean }) {
  const waypoints = useFlightPlanStore((s) => s.waypoints)
  const selectedId = useFlightPlanStore((s) => s.selectedId)
  const clickAltitude = useFlightPlanStore((s) => s.clickAltitude)
  const addWaypoint = useFlightPlanStore((s) => s.addWaypoint)
  const updateWaypoint = useFlightPlanStore((s) => s.updateWaypoint)
  const removeWaypoint = useFlightPlanStore((s) => s.removeWaypoint)
  const moveWaypoint = useFlightPlanStore((s) => s.moveWaypoint)
  const selectWaypoint = useFlightPlanStore((s) => s.selectWaypoint)
  const setClickAltitude = useFlightPlanStore((s) => s.setClickAltitude)
  const loadSample = useFlightPlanStore((s) => s.loadSample)
  const clearPlan = useFlightPlanStore((s) => s.clearPlan)

  const [form, setForm] = useState({
    x: 0,
    z: 0,
    altitude: 30,
    speed: DEFAULT_SPEED_KMH,
  })
  const [editing, setEditing] = useState<Waypoint | null>(null)
  const [confirmClearOpen, setConfirmClearOpen] = useState(false)
  const selectedRowRef = useRef<HTMLTableRowElement>(null)

  // 3D画面でマーカーを選択したらテーブル側をスクロールして見せる
  useEffect(() => {
    selectedRowRef.current?.scrollIntoView({
      block: 'nearest',
      behavior: 'smooth',
    })
  }, [selectedId])

  const numberField =
    (field: 'x' | 'z' | 'altitude') =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseFloat(e.target.value)
      setForm((f) => ({ ...f, [field]: Number.isFinite(value) ? value : 0 }))
    }

  return (
    <Box>
      <Typography
        variant="overline"
        sx={{ color: 'text.secondary', display: 'block', mb: 0.75 }}
      >
        ウェイポイント追加
      </Typography>

      {/* 追加フォーム */}
      <Grid container spacing={1}>
        <Grid size={4}>
          <TextField
            fullWidth
            label="X（東西）[m]"
            type="number"
            value={form.x}
            onChange={numberField('x')}
            size="small"
            disabled={disabled}
          />
        </Grid>
        <Grid size={4}>
          <TextField
            fullWidth
            label="Z（南北）[m]"
            type="number"
            value={form.z}
            onChange={numberField('z')}
            size="small"
            disabled={disabled}
          />
        </Grid>
        <Grid size={4}>
          <TextField
            fullWidth
            label="高度 [m]"
            type="number"
            value={form.altitude}
            onChange={numberField('altitude')}
            size="small"
            disabled={disabled}
            slotProps={{
              htmlInput: { min: ALTITUDE_MIN_M, max: ALTITUDE_MAX_M },
            }}
          />
        </Grid>
        <Grid size={12}>
          <Typography variant="caption">
            速度: {form.speed} km/h（上限 {SPEED_MAX_KMH} km/h）
          </Typography>
          <Slider
            value={form.speed}
            min={SPEED_MIN_KMH}
            max={SPEED_MAX_KMH}
            step={1}
            onChange={(_, value) =>
              setForm((f) => ({ ...f, speed: value as number }))
            }
            size="small"
            disabled={disabled}
          />
        </Grid>
        <Grid size={12}>
          <Tooltip title="入力した座標にウェイポイントを追加" arrow>
            <span style={{ display: 'block' }}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => addWaypoint(form)}
                fullWidth
                size="medium"
                disabled={disabled}
              >
                追加
              </Button>
            </span>
          </Tooltip>
        </Grid>
        <Grid size={6}>
          <Tooltip title="建物外周を周回するサンプルプランを読み込み（現在のプランを置き換え）" arrow>
            <span style={{ display: 'block' }}>
              <Button
                variant="outlined"
                startIcon={<MapIcon />}
                onClick={loadSample}
                fullWidth
                size="small"
                disabled={disabled}
              >
                サンプル
              </Button>
            </span>
          </Tooltip>
        </Grid>
        <Grid size={6}>
          <Tooltip title="すべてのウェイポイントを削除" arrow>
            <span style={{ display: 'block' }}>
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteSweepIcon />}
                onClick={() => setConfirmClearOpen(true)}
                fullWidth
                size="small"
                disabled={disabled || waypoints.length === 0}
              >
                全削除
              </Button>
            </span>
          </Tooltip>
        </Grid>
      </Grid>

      {/* 3Dクリック追加の高度設定 */}
      <TextField
        fullWidth
        label="3D画面クリックで追加するときの高度 [m]"
        type="number"
        value={clickAltitude}
        onChange={(e) => {
          const value = parseFloat(e.target.value)
          if (Number.isFinite(value)) setClickAltitude(value)
        }}
        size="small"
        disabled={disabled}
        sx={{ mt: 1.5 }}
        slotProps={{ htmlInput: { min: ALTITUDE_MIN_M, max: ALTITUDE_MAX_M } }}
      />

      {/* 一覧テーブル */}
      <TableContainer
        component={Paper}
        variant="outlined"
        sx={{ mt: 1.5, maxHeight: 320, bgcolor: 'background.paper' }}
      >
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={headerCellSx}>#</TableCell>
              <TableCell sx={headerCellSx}>X [m]</TableCell>
              <TableCell sx={headerCellSx}>Z [m]</TableCell>
              <TableCell sx={headerCellSx}>高度</TableCell>
              <TableCell sx={headerCellSx}>速度</TableCell>
              <TableCell sx={headerCellSx} align="right">
                操作
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {waypoints.map((wp, index) => {
              const isSelected = wp.id === selectedId
              return (
                <TableRow
                  key={wp.id}
                  ref={isSelected ? selectedRowRef : undefined}
                  hover
                  selected={isSelected}
                  onClick={() => selectWaypoint(isSelected ? null : wp.id)}
                  sx={{ cursor: 'pointer' }}
                >
                  <TableCell sx={{ ...bodyCellSx, fontWeight: 700 }}>
                    <Box
                      component="span"
                      sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 0.6,
                      }}
                    >
                      <Box
                        component="span"
                        sx={{
                          width: 7,
                          height: 7,
                          borderRadius: '50%',
                          bgcolor: roleColor(index, waypoints.length),
                          flexShrink: 0,
                        }}
                      />
                      {index + 1}
                    </Box>
                  </TableCell>
                  <TableCell sx={bodyCellSx}>{wp.x.toFixed(1)}</TableCell>
                  <TableCell sx={bodyCellSx}>{wp.z.toFixed(1)}</TableCell>
                  <TableCell sx={bodyCellSx}>{wp.altitude}m</TableCell>
                  <TableCell sx={bodyCellSx}>{wp.speed}km/h</TableCell>
                  <TableCell sx={{ p: 0.25, whiteSpace: 'nowrap' }} align="right">
                    <IconButton
                      aria-label={`ウェイポイント${index + 1}を上へ`}
                      onClick={(e) => {
                        e.stopPropagation()
                        moveWaypoint(wp.id, 'up')
                      }}
                      size="small"
                      sx={actionButtonSx}
                      disabled={disabled || index === 0}
                    >
                      <KeyboardArrowUpIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                    <IconButton
                      aria-label={`ウェイポイント${index + 1}を下へ`}
                      onClick={(e) => {
                        e.stopPropagation()
                        moveWaypoint(wp.id, 'down')
                      }}
                      size="small"
                      sx={actionButtonSx}
                      disabled={disabled || index === waypoints.length - 1}
                    >
                      <KeyboardArrowDownIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                    <IconButton
                      aria-label={`ウェイポイント${index + 1}を編集`}
                      onClick={(e) => {
                        e.stopPropagation()
                        setEditing(wp)
                      }}
                      color="primary"
                      size="small"
                      sx={actionButtonSx}
                      disabled={disabled}
                    >
                      <EditIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                    <IconButton
                      aria-label={`ウェイポイント${index + 1}を削除`}
                      onClick={(e) => {
                        e.stopPropagation()
                        removeWaypoint(wp.id)
                      }}
                      color="error"
                      size="small"
                      sx={actionButtonSx}
                      disabled={disabled}
                    >
                      <DeleteIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </TableCell>
                </TableRow>
              )
            })}
            {waypoints.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  align="center"
                  sx={{ p: 3.5, color: 'text.secondary', border: 0 }}
                >
                  <MapIcon
                    sx={{ fontSize: 34, opacity: 0.35, display: 'block', mx: 'auto', mb: 1 }}
                  />
                  <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5 }}>
                    まだウェイポイントがありません
                  </Typography>
                  <Typography variant="caption" sx={{ display: 'block', lineHeight: 1.6 }}>
                    3D画面の地面をクリックするか、
                    <br />
                    上のフォームから追加してください
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* 編集ダイアログ */}
      <Dialog open={editing !== null} onClose={() => setEditing(null)}>
        <DialogTitle>ウェイポイント編集</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5, minWidth: 300 }}>
            <Grid size={6}>
              <TextField
                fullWidth
                label="X（東西）[m]"
                type="number"
                value={editing?.x ?? 0}
                onChange={(e) => {
                  const value = parseFloat(e.target.value)
                  if (editing && Number.isFinite(value))
                    setEditing({ ...editing, x: value })
                }}
                size="small"
              />
            </Grid>
            <Grid size={6}>
              <TextField
                fullWidth
                label="Z（南北）[m]"
                type="number"
                value={editing?.z ?? 0}
                onChange={(e) => {
                  const value = parseFloat(e.target.value)
                  if (editing && Number.isFinite(value))
                    setEditing({ ...editing, z: value })
                }}
                size="small"
              />
            </Grid>
            <Grid size={6}>
              <TextField
                fullWidth
                label="高度 [m]"
                type="number"
                value={editing?.altitude ?? 0}
                onChange={(e) => {
                  const value = parseFloat(e.target.value)
                  if (editing && Number.isFinite(value))
                    setEditing({ ...editing, altitude: value })
                }}
                size="small"
                slotProps={{
                  htmlInput: { min: ALTITUDE_MIN_M, max: ALTITUDE_MAX_M },
                }}
              />
            </Grid>
            <Grid size={6}>
              <TextField
                fullWidth
                label="速度 [km/h]"
                type="number"
                value={editing?.speed ?? 0}
                onChange={(e) => {
                  const value = parseFloat(e.target.value)
                  if (editing && Number.isFinite(value))
                    setEditing({ ...editing, speed: value })
                }}
                size="small"
                slotProps={{
                  htmlInput: { min: SPEED_MIN_KMH, max: SPEED_MAX_KMH, step: 1 },
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditing(null)}>キャンセル</Button>
          <Button
            variant="contained"
            onClick={() => {
              if (editing) {
                updateWaypoint(editing.id, {
                  x: editing.x,
                  z: editing.z,
                  altitude: editing.altitude,
                  speed: editing.speed,
                })
                setEditing(null)
              }
            }}
          >
            保存
          </Button>
        </DialogActions>
      </Dialog>

      {/* 全削除の確認 */}
      <Dialog open={confirmClearOpen} onClose={() => setConfirmClearOpen(false)}>
        <DialogTitle>プランを全削除しますか？</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {waypoints.length}
            個のウェイポイントをすべて削除します。この操作は元に戻せません。
            必要ならエクスポートで保存してから削除してください。
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmClearOpen(false)}>キャンセル</Button>
          <Button
            color="error"
            variant="contained"
            onClick={() => {
              clearPlan()
              setConfirmClearOpen(false)
            }}
          >
            全削除
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
