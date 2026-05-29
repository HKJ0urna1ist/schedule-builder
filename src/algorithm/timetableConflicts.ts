import type { ExamRoomAssignment, ExamSession, ScheduleEntry, TimeProfile, TimetableOverride } from '../types'
import { rangesOverlap, toMinutes } from './time'

function weekdayIndexFromISODate(dateISO: string): number | null {
  // JS: 0=Sun..6=Sat. We want Mon=0..Fri=4.
  const d = new Date(dateISO + 'T00:00:00')
  if (Number.isNaN(d.getTime())) return null
  const js = d.getDay()
  const map: Record<number, number> = { 1: 0, 2: 1, 3: 2, 4: 3, 5: 4 }
  return map[js] ?? null
}

function inRange(dateISO: string, startISO: string, endISO: string): boolean {
  return dateISO >= startISO && dateISO <= endISO
}

function pickOverrideForDate(overrides: TimetableOverride[], dateISO: string): TimetableOverride | null {
  // If multiple overlap, prefer the one with the latest startDate (more specific).
  const hits = overrides.filter(ov => ov.startDate && ov.endDate && inRange(dateISO, ov.startDate, ov.endDate))
  if (!hits.length) return null
  return hits.sort((a, b) => (b.startDate || '').localeCompare(a.startDate || ''))[0]
}

function periodRange(timeProfile: TimeProfile, periodIndex: number): { startMin: number; endMin: number } | null {
  const pr = timeProfile.periods.find(p => p.periodIndex === periodIndex)
  if (!pr) return null
  const st = toMinutes(pr.start)
  const en = toMinutes(pr.end)
  if (st == null || en == null) return null
  return { startMin: st, endMin: en }
}

export type ExamVsTimetableConflict = {
  type: 'teacher' | 'room'
  assignmentId: string
  entryId: string
  date: string
  message: string
}

export function findExamVsTimetableConflicts(opts: {
  timeProfile: TimeProfile
  overrides: TimetableOverride[]
  baseSchedule: ScheduleEntry[]
  examSessions: ExamSession[]
  examAssignments: ExamRoomAssignment[]
}): ExamVsTimetableConflict[] {
  const { timeProfile, overrides, baseSchedule, examSessions, examAssignments } = opts

  const sessionById = new Map(examSessions.map(s => [s.id, s]))
  const conflicts: ExamVsTimetableConflict[] = []

  for (const asg of examAssignments) {
    const sess = sessionById.get(asg.sessionId)
    if (!sess) continue
    const dayIdx = weekdayIndexFromISODate(sess.date)
    if (dayIdx == null) continue

    const exStart = toMinutes(sess.startTime)
    const exEnd = toMinutes(sess.endTime)
    if (exStart == null || exEnd == null) continue

    const ov = pickOverrideForDate(overrides, sess.date)
    const schedule = ov ? ov.schedule : baseSchedule

    const sameDayEntries = schedule.filter(e => e.dayOfWeek === dayIdx)
    for (const ent of sameDayEntries) {
      const pr = periodRange(timeProfile, ent.periodIndex)
      if (!pr) continue
      if (!rangesOverlap(exStart, exEnd, pr.startMin, pr.endMin)) continue

      if (asg.roomId && ent.roomId && asg.roomId === ent.roomId) {
        conflicts.push({
          type: 'room',
          assignmentId: asg.id,
          entryId: ent.id,
          date: sess.date,
          message: `Room conflict with timetable on ${sess.date}`,
        })
      }

      const sharedTeacher = asg.invigilatorTeacherIds.find(t => t && t === ent.teacherId)
      if (sharedTeacher) {
        conflicts.push({
          type: 'teacher',
          assignmentId: asg.id,
          entryId: ent.id,
          date: sess.date,
          message: `Teacher conflict with timetable on ${sess.date}`,
        })
      }
    }
  }

  return conflicts
}
