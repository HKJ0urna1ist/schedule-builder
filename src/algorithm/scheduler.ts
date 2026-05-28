import type { ClassInfo, Course, FixedSchedule, Room, ScheduleEntry, Teacher } from '../types'
import { DAYS, PERIODS } from '../types'

interface Input {
  classes: ClassInfo[]
  teachers: Teacher[]
  rooms: Room[]
  courses: Course[]
  fixedSchedules: FixedSchedule[]
  lockedSchedule: ScheduleEntry[]
}

interface Slot {
  classId: string
  day: number
  period: number
}

function getAllSlots(classes: ClassInfo[]): Slot[] {
  const slots: Slot[] = []
  for (const c of classes) {
    for (let d = 0; d < DAYS.length; d++) {
      for (const p of PERIODS) {
        slots.push({ classId: c.id, day: d, period: p })
      }
    }
  }
  return slots
}

function isTaken(schedule: ScheduleEntry[], classId: string, day: number, period: number): boolean {
  return schedule.some(
    (e) => e.classId === classId && e.dayOfWeek === day && e.periodIndex === period
  )
}

function isTeacherBusy(schedule: ScheduleEntry[], teacherId: string, day: number, period: number): boolean {
  return schedule.some(
    (e) => e.teacherId === teacherId && e.dayOfWeek === day && e.periodIndex === period
  )
}

function isRoomBusy(schedule: ScheduleEntry[], roomId: string, day: number, period: number): boolean {
  return schedule.some(
    (e) => e.roomId === roomId && e.dayOfWeek === day && e.periodIndex === period
  )
}

function isFixedSlot(fixedSchedules: FixedSchedule[], classId: string, day: number, period: number): boolean {
  return fixedSchedules.some(
    (f) => f.classId === classId && f.dayOfWeek === day && f.periodIndex === period
  )
}

function getAvailableSlots(
  allSlots: Slot[],
  schedule: ScheduleEntry[],
  fixedSchedules: FixedSchedule[],
  lockedSchedule: ScheduleEntry[],
  classId: string,
  teacherId: string,
  roomId: string
): Slot[] {
  const locked = lockedSchedule.filter((e) => e.locked)
  const combined = [...schedule, ...locked]

  return allSlots.filter((s) => {
    if (s.classId !== classId) return false
    if (isTaken(combined, classId, s.day, s.period)) return false
    if (isFixedSlot(fixedSchedules, classId, s.day, s.period)) return false
    if (isTeacherBusy(combined, teacherId, s.day, s.period)) return false
    if (isRoomBusy(combined, roomId, s.day, s.period)) return false
    return true
  })
}

function getLockedSlotsByClass(lockedSchedule: ScheduleEntry[], classId: string): number {
  return lockedSchedule.filter((e) => e.classId === classId && e.locked).length
}

function getScheduledCount(schedule: ScheduleEntry[], classId: string, courseId: string): number {
  return schedule.filter((e) => e.classId === classId && e.courseId === courseId).length
}

export function generateSchedule(input: Input): ScheduleEntry[] {
  const { classes, teachers, rooms, courses, fixedSchedules, lockedSchedule } = input
  const allSlots = getAllSlots(classes)
  const schedule: ScheduleEntry[] = []

  const teacherMap = new Map(teachers.map((t) => [t.id, t]))
  const roomMap = new Map(rooms.map((r) => [r.id, r]))

  const sortedClasses = [...classes].sort(() => Math.random() - 0.5)

  const classCourses = new Map<string, { course: Course; remaining: number }[]>()
  for (const c of sortedClasses) {
    const items = c.courseIds
      .map((cid) => courses.find((co) => co.id === cid))
      .filter((co): co is Course => !!co)
      .map((co) => {
        const alreadyScheduled = getScheduledCount(schedule, c.id, co.id) +
          getLockedSlotsByClass(lockedSchedule, c.id)
        return { course: co, remaining: Math.max(0, co.lessonsPerWeek - alreadyScheduled) }
      })
    classCourses.set(c.id, items)
  }

  for (const c of sortedClasses) {
    const roomId = c.roomId
    const items = classCourses.get(c.id) || []

    for (const { course, remaining } of items) {
      if (remaining <= 0) continue

      const teacher = teacherMap.get(course.teacherId)
      if (!teacher) continue

      const room = roomMap.get(roomId)
      if (!room) continue

      let placed = 0
      const available = getAvailableSlots(
        allSlots, schedule, fixedSchedules, lockedSchedule,
        c.id, teacher.id, roomId
      )

      const shuffled = [...available].sort(() => Math.random() - 0.5)

      for (const slot of shuffled) {
        if (placed >= remaining) break
        schedule.push({
          classId: c.id,
          courseId: course.id,
          teacherId: teacher.id,
          roomId: roomId,
          dayOfWeek: slot.day,
          periodIndex: slot.period,
          locked: false,
        })
        placed++
      }
    }
  }

  for (const fixed of fixedSchedules) {
    if (!fixed.courseId) continue
    const teacher = courses.find((co) => co.id === fixed.courseId)?.teacherId
    if (!teacher) continue
    schedule.push({
      classId: fixed.classId,
      courseId: fixed.courseId,
      teacherId: teacher,
      roomId: classes.find((c) => c.id === fixed.classId)?.roomId || '',
      dayOfWeek: fixed.dayOfWeek,
      periodIndex: fixed.periodIndex,
      locked: true,
    })
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
  const classConflicts: [ScheduleEntry, ScheduleEntry][] = []

  for (let i = 0; i < schedule.length; i++) {
    for (let j = i + 1; j < schedule.length; j++) {
      const a = schedule[i], b = schedule[j]
      if (a.dayOfWeek !== b.dayOfWeek || a.periodIndex !== b.periodIndex) continue

      if (a.teacherId === b.teacherId && a.classId !== b.classId) {
        teacherConflicts.push([a, b])
      }
      if (a.roomId === b.roomId && a.classId !== b.classId) {
        roomConflicts.push([a, b])
      }
      if (a.classId === b.classId) {
        classConflicts.push([a, b])
      }
    }
  }

  return { teacherConflicts, roomConflicts, classConflicts }
}