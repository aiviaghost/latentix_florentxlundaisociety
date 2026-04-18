import { useState, useEffect, useMemo, useCallback, useRef } from 'react'

/**
 * Steps through client- or server-provided `playbook` frames for 3D graph highlighting.
 *
 * @param {Array<{ frame?: number, activeNodeIds?: string[], activeLinkKeys?: string[], caption?: string }>|null|undefined} playbook
 * @param {{ intervalMs?: number, onComplete?: () => void }} [options]
 */
export function useSimulationPlayback(playbook, options = {}) {
  const { intervalMs = 1600, onComplete } = options
  const [index, setIndex] = useState(0)
  const [skipped, setSkipped] = useState(false)
  const doneRef = useRef(false)

  const last = Math.max(0, (playbook?.length || 0) - 1)
  const resetKey = useMemo(
    () => (playbook?.length ? playbook.map((f) => `${f.frame}-${(f.activeNodeIds || []).length}`).join('|') : ''),
    [playbook]
  )

  useEffect(() => {
    setIndex(0)
    setSkipped(false)
    doneRef.current = false
  }, [resetKey])

  useEffect(() => {
    if (!playbook?.length || skipped) return
    if (index >= last) {
      if (!doneRef.current) {
        doneRef.current = true
        onComplete?.()
      }
      return
    }
    const t = setTimeout(() => setIndex((i) => i + 1), intervalMs)
    return () => clearTimeout(t)
  }, [playbook, index, intervalMs, skipped, last, onComplete])

  const simulationState = useMemo(() => {
    if (!playbook?.length) {
      return { activeNodes: [], activeLinks: [], isRunning: false }
    }
    const frame = playbook[Math.min(index, last)]
    return {
      activeNodes: frame.activeNodeIds || [],
      activeLinks: frame.activeLinkKeys || [],
      isRunning: !skipped && index < last,
    }
  }, [playbook, index, last, skipped])

  const skip = useCallback(() => {
    setSkipped(true)
    setIndex(last)
    if (!doneRef.current) {
      doneRef.current = true
      onComplete?.()
    }
  }, [last, onComplete])

  return {
    simulationState,
    skip,
    frameIndex: index,
    totalFrames: playbook?.length || 0,
  }
}
