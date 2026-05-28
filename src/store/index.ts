import { create } from 'zustand'
import type { ClassInfo, Teacher, Room, Course, ScheduleEntry, ViewMode } from '../types'

interface AppState {
  classes: ClassInfo[]
  teachers: Teacher[]
  rooms: Room[]
  courses: Course[]
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

  setSchedule: (s: ScheduleEntry[]) => void
  toggleLock: (classId: string, day: number, period: number, groupLabel: string) => void
  clearSchedule: () => void

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
  schedule: [],
  viewMode: 'class',
  viewTargetId: null,
  currentPage: 'schedule',

  addClass: (c) => set((s) => ({ classes: [...s.classes, c] })),
  removeClass: (id) => set((s) => ({
    classes: s.classes.filter((c) => c.id !== id),
    courses: s.courses.filter((c) => c.classId !== id),
    schedule: s.schedule.filter((e) => e.classId !== id),
  })),
  updateClass: (c) => set((s) => ({
    classes: s.classes.map((x) => (x.id === c.id ? c : x)),
  })),

  addTeacher: (t) => set((s) => ({ teachers: [...s.teachers, t] })),
  removeTeacher: (id) => set((s) => ({
    teachers: s.teachers.filter((t) => t.id !== id),
    courses: s.courses.filter((c) => {
      if (c.groups.some((g) => g.teacherId === id)) return false
      return true
    }),
  })),
  updateTeacher: (t) => set((s) => ({
    teachers: s.teachers.map((x) => (x.id === t.id ? t : x)),
  })),

  addRoom: (r) => set((s) => ({ rooms: [...s.rooms, r] })),
  removeRoom: (id) => set((s) => ({
    rooms: s.rooms.filter((r) => r.id !== id),
    courses: s.courses.filter((c) => {
      if (c.groups.some((g) => g.roomId === id)) return false
      return true
    }),
  })),
  updateRoom: (r) => set((s) => ({
    rooms: s.rooms.map((x) => (x.id === r.id ? r : x)),
  })),

  addCourse: (c) => set((s) => ({ courses: [...s.courses, c] })),
  removeCourse: (id) => set((s) => ({
    courses: s.courses.filter((c) => c.id !== id),
    schedule: s.schedule.filter((e) => e.courseId !== id),
  })),
  updateCourse: (c) => set((s) => ({
    courses: s.courses.map((x) => (x.id === c.id ? c : x)),
  })),

  setSchedule: (s) => set({ schedule: s }),
  toggleLock: (classId, day, period, groupLabel) => set((s) => ({
    schedule: s.schedule.map((e) =>
      e.classId === classId && e.dayOfWeek === day && e.periodIndex === period && e.groupLabel === groupLabel
        ? { ...e, locked: !e.locked }
        : e
    ),
  })),
  clearSchedule: () => set({ schedule: [] }),

  setViewMode: (m) => set({ viewMode: m, viewTargetId: null }),
  setViewTargetId: (id) => set({ viewTargetId: id }),
  setCurrentPage: (p) => set({ currentPage: p }),
}))

export { genId }