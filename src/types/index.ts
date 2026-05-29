export interface ClassInfo {
  id: string
  name: string
}

export interface Teacher {
  id: string
  name: string
}

export interface Room {
  id: string
  name: string
  capacity?: number
}

export interface CourseGroup {
  label: string
  teacherId: string
  roomId: string
}

export type CourseType = '必修' | '走班'

export interface Course {
  id: string
  name: string
  type: CourseType
  classId: string
  lessonsPerWeek: number
  // Number of students taking this course (used as default exam candidate count).
  enrollment?: number
  groups: CourseGroup[]
}

export interface TimeProfile {
  id: string
  name: string
  // Period index -> time range
  periods: { periodIndex: number; start: string; end: string }[]
}

export interface ExamSession {
  id: string
  examName: string
  // Hybrid subject: can be free text, optionally linked to a course
  subjectText: string
  courseId?: string
  date: string // YYYY-MM-DD
  startTime: string // HH:mm
  endTime: string // HH:mm
  candidateCount?: number
}

export interface ExamRoomAssignment {
  id: string
  sessionId: string
  roomId: string
  classIds: string[]
  invigilatorTeacherIds: string[]
  assignedCandidateCount?: number
  notes?: string
}

export interface TimetableOverride {
  id: string
  name: string
  startDate: string // YYYY-MM-DD
  endDate: string // YYYY-MM-DD
  // Entries for the override date range. Uses the same structure as the base timetable.
  schedule: ScheduleEntry[]
}

export interface CycleProfile {
  id: string
  name: string
  createdAt: number
  updatedAt: number
  timeProfileId: string
  classes: ClassInfo[]
  teachers: Teacher[]
  rooms: Room[]
  courses: Course[]
  schedule: ScheduleEntry[]
  overrides: TimetableOverride[]
  examSessions: ExamSession[]
  examAssignments: ExamRoomAssignment[]
}

export interface ScheduleEntry {
  id: string
  classId: string
  courseId: string
  teacherId: string
  roomId: string
  // Optional; empty means whole class / no subgroup label.
  groupLabel: string
  dayOfWeek: number
  periodIndex: number
  locked: boolean
}

export type ViewMode = 'class' | 'teacher' | 'room'

export const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] as const
export const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8] as const
export const PERIOD_LABELS = ['8:15-9:00', '9:10-9:55', '10:05-10:50', '11:00-11:45', '13:15-14:00', '14:10-14:55', '15:25-16:10', '16:20-17:05'] as const
