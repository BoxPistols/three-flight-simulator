'use client'

import { useRef, useState } from 'react'
import { Alert, Button, Snackbar, Stack, Tooltip } from '@mui/material'
import FileDownloadIcon from '@mui/icons-material/FileDownload'
import FileUploadIcon from '@mui/icons-material/FileUpload'
import { parsePlan, serializePlan } from '../model'
import { useFlightPlanStore } from '../store'
import { PRESET_LOCATIONS } from '@/features/world/locations'

/** フライトプランのJSONエクスポート / インポート */
export default function PlanIO({ disabled }: { disabled?: boolean }) {
  const waypoints = useFlightPlanStore((s) => s.waypoints)
  const replacePlan = useFlightPlanStore((s) => s.replacePlan)
  const worldMode = useFlightPlanStore((s) => s.worldMode)
  const locationId = useFlightPlanStore((s) => s.locationId)
  const customLocations = useFlightPlanStore((s) => s.customLocations)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState<{
    severity: 'success' | 'error'
    text: string
  } | null>(null)

  const handleExport = () => {
    // 実在都市モードではシーン原点の緯度経度を含めてジオリファレンスする
    const location =
      worldMode === 'real'
        ? [...PRESET_LOCATIONS, ...customLocations].find((l) => l.id === locationId)
        : undefined
    const json = JSON.stringify(
      serializePlan(
        waypoints,
        location ? { origin: { lat: location.lat, lon: location.lon } } : undefined
      ),
      null,
      2
    )
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'flight-plan.json'
    anchor.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = async (file: File) => {
    try {
      const waypoints = parsePlan(JSON.parse(await file.text()))
      replacePlan(waypoints)
      setMessage({
        severity: 'success',
        text: `${waypoints.length}個のウェイポイントを読み込みました`,
      })
    } catch (error) {
      setMessage({
        severity: 'error',
        text:
          error instanceof Error
            ? error.message
            : 'プランの読み込みに失敗しました',
      })
    }
  }

  return (
    <>
      <Stack direction="row" spacing={1}>
        <Tooltip title="プランをJSONファイルとして保存" arrow>
          <span style={{ flex: 1 }}>
            <Button
              variant="outlined"
              size="small"
              fullWidth
              startIcon={<FileDownloadIcon />}
              onClick={handleExport}
              disabled={disabled || waypoints.length === 0}
            >
              エクスポート
            </Button>
          </span>
        </Tooltip>
        <Tooltip title="JSONファイルからプランを読み込み（現在のプランを置き換え）" arrow>
          <span style={{ flex: 1 }}>
            <Button
              variant="outlined"
              size="small"
              fullWidth
              startIcon={<FileUploadIcon />}
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled}
            >
              インポート
            </Button>
          </span>
        </Tooltip>
      </Stack>
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json,.json"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleImport(file)
          e.target.value = ''
        }}
      />
      <Snackbar
        open={message !== null}
        autoHideDuration={4000}
        onClose={() => setMessage(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={message?.severity ?? 'success'}
          onClose={() => setMessage(null)}
          sx={{ width: '100%' }}
        >
          {message?.text}
        </Alert>
      </Snackbar>
    </>
  )
}
