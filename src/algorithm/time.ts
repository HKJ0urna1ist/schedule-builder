// Utilities for minute-precision overlap checks.

export function toMinutes(hhmm: string): number | null {
  const m = hhmm.trim().match(/^(\d{1,2}):(\d{2})$/)
  if (!m) return null
  const h = Number(m[1])
  const min = Number(m[2])
  if (!Number.isFinite(h) || !Number.isFinite(min)) return null
  if (h < 0 || h > 23 || min < 0 || min > 59) return null
  return h * 60 + min
}

export function rangesOverlap(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  // Treat as half-open intervals [start, end)
  if (aEnd <= aStart) return false
  if (bEnd <= bStart) return false
  return aStart < bEnd && bStart < aEnd
}
