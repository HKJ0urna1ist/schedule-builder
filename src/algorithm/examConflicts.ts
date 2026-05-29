import type { ExamRoomAssignment, ExamSession } from '../types'
import { rangesOverlap, toMinutes } from './time'

export type ExamConflict = {
  type: 'teacher' | 'room'
  aAssignmentId: string
  bAssignmentId: string
  message: string
}

export function findExamConflicts(sessions: ExamSession[], assigns: ExamRoomAssignment[]): ExamConflict[] {
  const byId = new Map<string, ExamSession>()
  for (const s of sessions) byId.set(s.id, s)

  const items = assigns
    .map((a) => {
      const s = byId.get(a.sessionId)
      if (!s) return null
      const st = toMinutes(s.startTime)
      const en = toMinutes(s.endTime)
      if (st == null || en == null) return null
      return { a, s, st, en }
    })
    .filter(Boolean) as { a: ExamRoomAssignment; s: ExamSession; st: number; en: number }[]

  const conflicts: ExamConflict[] = []
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const A = items[i], B = items[j]
      if (A.s.date !== B.s.date) continue
      if (!rangesOverlap(A.st, A.en, B.st, B.en)) continue

      if (A.a.roomId === B.a.roomId) {
        conflicts.push({
          type: 'room',
          aAssignmentId: A.a.id,
          bAssignmentId: B.a.id,
          message: `Room conflict: same room at ${A.s.date} ${A.s.startTime}-${A.s.endTime}`,
        })
      }

      // teacher conflict: any shared teacher between the two assignments
      const tA = new Set(A.a.invigilatorTeacherIds)
      const shared = B.a.invigilatorTeacherIds.find(t => tA.has(t))
      if (shared) {
        conflicts.push({
          type: 'teacher',
          aAssignmentId: A.a.id,
          bAssignmentId: B.a.id,
          message: `Teacher conflict: same teacher at ${A.s.date} ${A.s.startTime}-${A.s.endTime}`,
        })
      }
    }
  }
  return conflicts
}
