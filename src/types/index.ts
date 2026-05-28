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
  groups: CourseGroup[]
}

export interface ScheduleEntry {
  id: string
  classId: string
  courseId: string
  teacherId: string
  roomId: string
  groupLabel: string
  dayOfWeek: number
  periodIndex: number
  locked: boolean
}

export type ViewMode = 'class' | 'teacher' | 'room'

export const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] as const
export const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8] as const
export const PERIOD_LABELS = ['8:15-9:00', '9:10-9:55', '10:05-10:50', '11:00-11:45', '13:15-14:00', '14:10-14:55', '15:25-16:10', '16:20-17:05'] as const