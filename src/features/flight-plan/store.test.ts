import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useFlightPlanStore } from './store'

// localStorage をメモリ実装でスタブ（jsdom不要のnode環境向け）
beforeEach(() => {
  const mem = new Map<string, string>()
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => mem.get(k) ?? null,
    setItem: (k: string, v: string) => void mem.set(k, v),
    removeItem: (k: string) => void mem.delete(k),
    clear: () => mem.clear(),
  })
  useFlightPlanStore.setState({
    waypoints: [],
    selectedId: null,
    past: [],
    future: [],
  })
})

const store = () => useFlightPlanStore.getState()

describe('flight plan store — Undo/Redo', () => {
  it('addWaypoint 後に undo で元に戻り redo で復元する', () => {
    store().addWaypoint({ x: 10, z: 20, altitude: 30 })
    expect(store().waypoints).toHaveLength(1)

    store().undo()
    expect(store().waypoints).toHaveLength(0)

    store().redo()
    expect(store().waypoints).toHaveLength(1)
    expect(store().waypoints[0].x).toBe(10)
  })

  it('新しい操作は redo 履歴を破棄する', () => {
    store().addWaypoint({ x: 0, z: 0 })
    store().addWaypoint({ x: 1, z: 1 })
    store().undo() // 1個に戻る
    expect(store().future).toHaveLength(1)

    store().addWaypoint({ x: 2, z: 2 }) // 分岐 → future 破棄
    expect(store().future).toHaveLength(0)
    store().redo() // 何も起きない
    expect(store().waypoints.map((w) => w.x)).toEqual([0, 2])
  })

  it('履歴が空のとき undo/redo は無害', () => {
    expect(() => store().undo()).not.toThrow()
    expect(() => store().redo()).not.toThrow()
    expect(store().waypoints).toHaveLength(0)
  })

  it('ドラッグは beginDrag で1回だけ履歴を積む', () => {
    const wp = store().addWaypoint({ x: 0, z: 0 })
    const pastLenBefore = store().past.length

    store().beginDrag()
    store().dragWaypoint(wp.id, 5, 5)
    store().dragWaypoint(wp.id, 6, 6)
    store().dragWaypoint(wp.id, 7, 7)

    // beginDrag の1回分だけ履歴が増える
    expect(store().past.length).toBe(pastLenBefore + 1)
    expect(store().waypoints[0].x).toBe(7)

    store().undo() // ドラッグ開始前の位置に戻る
    expect(store().waypoints[0].x).toBe(0)
  })
})
