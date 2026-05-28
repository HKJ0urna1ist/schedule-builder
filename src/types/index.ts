export interface ClassInfo {
  id: string
  name: string
  roomId: string
  courseIds: string[]
}

export interface Teacher {
  id: string
  name: string
}

export interface Room {
  id: string
  name: string
  type: '普通' | '实验室' | '操场' | '其他'
  capacity: number
}

export type CourseType = '必修' | '走班'

export interface Course {
  id: string
  name: string
  type: CourseType
  teacherId: string
  classIds: string[]
  lessonsPerWeek: number
}

export interface FixedSchedule {
  classId: string
  courseId: string | null
  dayOfWeek: number
  periodIndex: number
  label?: string
}

export interface ScheduleEntry {
  classId: string
  courseId: string
  teacherId: string
  roomId: string
  dayOfWeek: number
  periodIndex: number
  locked: boolean
}

export type ViewMode = 'class' | 'teacher' | 'room'

export const DAYS = ['周一', '周二', '周三', '周四', '周五'] as const
export const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8] as const