/** 3Dビューアのカラーパレット */
export const VIEWER_COLORS = {
  drone: {
    body: '#3b82f6',
    propeller: '#1e293b',
  },
  waypoint: {
    start: '#10b981',
    end: '#ef4444',
    middle: '#f59e0b',
    emissive: {
      start: '#064e3b',
      end: '#7f1d1d',
      middle: '#78350f',
    },
    pole: '#6b7280',
    selectedRing: '#3b82f6',
  },
  environment: {
    ground: '#a3a380',
    sky: '#7dd3fc',
  },
  flightPath: '#3b82f6',
  flightPathWarning: '#ef4444',
} as const
