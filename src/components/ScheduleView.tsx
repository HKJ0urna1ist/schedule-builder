import { useStore } from '../store'
import { generateSchedule, findConflicts } from '../algorithm/scheduler'
import { DAYS, PERIODS } from '../types'

export function ScheduleView() {
  const classes = useStore(s => s.classes)
  const teachers = useStore(s => s.teachers)
  const rooms = useStore(s => s.rooms)
  const courses = useStore(s => s.courses)
  const fixedSchedules = useStore(s => s.fixedSchedules)
  const schedule = useStore(s => s.schedule)
  const setSchedule = useStore(s => s.setSchedule)
  const viewMode = useStore(s => s.viewMode)
  const viewTargetId = useStore(s => s.viewTargetId)
  const setViewMode = useStore(s => s.setViewMode)
  const setViewTargetId = useStore(s => s.setViewTargetId)
  const toggleLock = useStore(s => s.toggleLock)

  const getCourseName = (id: string) => courses.find(c => c.id === id)?.name ?? '-'
  const getTeacherName = (id: string) => teachers.find(t => t.id === id)?.name ?? '-'
  const getRoomName = (id: string) => rooms.find(r => r.id === id)?.name ?? '-'
  const getClassName = (id: string) => classes.find(c => c.id === id)?.name ?? '-'

  const filteredSchedule = viewTargetId
    ? schedule.filter(e => {
        if (viewMode === 'class') return e.classId === viewTargetId
        if (viewMode === 'teacher') return e.teacherId === viewTargetId
        if (viewMode === 'room') return e.roomId === viewTargetId
        return true
      })
    : schedule

  const handleGenerate = () => {
    const result = generateSchedule({
      classes, teachers, rooms, courses, fixedSchedules,
      lockedSchedule: schedule,
    })
    setSchedule(result)
  }

  const conflicts = schedule.length > 0 ? findConflicts(schedule) : null
  const totalConflicts = conflicts
    ? conflicts.teacherConflicts.length + conflicts.roomConflicts.length + conflicts.classConflicts.length
    : 0

  const getEntry = (cid: string, d: number, p: number) =>
    filteredSchedule.find(e => e.classId === cid && e.dayOfWeek === d && e.periodIndex === p)

  return (
    <div className="p-4">
      <div className="flex items-center gap-4 mb-4 flex-wrap">
        <h2 className="text-xl font-bold">课表</h2>
        <button className="bg-green-500 text-white px-4 py-1 rounded" onClick={handleGenerate}>
          生成课表
        </button>
        {schedule.length > 0 && (
          <button className="bg-gray-500 text-white px-4 py-1 rounded" onClick={() => setSchedule([])}>
            清空课表
          </button>
        )}
        {conflicts && totalConflicts > 0 && (
          <span className="text-red-500 font-semibold text-sm">
            况窼: {totalConflicts} (教师{conflicts.teacherConflicts.length} 教宺{conflicts.roomConflicts.length} 班级{conflicts.classConflicts.length})
          </span>
        )}
        {conflicts && totalConflicts === 0 && schedule.length > 0 && (
          <span className="text-green-600 text-sm">无冲窼</span>
        )}
      </div>

      <div className="flex gap-2 mb-4 flex-wrap items-center">
        <span className="text-sm text-gray-600">眊看：</span>
        <select className="border rounded px-2 py-1 text-sm" value={viewMode} onChange={(e) => setViewMode(e.target.value as 'class' | 'teacher' | 'room')}>
          <option value="class">按班级</option>
          <option value="teacher">按教师</option>
          <option value="room">按教容</option>
        </select>
        {viewMode === 'class' && (
          <select className="border rounded px-2 py-1 text-sm" value={viewTargetId ?? ''} onChange={(e) => setViewTargetId(e.target.value || null)}>
            <option value="">全部班级</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        )}
        {viewMode === 'teacher' && (
          <select className="border rounded px-2 py-1 text-sm" value={viewTargetId ?? ''} onChange={(e) => setViewTargetId(e.target.value || null)}>
            <option value="">全部教师</option>
            {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        )}
        {viewMode === 'room' && (
          <select className="border rounded px-2 py-1 text-sm" value={viewTargetId ?? ''} onChange={(e) => setViewTargetId(e.target.value || null)}>
            <option value="">全部教宺</option>
            {rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        )}
      </div>

      {viewMode === 'class' && !viewTargetId && classes.length > 0 && (
        <div className="space-y-6">
          {classes.map((c) => (
            <div key={c.id}>
              <h3 className="font-bold text-lg mb-2">{c.name} ({getRoomName(c.roomId)})</h3>
              <div className="overflow-x-auto">
                <table className="border-collapse w-full text-sm min-w-[600px]">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border p-2 w-16">节次</th>
                      {DAYS.map((d, idx) => <th key={idx} className="border p-2">{d}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {PERIODS.map((p) => (
                      <tr key={p}>
                        <td className="border p-2 text-center text-gray-500">{p}</td>
                        {DAYS.map((_, dIdx) => {
                          const entry = getEntry(c.id, dIdx, p)
                          return (
                            <td key={dIdx} className="border p-1 text-center min-w-[80px]">
                              {entry ? (
                                <div
                                  className={`rounded p-1 text-xs cursor-pointer ${entry.locked ? 'bg-yellow-100 border border-yellow-400' : 'bg-blue-50 hover:bg-blue-100'}`}
                                  onClick={() => toggleLock(entry.classId, entry.dayOfWeek, entry.periodIndex)}
                                >
                                  <div className="font-semibold">{getCourseName(entry.courseId)}</div>
                                  <div className="text-gray-500">{getTeacherName(entry.teacherId)}</div>
                                </div>
                              ) : (
                                <div className="text-gray-300 text-xs text-center">-</div>
                              )}
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {(!viewTargetId || viewMode !== 'class') && classes.length > 0 && (
        <div className="overflow-x-auto">
          <table className="border-collapse w-full text-sm min-w-[600px]">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2 w-16">节次</th>
                {DAYS.map((d, idx) => <th key={idx} className="border p-2">{d}</th>)}
              </tr>
            </thead>
            <tbody>
              {PERIODS.map((p) => (
                <tr key={p}>
                  <td className="border p-2 text-center text-gray-500">{p}</td>
                  {DAYS.map((_, dIdx) => {
                    const entries = filteredSchedule.filter((e) => e.dayOfWeek === dIdx && e.periodIndex === p)
                    return (
                      <td key={dIdx} className="border p-1 min-w-[100px] align-top">
                        {entries.length === 0 ? (
                          <div className="text-gray-300 text-xs text-center">-</div>
                        ) : (
                          <div className="space-y-1">
                            {entries.map((entry, idx) => (
                              <div
                                key={idx}
                                className={`rounded p-1 text-xs cursor-pointer ${entry.locked ? 'bg-yellow-100 border border-yellow-400' : 'bg-blue-50 hover:bg-blue-100'}`}
                                onClick={() => toggleLock(entry.classId, entry.dayOfWeek, entry.periodIndex)}
                              >
                                <div className="font-semibold">{getCourseName(entry.courseId)}</div>
                                <div className="text-gray-500">{getClassName(entry.classId)} | {getTeacherName(entry.teacherId)}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {classes.length === 0 && (
        <p className="text-gray-400 mt-4">
          请先生成组组、教师、教定和课程，视即裀引课整
        </p>
      )}
    </div>
  )
}
