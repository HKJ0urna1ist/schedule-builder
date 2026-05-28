import { useStore } from '../store'
import { generateSchedule, findConflicts } from '../algorithm/scheduler'
import { DAYS, PERIODS } from '../types'

export function ScheduleView() {
  const classes = useStore(s => s.classes)
  const teachers = useStore(s => s.teachers)
  const rooms = useStore(s => s.rooms)
  const courses = useStore(s => s.courses)
  const schedule = useStore(s => s.schedule)
  const setSchedule = useStore(s => s.setSchedule)
  const clearSchedule = useStore(s => s.clearSchedule)
  const viewMode = useStore(s => s.viewMode)
  const viewTargetId = useStore(s => s.viewTargetId)
  const setViewMode = useStore(s => s.setViewMode)
  const setViewTargetId = useStore(s => s.setViewTargetId)
  const toggleLock = useStore(s => s.toggleLock)

  const getCourseName = (id: string) => courses.find(c => c.id === id)?.name ?? '-'
  const getTeacherName = (id: string) => teachers.find(t => t.id === id)?.name ?? '-'
  const getRoomName = (id: string) => rooms.find(r => r.id === id)?.name ?? '-'

  const handleGenerate = () => {
    const result = generateSchedule(
      { classes, teachers, rooms, courses },
      schedule.filter(e => e.locked)
    )
    setSchedule(result)
  }

  const conflicts = schedule.length > 0 ? findConflicts(schedule) : null
  const totalConflicts = conflicts
    ? conflicts.teacherConflicts.length + conflicts.roomConflicts.length + conflicts.classConflicts.length
    : 0

  const targetClasses = viewTargetId
    ? classes.filter(c => c.id === viewTargetId)
    : classes
  return (
    <div className="p-4">
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <h2 className="text-xl font-bold">排课系 - 课表</h2>
        <button className="bg-green-600 text-white px-4 py-1 rounded" onClick={handleGenerate}>
          生成课表
        </button>
        {schedule.length > 0 && (
          <button className="bg-gray-500 text-white px-4 py-1 rounded" onClick={() => clearSchedule()}>
            清空课表
          </button>
        )}
        {conflicts && totalConflicts > 0 && (
          <span className="text-red-600 font-semibold text-sm">
            冲窼: {totalConflicts} (教师{conflicts.teacherConflicts.length} 教宲{conflicts.roomConflicts.length} 班级{conflicts.classConflicts.length})
          </span>
        )}
        {conflicts && totalConflicts === 0 && schedule.length > 0 && (
          <span className="text-green-600 text-sm">无冲窼</span>
        )}
      </div>
      <div className="flex gap-2 mb-4 flex-wrap items-center">
        <span className="text-sm text-gray-600">查看：</span>
        <select className="border rounded px-2 py-1 text-sm" value={viewMode} onChange={(e) => setViewMode(e.target.value as 'class' | 'teacher' | 'room')}>
          <option value="class">按班级</option>
          <option value="teacher">按教师</option>
          <option value="room">按教宺</option>
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
      {classes.length === 0 ? (
        <p className="text-gray-500 mt-8">请先在“管理”页面添加班级、教师、教室和课程。</p>
      ) : (
        <div className="space-y-8">
          {targetClasses.map((cl) => (
            <div key={cl.id} className="bg-white rounded shadow p-4">
              <h3 className="font-bold text-lg mb-3">{cl.name}</h3>
              <div className="overflow-x-auto">
                <table className="border-collapse w-full text-sm">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border p-2 w-16">节次</th>
                      {DAYS.map((d, i) => <th key={i} className="border p-2 text-center">{d}</th>)}
                    </tr>
                  </thead>
                  <tbody>                    {PERIODS.map((p) => (
                      <tr key={p}>
                        <td className="border p-2 text-center text-gray-500 text-xs">{p}</td>
                        {DAYS.map((_, d) => {
                          const entries = schedule.filter(e => e.classId === cl.id && e.dayOfWeek === d && e.periodIndex === p)
                          return (
                            <td key={d} className="border p-1 min-w-[130px] align-top">
                              {entries.length === 0 ? (
                                <div className="text-gray-300 text-xs text-center">-</div>
                              ) : (
                                <div className="space-y-1">
                                  {entries.map((ent, i) => (
                                    <div
                                      key={i}
                                      className={`rounded p-1 text-xs cursor-pointer ${ent.locked ? 'bg-yellow-100 border border-yellow-400' : 'bg-blue-50 hover:bg-blue-100'}`}
                                      onClick={() => toggleLock(ent.classId, ent.dayOfWeek, ent.periodIndex, ent.groupLabel)}
                                    >
                                      <div className="font-semibold">{getCourseName(ent.courseId)}</div>
                                      <div className="text-gray-600">
                                        {ent.groupLabel} @{getRoomName(ent.roomId)}
                                      </div>
                                      <div className="text-gray-500">{getTeacherName(ent.teacherId)}</div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </td>
                          )
                        })}
                      </tr>
                    ))}                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
