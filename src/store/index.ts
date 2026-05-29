import { create } from 'zustand'
import type {
  ClassInfo,
  Teacher,
  Room,
  Course,
  ScheduleEntry,
  ViewMode,
  CycleProfile,
  TimeProfile,
  TimetableOverride,
  ExamSession,
  ExamRoomAssignment,
} from '../types'
import { PERIODS, PERIOD_LABELS } from '../types'

let uid = 1
const genId = () => `${Date.now()}_${uid++}`

interface AppState {
  // Active cycle data (mirrors selected cycle)
  classes: ClassInfo[]
  teachers: Teacher[]
  rooms: Room[]
  courses: Course[]
  schedule: ScheduleEntry[]

  overrides: TimetableOverride[]
  examSessions: ExamSession[]
  examAssignments: ExamRoomAssignment[]

  cycles: CycleProfile[]
  activeCycleId: string
  timeProfiles: TimeProfile[]
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

  // Cycle / profile management
  addCycle: (name: string) => void
  cloneCycle: (cycleId: string, name: string) => void
  renameCycle: (cycleId: string, name: string) => void
  deleteCycle: (cycleId: string) => void
  setActiveCycle: (cycleId: string) => void

  // Overrides
  addOverride: (ov: TimetableOverride) => void
  updateOverride: (ov: TimetableOverride) => void
  deleteOverride: (id: string) => void

  // Time profiles
  addTimeProfile: (p: TimeProfile) => void
  updateTimeProfile: (p: TimeProfile) => void
  deleteTimeProfile: (id: string) => void
  setCycleTimeProfile: (timeProfileId: string) => void

  // Exams
  addExamSession: (s: ExamSession) => void
  updateExamSession: (s: ExamSession) => void
  deleteExamSession: (id: string) => void
  addExamAssignment: (a: ExamRoomAssignment) => void
  updateExamAssignment: (a: ExamRoomAssignment) => void
  deleteExamAssignment: (id: string) => void
  setViewMode: (m: ViewMode) => void
  setViewTargetId: (id: string | null) => void
  setCurrentPage: (p: string) => void
}

const STORAGE_KEY_V1 = 'schedule_app_data'
const STORAGE_KEY_V2 = 'schedule_app_data_v2'

function parsePeriodLabel(label: string): { start: string; end: string } | null {
  const m = label.trim().match(/^\s*(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})\s*$/)
  if (!m) return null
  return { start: m[1], end: m[2] }
}

function makeDefaultTimeProfile(): TimeProfile {
  const periods = PERIODS.map((p, idx) => {
    const parsed = parsePeriodLabel(PERIOD_LABELS[idx] ?? '')
    return { periodIndex: p, start: parsed?.start ?? '08:00', end: parsed?.end ?? '08:45' }
  })
  return { id: 'time_default', name: 'Default', periods }
}

type PersistedV2 = {
  cycles: CycleProfile[]
  activeCycleId: string
  timeProfiles: TimeProfile[]
}

function loadPersistedV2(): PersistedV2 | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_V2)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function loadLegacyV1(): any | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_V1)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function now() { return Date.now() }

function makeCycleFromLegacy(legacy: any, timeProfileId: string): CycleProfile {
  return {
    id: genId(),
    name: 'Default',
    createdAt: now(),
    updatedAt: now(),
    timeProfileId,
    classes: legacy?.classes || [],
    teachers: legacy?.teachers || [],
    rooms: legacy?.rooms || [],
    courses: legacy?.courses || [],
    schedule: legacy?.schedule || [],
    overrides: [],
    examSessions: [],
    examAssignments: [],
  }
}

