'use client'

import { useState } from 'react'
import {
  Box,
  Button,
  Grid,
  TextField,
  Slider,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import AddIcon from '@mui/icons-material/Add'

interface Waypoint {
  id: string
  latitude: number
  longitude: number
  altitude: number
  speed: number
  rotation: number
}

interface WaypointEditorProps {
  waypoints: Waypoint[]
  setWaypoints: (waypoints: Waypoint[]) => void
  highlightedWaypointId?: string | null
}

export default function WaypointEditor({
  waypoints,
  setWaypoints,
  highlightedWaypointId = null,
}: WaypointEditorProps) {
  const [newWaypoint, setNewWaypoint] = useState<Omit<Waypoint, 'id'>>({
    latitude: 15,
    longitude: 15,
    altitude: 25,
    speed: 15, // 15km/hに制限
    rotation: 0,
  })

  const [editingWaypoint, setEditingWaypoint] = useState<Waypoint | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)

  // 建物に沿った曲線経路のサンプルウェイポイントを追加
  const addSampleWaypoints = () => {
    const samples = [
      // 高層ビル群の周りを円形に飛行（建物に沿った曲線経路）
      { latitude: 15, longitude: 15, altitude: 25, speed: 15, rotation: 0 },
      { latitude: 12, longitude: 18, altitude: 25, speed: 16, rotation: 0 },
      { latitude: 8, longitude: 20, altitude: 25, speed: 17, rotation: 0 },
      { latitude: 4, longitude: 21, altitude: 25, speed: 18, rotation: 0 },
      { latitude: 0, longitude: 22, altitude: 25, speed: 19, rotation: 0 },
      { latitude: -4, longitude: 21, altitude: 22, speed: 20, rotation: 0 },
      { latitude: -8, longitude: 20, altitude: 22, speed: 18, rotation: 0 },
      { latitude: -12, longitude: 18, altitude: 22, speed: 17, rotation: 0 },
      { latitude: -15, longitude: 15, altitude: 22, speed: 16, rotation: 0 },
      { latitude: -18, longitude: 12, altitude: 22, speed: 15, rotation: 0 },
      { latitude: -20, longitude: 8, altitude: 22, speed: 16, rotation: 0 },
      { latitude: -21, longitude: 4, altitude: 22, speed: 17, rotation: 0 },
      { latitude: -22, longitude: 0, altitude: 22, speed: 18, rotation: 0 },
      { latitude: -21, longitude: -4, altitude: 24, speed: 19, rotation: 0 },
      { latitude: -20, longitude: -8, altitude: 24, speed: 20, rotation: 0 },
      { latitude: -18, longitude: -12, altitude: 24, speed: 18, rotation: 0 },
      { latitude: -15, longitude: -15, altitude: 24, speed: 17, rotation: 0 },
      { latitude: -12, longitude: -18, altitude: 24, speed: 16, rotation: 0 },
      { latitude: -8, longitude: -20, altitude: 24, speed: 15, rotation: 0 },
      { latitude: -4, longitude: -21, altitude: 26, speed: 16, rotation: 0 },
      { latitude: 0, longitude: -22, altitude: 26, speed: 17, rotation: 0 },
      { latitude: 4, longitude: -21, altitude: 26, speed: 18, rotation: 0 },
      { latitude: 8, longitude: -20, altitude: 26, speed: 19, rotation: 0 },
      { latitude: 12, longitude: -18, altitude: 26, speed: 20, rotation: 0 },
      { latitude: 15, longitude: -15, altitude: 26, speed: 18, rotation: 0 },
      { latitude: 18, longitude: -12, altitude: 26, speed: 17, rotation: 0 },
      { latitude: 20, longitude: -8, altitude: 26, speed: 16, rotation: 0 },
      { latitude: 21, longitude: -4, altitude: 28, speed: 15, rotation: 0 },
      { latitude: 22, longitude: 0, altitude: 28, speed: 16, rotation: 0 },
      { latitude: 21, longitude: 4, altitude: 28, speed: 17, rotation: 0 },
      { latitude: 20, longitude: 8, altitude: 28, speed: 18, rotation: 0 },
      { latitude: 18, longitude: 12, altitude: 28, speed: 19, rotation: 0 },
    ]

    const sampleWaypoints = samples.map((wp, index) => ({
      id: `sample_${Date.now()}_${index}`,
      ...wp,
    }))

    setWaypoints(sampleWaypoints)
  }

  const addWaypoint = () => {
    // 速度を20km/h以下に制限
    const limitedSpeed = Math.min(newWaypoint.speed, 20)
    const waypoint: Waypoint = {
      id: Date.now().toString(),
      ...newWaypoint,
      speed: limitedSpeed,
    }
    setWaypoints([...waypoints, waypoint])

    // フォームをリセット
    setNewWaypoint({
      latitude: 15,
      longitude: 15,
      altitude: 25,
      speed: 15,
      rotation: 0,
    })
  }

  const removeWaypoint = (id: string) => {
    setWaypoints(waypoints.filter((wp) => wp.id !== id))
  }

  const editWaypoint = (waypoint: Waypoint) => {
    setEditingWaypoint(waypoint)
    setEditDialogOpen(true)
  }

  const saveEditedWaypoint = () => {
    if (editingWaypoint) {
      // 速度を20km/h以下に制限
      const limitedSpeed = Math.min(editingWaypoint.speed, 20)
      const updatedWaypoint = { ...editingWaypoint, speed: limitedSpeed }

      setWaypoints(
        waypoints.map((wp) =>
          wp.id === editingWaypoint.id ? updatedWaypoint : wp
        )
      )
      setEditDialogOpen(false)
      setEditingWaypoint(null)
    }
  }

  const updateEditingWaypoint = (field: keyof Waypoint, value: number) => {
    if (editingWaypoint) {
      setEditingWaypoint({
        ...editingWaypoint,
        [field]: value,
      })
    }
  }

  return (
    <Box>
      <Typography variant='subtitle1' gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
        ウェイポイント
      </Typography>

      <Grid container spacing={1}>
        <Grid size={6}>
          <TextField
            fullWidth
            label='緯度'
            type='number'
            value={newWaypoint.latitude}
            onChange={(e) =>
              setNewWaypoint({
                ...newWaypoint,
                latitude: parseFloat(e.target.value),
              })
            }
            inputProps={{ step: '0.1' }}
            size='small'
          />
        </Grid>
        <Grid size={6}>
          <TextField
            fullWidth
            label='経度'
            type='number'
            value={newWaypoint.longitude}
            onChange={(e) =>
              setNewWaypoint({
                ...newWaypoint,
                longitude: parseFloat(e.target.value),
              })
            }
            inputProps={{ step: '0.1' }}
            size='small'
          />
        </Grid>
        <Grid size={4}>
          <TextField
            fullWidth
            label='高度(m)'
            type='number'
            value={newWaypoint.altitude}
            onChange={(e) =>
              setNewWaypoint({
                ...newWaypoint,
                altitude: parseFloat(e.target.value),
              })
            }
            size='small'
          />
        </Grid>
        <Grid size={4}>
          <Typography variant='caption'>
            速度: {newWaypoint.speed}km/h
          </Typography>
          <Slider
            value={newWaypoint.speed}
            min={5}
            max={20} // 最大20km/hに制限
            step={1}
            onChange={(_, value) =>
              setNewWaypoint({ ...newWaypoint, speed: value as number })
            }
            size='small'
          />
        </Grid>
        <Grid size={4}>
          <Typography variant='caption'>
            回転: {newWaypoint.rotation}°
          </Typography>
          <Slider
            value={newWaypoint.rotation}
            min={0}
            max={360}
            onChange={(_, value) =>
              setNewWaypoint({ ...newWaypoint, rotation: value as number })
            }
            size='small'
          />
        </Grid>
        <Grid size={6}>
          <Tooltip title="入力した座標でウェイポイントを追加" arrow>
            <Button
              variant='contained'
              startIcon={<AddIcon />}
              onClick={addWaypoint}
              fullWidth
              size='medium'
              sx={{ py: 1 }}
            >
              追加
            </Button>
          </Tooltip>
        </Grid>
        <Grid size={6}>
          <Tooltip title="建物を周回するサンプルフライトプランを読み込む" arrow>
            <Button
              variant='outlined'
              onClick={addSampleWaypoints}
              fullWidth
              size='medium'
              sx={{ py: 1 }}
            >
              サンプル
            </Button>
          </Tooltip>
        </Grid>
      </Grid>

      <TableContainer
        component={Paper}
        variant='outlined'
        sx={{ mt: 2, maxHeight: 350, bgcolor: 'background.paper' }}
      >
        <Table size='small' stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontSize: '0.75rem', p: 1, fontWeight: 600, bgcolor: 'action.hover' }}>緯度</TableCell>
              <TableCell sx={{ fontSize: '0.75rem', p: 1, fontWeight: 600, bgcolor: 'action.hover' }}>経度</TableCell>
              <TableCell sx={{ fontSize: '0.75rem', p: 1, fontWeight: 600, bgcolor: 'action.hover' }}>高度</TableCell>
              <TableCell sx={{ fontSize: '0.75rem', p: 1, fontWeight: 600, bgcolor: 'action.hover' }}>速度</TableCell>
              <TableCell sx={{ fontSize: '0.75rem', p: 1, fontWeight: 600, bgcolor: 'action.hover' }}>操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {waypoints.map((wp) => {
              const isHighlighted = wp.id === highlightedWaypointId;
              return (
                <TableRow
                  key={wp.id}
                  sx={{
                    transition: 'all 0.3s ease',
                    bgcolor: isHighlighted ? 'primary.main' : 'transparent',
                    color: isHighlighted ? 'primary.contrastText' : 'inherit',
                    '&:hover': {
                      bgcolor: isHighlighted ? 'primary.dark' : 'action.hover',
                      transform: 'translateX(4px)',
                    },
                    animation: isHighlighted ? 'highlight 0.5s ease-in-out' : 'none',
                    '@keyframes highlight': {
                      '0%': { transform: 'scale(1)' },
                      '50%': { transform: 'scale(1.02)' },
                      '100%': { transform: 'scale(1)' },
                    },
                  }}
                >
                <TableCell sx={{ fontSize: '0.7rem', p: 0.5 }}>
                  {wp.latitude.toFixed(1)}
                </TableCell>
                <TableCell sx={{ fontSize: '0.7rem', p: 0.5 }}>
                  {wp.longitude.toFixed(1)}
                </TableCell>
                <TableCell sx={{ fontSize: '0.7rem', p: 0.5 }}>
                  {wp.altitude}m
                </TableCell>
                <TableCell sx={{ fontSize: '0.7rem', p: 0.5 }}>
                  {wp.speed}km/h
                </TableCell>
                <TableCell sx={{ p: 0.5 }}>
                  <Tooltip title="このウェイポイントを編集" arrow>
                    <IconButton
                      onClick={() => editWaypoint(wp)}
                      color='primary'
                      size='small'
                      sx={{
                        mr: 0.5,
                        '&:hover': {
                          bgcolor: 'primary.main',
                          color: 'white',
                        },
                      }}
                    >
                      <EditIcon fontSize='small' />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="このウェイポイントを削除" arrow>
                    <IconButton
                      onClick={() => removeWaypoint(wp.id)}
                      color='error'
                      size='small'
                      sx={{
                        '&:hover': {
                          bgcolor: 'error.main',
                          color: 'white',
                        },
                      }}
                    >
                      <DeleteIcon fontSize='small' />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
              );
            })}
            {waypoints.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  align='center'
                  sx={{ fontSize: '0.75rem', fontStyle: 'italic', p: 3, color: 'text.secondary' }}
                >
                  ウェイポイントが登録されていません
                  <br />
                  <Typography variant='caption' sx={{ mt: 1, display: 'block' }}>
                    3D画面をクリックまたは手動で追加
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* 編集ダイアログ */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)}>
        <DialogTitle>ウェイポイント編集</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={6}>
              <TextField
                fullWidth
                label='緯度'
                type='number'
                value={editingWaypoint?.latitude || 0}
                onChange={(e) =>
                  updateEditingWaypoint('latitude', parseFloat(e.target.value))
                }
                inputProps={{ step: '0.1' }}
                size='small'
              />
            </Grid>
            <Grid size={6}>
              <TextField
                fullWidth
                label='経度'
                type='number'
                value={editingWaypoint?.longitude || 0}
                onChange={(e) =>
                  updateEditingWaypoint('longitude', parseFloat(e.target.value))
                }
                inputProps={{ step: '0.1' }}
                size='small'
              />
            </Grid>
            <Grid size={6}>
              <TextField
                fullWidth
                label='高度(m)'
                type='number'
                value={editingWaypoint?.altitude || 0}
                onChange={(e) =>
                  updateEditingWaypoint('altitude', parseFloat(e.target.value))
                }
                size='small'
              />
            </Grid>
            <Grid size={6}>
              <TextField
                fullWidth
                label='速度(km/h)'
                type='number'
                value={editingWaypoint?.speed || 0}
                onChange={(e) =>
                  updateEditingWaypoint('speed', parseFloat(e.target.value))
                }
                inputProps={{ min: 5, max: 20, step: 1 }}
                size='small'
              />
            </Grid>
            <Grid size={12}>
              <Typography variant='caption'>
                回転: {editingWaypoint?.rotation || 0}°
              </Typography>
              <Slider
                value={editingWaypoint?.rotation || 0}
                min={0}
                max={360}
                onChange={(_, value) =>
                  updateEditingWaypoint('rotation', value as number)
                }
                size='small'
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Tooltip title="編集をキャンセルして閉じる" arrow>
            <Button onClick={() => setEditDialogOpen(false)}>キャンセル</Button>
          </Tooltip>
          <Tooltip title="変更を保存する" arrow>
            <Button onClick={saveEditedWaypoint} variant='contained'>
              保存
            </Button>
          </Tooltip>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
