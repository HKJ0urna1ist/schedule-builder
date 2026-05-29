import type { ClassInfo, Course, Room, ScheduleEntry, Teacher } from '../types'
import { DAYS, PERIODS } from '../types'

interface Input {
  classes: ClassInfo[]
  teachers: Teacher[]
  rooms: Room[]
  courses: Course[]
}

function getClassSlots(classId: string): { classId: string; day: number; period: number }[] {
  const slots: { classId: string; day: number; period: number }[] = []
  for (let d = 0; d < DAYS.length; d++) {
    for (const p of PERIODS) {
      slots.push({ classId, day: d, period: p })
    }
  }
  return slots
}

function isSlotFree(
  schedule: ScheduleEntry[],
  classId: string,
  day: number,
  period: number
): boolean {
  // v3+: allow multiple parallel courses for the same class in the same slot (walking/choice courses).
  // Conflicts are enforced by teacher/room constraints instead.
  void schedule
  void classId
  void day
  void period
  return true
}

function isTeacherFree(
  schedule: ScheduleEntry[],
  teacherId: string,
  day: number,
  period: number
): boolean {
  return !schedule.some((e) => e.teacherId === teacherId && e.dayOfWeek === day && e.periodIndex === period)
}

function isRoomFree(
  schedule: ScheduleEntry[],
  roomId: string,
  day: number,
  period: number
): boolean {
  return !schedule.some((e) => e.roomId === roomId && e.dayOfWeek === day && e.periodIndex === period)
}

function getAvailableSlots(
  schedule: ScheduleEntry[],
  classId: string,
  course: Course
): { classId: string; day: number; period: number }[] {
  const allSlots = getClassSlots(classId)
  return allSlots.filter((slot) => {
    if (!isSlotFree(schedule, classId, slot.day, slot.period)) return false
    for (const group of course.groups) {
      if (!isTeacherFree(schedule, group.teacherId, slot.day, slot.period)) return false
      if (!isRoomFree(schedule, group.roomId, slot.day, slot.period)) return false
    }
    return true
  })
}

let eid = Math.random()

export function generateSchedule(input: Input, locked: ScheduleEntry[] = []): ScheduleEntry[] {
  const { courses } = input
  const schedule: ScheduleEntry[] = [...locked]

  const courseItems = courses.map((course) => {
    const alreadyPlaced = schedule.filter(
      (e) => e.classId === course.classId && e.courseId === course.id
    ).length
    const groupPlaced = alreadyPlaced / Math.max(1, course.groups.length)
    return { course, remaining: Math.max(0, course.lessonsPerWeek - groupPlaced) }
  })

  const sortedItems = [...courseItems].sort((a, b) => b.remaining - a.remaining)

  for (const item of sortedItems) {
    if (item.remaining <= 0) continue
    if (item.course.groups.length === 0) continue

    const avail = getAvailableSlots(schedule, item.course.classId, item.course)
    const shuffled = [...avail].sort(() => Math.random() - 0.5)

    let placed = 0
    for (const slot of shuffled) {
      if (placed >= item.remaining) break
      for (const group of item.course.groups) {
        schedule.push({
          id: `${Date.now()}_${eid++}`,
          classId: item.course.classId,
          courseId: item.course.id,
          teacherId: group.teacherId,
          roomId: group.roomId,
          groupLabel: group.label,
          dayOfWeek: slot.day,
          periodIndex: slot.period,
          locked: false,
        })
      }
      placed++
    }
  }

  return schedule
}

export function findConflicts(schedule: ScheduleEntry[]): {
  teacherConflicts: [ScheduleEntry, ScheduleEntry][]
  roomConflicts: [ScheduleEntry, ScheduleEntry][]
  classConflicts: [ScheduleEntry, ScheduleEntry][]
} {
  const teacherConflicts: [ScheduleEntry, ScheduleEntry][] = []
  const roomConflicts: [ScheduleEntry, ScheduleEntry][] = []
  // Class overlaps can be intentional (parallel walking courses), so we don't treat
  // them as conflicts in v3.x. Keep the field for UI compatibility.
  const classConflicts: [ScheduleEntry, ScheduleEntry][] = []

  for (let i = 0; i < schedule.length; i++) {
    for (let j = i + 1; j < schedule.length; j++) {
      const a = schedule[i], b = schedule[j]
      if (a.dayOfWeek !== b.dayOfWeek || a.periodIndex !== b.periodIndex) continue
      if (a.teacherId === b.teacherId) teacherConflicts.push([a, b])
      if (a.roomId === b.roomId) roomConflicts.push([a, b])
      // intentionally not flagging classId overlaps
    }
  }
  return { teacherConflicts, roomConflicts, classConflicts }
}