export const useStore = create<AppState>((set, get) => {
  function saveV2() {
    const s = get()
    const payload: PersistedV2 = {
      cycles: s.cycles,
      activeCycleId: s.activeCycleId,
      timeProfiles: s.timeProfiles,
    }
    localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(payload))
  }

  function syncActiveFromCycles(cycles: CycleProfile[], activeId: string) {
    const cy = cycles.find(c => c.id === activeId) || cycles[0]
    if (!cy) return
    set({
      activeCycleId: cy.id,
      classes: cy.classes,
      teachers: cy.teachers,
      rooms: cy.rooms,
      courses: cy.courses,
      schedule: cy.schedule,
      overrides: cy.overrides,
      examSessions: cy.examSessions,
      examAssignments: cy.examAssignments,
    })
  }

  const persisted = loadPersistedV2()
  const defaultTime = makeDefaultTimeProfile()
  let cycles: CycleProfile[]
  let activeCycleId: string
  let timeProfiles: TimeProfile[]

  if (persisted?.cycles?.length) {
    cycles = persisted.cycles
    activeCycleId = persisted.activeCycleId || persisted.cycles[0].id
    timeProfiles = persisted.timeProfiles?.length ? persisted.timeProfiles : [defaultTime]
  } else {
    const legacy = loadLegacyV1()
    timeProfiles = [defaultTime]
    const cycle = makeCycleFromLegacy(legacy, defaultTime.id)
    cycles = [cycle]
    activeCycleId = cycle.id
    // best-effort migration: keep legacy key for now
    try { localStorage.setItem(STORAGE_KEY_V2, JSON.stringify({ cycles, activeCycleId, timeProfiles })) } catch {}
  }

  const active = cycles.find(c => c.id === activeCycleId) || cycles[0]

  return {
    classes: active?.classes || [],
    teachers: active?.teachers || [],
    rooms: active?.rooms || [],
    courses: active?.courses || [],
    schedule: active?.schedule || [],
    overrides: active?.overrides || [],
    examSessions: active?.examSessions || [],
    examAssignments: active?.examAssignments || [],
    cycles,
    activeCycleId: active?.id || activeCycleId,
    timeProfiles,

    viewMode: 'class',
    viewTargetId: null,
    currentPage: 'schedule',

    addClass: (c) => {
      set(s => ({ classes: [...s.classes, c] }))
      set(s => ({ cycles: s.cycles.map(cy => cy.id === s.activeCycleId ? { ...cy, classes: [...s.classes, c], updatedAt: now() } : cy) }))
      saveV2()
    },
    removeClass: (id) => {
      set(s => ({
        classes: s.classes.filter(c => c.id !== id),
        courses: s.courses.filter(c => c.classId !== id),
        schedule: s.schedule.filter(e => e.classId !== id),
      }))
      set(s => ({ cycles: s.cycles.map(cy => cy.id === s.activeCycleId ? {
        ...cy,
        classes: cy.classes.filter(c => c.id !== id),
        courses: cy.courses.filter(c => c.classId !== id),
        schedule: cy.schedule.filter(e => e.classId !== id),
        updatedAt: now(),
      } : cy) }))
      saveV2()
    },
    updateClass: (c) => {
      set(s => ({ classes: s.classes.map(x => x.id === c.id ? c : x) }))
      set(s => ({ cycles: s.cycles.map(cy => cy.id === s.activeCycleId ? { ...cy, classes: cy.classes.map(x => x.id === c.id ? c : x), updatedAt: now() } : cy) }))
      saveV2()
    },
    addTeacher: (t) => {
      set(s => ({ teachers: [...s.teachers, t] }))
      set(s => ({ cycles: s.cycles.map(cy => cy.id === s.activeCycleId ? { ...cy, teachers: [...cy.teachers, t], updatedAt: now() } : cy) }))
      saveV2()
    },
    removeTeacher: (id) => {
      set(s => ({ teachers: s.teachers.filter(t => t.id !== id), courses: s.courses.filter(c => !c.groups.some(g => g.teacherId === id)) }))
      set(s => ({ cycles: s.cycles.map(cy => cy.id === s.activeCycleId ? {
        ...cy,
        teachers: cy.teachers.filter(t => t.id !== id),
        courses: cy.courses.filter(c => !c.groups.some(g => g.teacherId === id)),
        updatedAt: now(),
      } : cy) }))
      saveV2()
    },
    updateTeacher: (t) => {
      set(s => ({ teachers: s.teachers.map(x => x.id === t.id ? t : x) }))
      set(s => ({ cycles: s.cycles.map(cy => cy.id === s.activeCycleId ? { ...cy, teachers: cy.teachers.map(x => x.id === t.id ? t : x), updatedAt: now() } : cy) }))
      saveV2()
    },
    addRoom: (r) => {
      set(s => ({ rooms: [...s.rooms, r] }))
      set(s => ({ cycles: s.cycles.map(cy => cy.id === s.activeCycleId ? { ...cy, rooms: [...cy.rooms, r], updatedAt: now() } : cy) }))
      saveV2()
    },
    removeRoom: (id) => {
      set(s => ({ rooms: s.rooms.filter(r => r.id !== id), courses: s.courses.filter(c => !c.groups.some(g => g.roomId === id)) }))
      set(s => ({ cycles: s.cycles.map(cy => cy.id === s.activeCycleId ? {
        ...cy,
        rooms: cy.rooms.filter(r => r.id !== id),
        courses: cy.courses.filter(c => !c.groups.some(g => g.roomId === id)),
        updatedAt: now(),
      } : cy) }))
      saveV2()
    },
    updateRoom: (r) => {
      set(s => ({ rooms: s.rooms.map(x => x.id === r.id ? r : x) }))
      set(s => ({ cycles: s.cycles.map(cy => cy.id === s.activeCycleId ? { ...cy, rooms: cy.rooms.map(x => x.id === r.id ? r : x), updatedAt: now() } : cy) }))
      saveV2()
    },
    addCourse: (c) => {
      set(s => ({ courses: [...s.courses, c] }))
      set(s => ({ cycles: s.cycles.map(cy => cy.id === s.activeCycleId ? { ...cy, courses: [...cy.courses, c], updatedAt: now() } : cy) }))
      saveV2()
    },
    removeCourse: (id) => {
      set(s => ({ courses: s.courses.filter(c => c.id !== id), schedule: s.schedule.filter(e => e.courseId !== id) }))
      set(s => ({ cycles: s.cycles.map(cy => cy.id === s.activeCycleId ? {
        ...cy,
        courses: cy.courses.filter(c => c.id !== id),
        schedule: cy.schedule.filter(e => e.courseId !== id),
        updatedAt: now(),
      } : cy) }))
      saveV2()
    },
    updateCourse: (c) => {
      set(s => ({ courses: s.courses.map(x => x.id === c.id ? c : x) }))
      set(s => ({ cycles: s.cycles.map(cy => cy.id === s.activeCycleId ? { ...cy, courses: cy.courses.map(x => x.id === c.id ? c : x), updatedAt: now() } : cy) }))
      saveV2()
    },
    setSchedule: (sched) => {
      set({ schedule: sched })
      set(s => ({ cycles: s.cycles.map(cy => cy.id === s.activeCycleId ? { ...cy, schedule: sched, updatedAt: now() } : cy) }))
      saveV2()
    },
    toggleLock: (entryId) => {
      set(s => ({ schedule: s.schedule.map(e => e.id === entryId ? { ...e, locked: !e.locked } : e) }))
      set(s => ({ cycles: s.cycles.map(cy => cy.id === s.activeCycleId ? { ...cy, schedule: cy.schedule.map(e => e.id === entryId ? { ...e, locked: !e.locked } : e), updatedAt: now() } : cy) }))
      saveV2()
    },
    clearSchedule: () => {
      set({ schedule: [] })
      set(s => ({ cycles: s.cycles.map(cy => cy.id === s.activeCycleId ? { ...cy, schedule: [], updatedAt: now() } : cy) }))
      saveV2()
    },
    moveEntry: (entryId, to) => {
      // Moving an entry should not implicitly lock it.
      set(s => ({ schedule: s.schedule.map(e => e.id === entryId ? { ...e, classId: to.classId, dayOfWeek: to.day, periodIndex: to.period } : e) }))
      set(s => ({ cycles: s.cycles.map(cy => cy.id === s.activeCycleId ? {
        ...cy,
        schedule: cy.schedule.map(e => e.id === entryId ? { ...e, classId: to.classId, dayOfWeek: to.day, periodIndex: to.period } : e),
        updatedAt: now(),
      } : cy) }))
      saveV2()
    },
    addManualEntry: (entry) => {
      set(s => ({ schedule: [...s.schedule, entry] }))
      set(s => ({ cycles: s.cycles.map(cy => cy.id === s.activeCycleId ? { ...cy, schedule: [...cy.schedule, entry], updatedAt: now() } : cy) }))
      saveV2()
    },
    removeEntry: (entryId) => {
      set(s => ({ schedule: s.schedule.filter(e => e.id !== entryId) }))
      set(s => ({ cycles: s.cycles.map(cy => cy.id === s.activeCycleId ? { ...cy, schedule: cy.schedule.filter(e => e.id !== entryId), updatedAt: now() } : cy) }))
      saveV2()
    },
    setViewMode: (m) => set({ viewMode: m, viewTargetId: null }),
    setViewTargetId: (id) => set({ viewTargetId: id }),
    setCurrentPage: (p) => set({ currentPage: p }),

    addCycle: (name) => {
      const s = get()
      const tp = s.timeProfiles[0] || defaultTime
      const cy: CycleProfile = {
        id: genId(),
        name: name.trim() || 'New Cycle',
        createdAt: now(),
        updatedAt: now(),
        timeProfileId: tp.id,
        classes: [], teachers: [], rooms: [], courses: [], schedule: [],
        overrides: [], examSessions: [], examAssignments: [],
      }
      set({ cycles: [...s.cycles, cy] })
      syncActiveFromCycles([...s.cycles, cy], cy.id)
      saveV2()
    },
    cloneCycle: (cycleId, name) => {
      const s = get()
      const src = s.cycles.find(c => c.id === cycleId)
      if (!src) return
      const copy: CycleProfile = {
        ...src,
        id: genId(),
        name: name.trim() || `${src.name} Copy`,
        createdAt: now(),
        updatedAt: now(),
      }
      const next = [...s.cycles, copy]
      set({ cycles: next })
      syncActiveFromCycles(next, copy.id)
      saveV2()
    },
    renameCycle: (cycleId, name) => {
      const nm = name.trim()
      if (!nm) return
      set(s => ({ cycles: s.cycles.map(c => c.id === cycleId ? { ...c, name: nm, updatedAt: now() } : c) }))
      saveV2()
    },
    deleteCycle: (cycleId) => {
      const s = get()
      if (s.cycles.length <= 1) return
      const next = s.cycles.filter(c => c.id !== cycleId)
      const nextActive = s.activeCycleId === cycleId ? next[0].id : s.activeCycleId
      set({ cycles: next })
      syncActiveFromCycles(next, nextActive)
      saveV2()
    },
    setActiveCycle: (cycleId) => {
      const s = get()
      syncActiveFromCycles(s.cycles, cycleId)
      saveV2()
    },

    addOverride: (ov) => {
      set(s => ({ overrides: [...s.overrides, ov] }))
      set(s => ({ cycles: s.cycles.map(cy => cy.id === s.activeCycleId ? { ...cy, overrides: [...cy.overrides, ov], updatedAt: now() } : cy) }))
      saveV2()
    },
    updateOverride: (ov) => {
      set(s => ({ overrides: s.overrides.map(x => x.id === ov.id ? ov : x) }))
      set(s => ({ cycles: s.cycles.map(cy => cy.id === s.activeCycleId ? { ...cy, overrides: cy.overrides.map(x => x.id === ov.id ? ov : x), updatedAt: now() } : cy) }))
      saveV2()
    },
    deleteOverride: (id) => {
      set(s => ({ overrides: s.overrides.filter(x => x.id !== id) }))
      set(s => ({ cycles: s.cycles.map(cy => cy.id === s.activeCycleId ? { ...cy, overrides: cy.overrides.filter(x => x.id !== id), updatedAt: now() } : cy) }))
      saveV2()
    },

    addTimeProfile: (p) => { set(s => ({ timeProfiles: [...s.timeProfiles, p] })); saveV2() },
    updateTimeProfile: (p) => { set(s => ({ timeProfiles: s.timeProfiles.map(x => x.id === p.id ? p : x) })); saveV2() },
    deleteTimeProfile: (id) => {
      const s = get()
      if (s.timeProfiles.length <= 1) return
      const next = s.timeProfiles.filter(p => p.id !== id)
      const fallback = next[0]
      const nextCycles = s.cycles.map(c => c.timeProfileId === id ? { ...c, timeProfileId: fallback.id, updatedAt: now() } : c)
      set({ timeProfiles: next, cycles: nextCycles })
      saveV2()
    },
    setCycleTimeProfile: (timeProfileId) => {
      set(s => ({ cycles: s.cycles.map(c => c.id === s.activeCycleId ? { ...c, timeProfileId, updatedAt: now() } : c) }))
      saveV2()
    },

    addExamSession: (sess) => {
      set(s => ({ examSessions: [...s.examSessions, sess] }))
      set(s => ({ cycles: s.cycles.map(cy => cy.id === s.activeCycleId ? { ...cy, examSessions: [...cy.examSessions, sess], updatedAt: now() } : cy) }))
      saveV2()
    },
    updateExamSession: (sess) => {
      set(s => ({ examSessions: s.examSessions.map(x => x.id === sess.id ? sess : x) }))
      set(s => ({ cycles: s.cycles.map(cy => cy.id === s.activeCycleId ? { ...cy, examSessions: cy.examSessions.map(x => x.id === sess.id ? sess : x), updatedAt: now() } : cy) }))
      saveV2()
    },
    deleteExamSession: (id) => {
      set(s => ({ examSessions: s.examSessions.filter(x => x.id !== id), examAssignments: s.examAssignments.filter(a => a.sessionId !== id) }))
      set(s => ({ cycles: s.cycles.map(cy => cy.id === s.activeCycleId ? {
        ...cy,
        examSessions: cy.examSessions.filter(x => x.id !== id),
        examAssignments: cy.examAssignments.filter(a => a.sessionId !== id),
        updatedAt: now(),
      } : cy) }))
      saveV2()
    },
    addExamAssignment: (a) => {
      set(s => ({ examAssignments: [...s.examAssignments, a] }))
      set(s => ({ cycles: s.cycles.map(cy => cy.id === s.activeCycleId ? { ...cy, examAssignments: [...cy.examAssignments, a], updatedAt: now() } : cy) }))
      saveV2()
    },
    updateExamAssignment: (a) => {
      set(s => ({ examAssignments: s.examAssignments.map(x => x.id === a.id ? a : x) }))
      set(s => ({ cycles: s.cycles.map(cy => cy.id === s.activeCycleId ? { ...cy, examAssignments: cy.examAssignments.map(x => x.id === a.id ? a : x), updatedAt: now() } : cy) }))
      saveV2()
    },
    deleteExamAssignment: (id) => {
      set(s => ({ examAssignments: s.examAssignments.filter(x => x.id !== id) }))
      set(s => ({ cycles: s.cycles.map(cy => cy.id === s.activeCycleId ? { ...cy, examAssignments: cy.examAssignments.filter(x => x.id !== id), updatedAt: now() } : cy) }))
      saveV2()
    },
  }
})

export { genId }
