import base64, os

SRC = "/Users/yxq/Downloads/opencode project1/schedule/src"

# ============================================================
# store/index.ts
# ============================================================
store_ts = """import { create } from 'zustand'
import type { ClassInfo, Teacher, Room, Course, ScheduleEntry, ViewMode } from '../types'

let uid = 1
const genId = () => `${Date.now()}_${uid++}`

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
  toggleLock: (entryId: string) => void
  clearSchedule: () => void
  moveEntry: (entryId: string, to: { classId: string; day: number; period: number }) => void
  addManualEntry: (entry: ScheduleEntry) => void
  removeEntry: (entryId: string) => void
  setViewMode: (m: ViewMode) => void
  setViewTargetId: (id: string | null) => void
  setCurrentPage: (p: string) => void
}

const STORAGE_KEY = 'schedule_app_data'

function loadState(): Partial<AppState> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return {}
}

const initial = loadState()

export const useStore = create<AppState>((set, get) => {
  function save() {
    const s = get()
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      classes: s.classes, teachers: s.teachers, rooms: s.rooms,
      courses: s.courses, schedule: s.schedule
    }))
  }

  return {
    classes: initial.classes || [],
    teachers: initial.teachers || [],
    rooms: initial.rooms || [],
    courses: initial.courses || [],
    schedule: initial.schedule || [],
    viewMode: 'class',
    viewTargetId: null,
    currentPage: 'schedule',

    addClass: (c) => { set(s => ({ classes: [...s.classes, c] })); save() },
    removeClass: (id) => {
      set(s => ({ classes: s.classes.filter(c => c.id !== id), courses: s.courses.filter(c => c.classId !== id), schedule: s.schedule.filter(e => e.classId !== id) }))
      save()
    },
    updateClass: (c) => { set(s => ({ classes: s.classes.map(x => x.id === c.id ? c : x) })); save() },
    addTeacher: (t) => { set(s => ({ teachers: [...s.teachers, t] })); save() },
    removeTeacher: (id) => { set(s => ({ teachers: s.teachers.filter(t => t.id !== id), courses: s.courses.filter(c => !c.groups.some(g => g.teacherId === id)) })); save() },
    updateTeacher: (t) => { set(s => ({ teachers: s.teachers.map(x => x.id === t.id ? t : x) })); save() },
    addRoom: (r) => { set(s => ({ rooms: [...s.rooms, r] })); save() },
    removeRoom: (id) => { set(s => ({ rooms: s.rooms.filter(r => r.id !== id), courses: s.courses.filter(c => !c.groups.some(g => g.roomId === id)) })); save() },
    updateRoom: (r) => { set(s => ({ rooms: s.rooms.map(x => x.id === r.id ? r : x) })); save() },
    addCourse: (c) => { set(s => ({ courses: [...s.courses, c] })); save() },
    removeCourse: (id) => { set(s => ({ courses: s.courses.filter(c => c.id !== id), schedule: s.schedule.filter(e => e.courseId !== id) })); save() },
    updateCourse: (c) => { set(s => ({ courses: s.courses.map(x => x.id === c.id ? c : x) })); save() },
    setSchedule: (s) => { set({ schedule: s }); save() },
    toggleLock: (entryId) => { set(s => ({ schedule: s.schedule.map(e => e.id === entryId ? { ...e, locked: !e.locked } : e) })); save() },
    clearSchedule: () => { set({ schedule: [] }); save() },
    moveEntry: (entryId, to) => {
      set(s => ({ schedule: s.schedule.map(e => e.id === entryId ? { ...e, classId: to.classId, dayOfWeek: to.day, periodIndex: to.period, locked: true } : e) }))
      save()
    },
    addManualEntry: (entry) => { set(s => ({ schedule: [...s.schedule, entry] })); save() },
    removeEntry: (entryId) => { set(s => ({ schedule: s.schedule.filter(e => e.id !== entryId) })); save() },
    setViewMode: (m) => set({ viewMode: m, viewTargetId: null }),
    setViewTargetId: (id) => set({ viewTargetId: id }),
    setCurrentPage: (p) => set({ currentPage: p }),
  }
})

export { genId }"""

with open(os.path.join(SRC, "store", "index.ts"), "w") as f:
    f.write(store_ts)
print("store/index.ts OK " + str(len(store_ts)))