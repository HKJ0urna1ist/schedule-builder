import { create } from 'zustand'
import type { ClassInfo, Teacher, Room, Course, FixedSchedule, ScheduleEntry, ViewMode } from '../types'

interface AppState {
  classes: ClassInfo[]
  teachers: Teacher[]
  rooms: Room[]
  courses: Course[]
  fixedSchedules: FixedSchedule[]
  schedule: ScheduleEntry[]
  viewMode: ViewMode
  viewTargetId: string | null
  currentPage: string

  addClass: (c: ClassInfo) => void
  removeClass: (id: string) => void
  updateClass: (c: ClassInfo) => void

  addTeacher: (t: Teacher) => void
  removeTeacher: (id: string) => void
  updateTeacher: (t: Teacher) => void

  addRoom: (r: Room) => void
  removeRoom: (id: string) => void
  updateRoom: (r: Room) => void

  addCourse: (c: Course) => void
  removeCourse: (id: string) => void
  updateCourse: (c: Course) => void

  addFixedSchedule: (f: FixedSchedule) => void
  removeFixedSchedule: (classId: string, day: number, period: number) => void

  setSchedule: (s: ScheduleEntry[]) => void
  toggleLock: (classId: string, day: number, period: number) => void
  moveEntry: (from: { classId: string; day: number; period: number }, to: { classId: string; day: number; period: number }) => void

  setViewMode: (m: ViewMode) => void
  setViewTargetId: (id: string | null) => void
  setCurrentPage: (p: string) => void
}

let uid = 1
const genId = () => `${Date.now()}_${uid++}`

export const useStore = create<AppState>((set) => ({
  classes: [],
  teachers: [],
  rooms: [],
  courses: [],
  fixedSchedules: [],
  schedule: [],
  viewMode: 'class',
  viewTargetId: null,
  currentPage: 'schedule',

  addClass: (c) => set((s) => ({ classes: [...s.classes, c] })),
  removeClass: (id) => set((s) => ({
    classes: s.classes.filter((c) => c.id !== id),
    fixedSchedules: s.fixedSchedules.filter((f) => f.classId !== id),
  })),
  updateClass: (c) => set((s) => ({
    classes: s.classes.map((x) => (x.id === c.id ? c : x)),
  })),

  addTeacher: (t) => set((s) => ({ teachers: [...s.teachers, t] })),
  removeTeacher: (id) => set((s) => ({
    teachers: s.teachers.filter((t) => t.id !== id),
    courses: s.courses.filter((c) => c.teacherId !== id),
  })),
  updateTeacher: (t) => set((s) => ({
    teachers: s.teachers.map((x) => (x.id === t.id ? t : x)),
  })),

  addRoom: (r) => set((s) => ({ rooms: [...s.rooms, r] })),
  removeRoom: (id) => set((s) => ({
    rooms: s.rooms.filter((r) => r.id !== id),
    classes: s.classes.filter((c) => c.roomId !== id),
  })),
  updateRoom: (r) => set((s) => ({
    rooms: s.rooms.map((x) => (x.id === r.id ? r : x)),
  })),

  addCourse: (c) => set((s) => ({ courses: [...s.courses, c] })),
  removeCourse: (id) => set((s) => ({
    courses: s.courses.filter((c) => c.id !== id),
    fixedSchedules: s.fixedSchedules.filter((f) => f.courseId !== id),
    schedule: s.schedule.filter((e) => e.courseId !== id),
  })),
  updateCourse: (c) => set((s) => ({
    courses: s.courses.map((x) => (x.id === c.id ? c : x)),
  })),

  addFixedSchedule: (f) => set((s) => {
    const filtered = s.fixedSchedules.filter(
      (x) => !(x.classId === f.classId && x.dayOfWeek === f.dayOfWeek && x.periodIndex === f.periodIndex)
    )
    return { fixedSchedules: [...filtered, f] }
  }),
  removeFixedSchedule: (classId, day, period) => set((s) => ({
    fixedSchedules: s.fixedSchedules.filter(
      (f) => !(f.classId === classId && f.dayOfWeek === day && f.periodIndex === period)
    ),
  })),

  setSchedule: (s) => set({ schedule: s }),
  toggleLock: (classId, day, period) => set((s) => ({
    schedule: s.schedule.map((e) =>
      e.classId === classId && e.dayOfWeek === day && e.periodIndex === period
        ? { ...e, locked: !e.locked }
        : e
    ),
  })),
  moveEntry: (from, to) => set((s) => {
    const newSchedule = s.schedule.map((e) => ({ ...e }))

    const fromIdx = newSchedule.findIndex(
      (e) => e.classId === from.classId && e.dayOfWeek === from.day && e.periodIndex === from.period
    )
    const toIdx = newSchedule.findIndex(
      (e) => e.classId === to.classId && e.dayOfWeek === to.day && e.periodIndex === to.period
    )

    if (fromIdx !== -1) {
      const entry = { ...newSchedule[fromIdx] }
      entry.classId = to.classId
      entry.dayOfWeek = to.day
      entry.periodIndex = to.period
      entry.locked = true

      if (toIdx !== -1) {
        const swapped = { ...newSchedule[toIdx] }
        swapped.classId = from.classId
        swapped.dayOfWeek = from.day
        swapped.periodIndex = from.period
        swapped.locked = true
        newSchedule[toIdx] = swapped
      }
      newSchedule[fromIdx] = entry

      if (toIdx === -1) {
        const filtered = newSchedule.filter((e) => e !== newSchedule[fromIdx])
        filtered.push(entry)
        return { schedule: filtered }
      }
    }

    return { schedule: newSchedule }
  }),

  setViewMode: (m) => set({ viewMode: m, viewTargetId: null }),
  setViewTargetId: (id) => set({ viewTargetId: id }),
  setCurrentPage: (p) => set({ currentPage: p }),
}))

export { genId }