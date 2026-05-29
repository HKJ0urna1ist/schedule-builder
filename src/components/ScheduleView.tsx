import { useState, useMemo, useCallback } from 'react'
import { useStore, genId } from '../store'
import { generateSchedule, findConflicts } from '../algorithm/scheduler'
import { DAYS, PERIODS } from '../types'

function CellModal({ classId, day, period, onCancel }: { classId: string; day: number; period: number; onCancel: () => void }) {
  const { courses, teachers, rooms, addManualEntry } = useStore()
  const [cId, setCId] = useState('')
  const [tId, setTId] = useState('')
  const [rId, setRId] = useState('')
  const [gl, setGl] = useState('')
  const save = () => {
    if (!cId || !tId || !rId) return
    addManualEntry({ id: genId(), classId, courseId: cId, teacherId: tId, roomId: rId, groupLabel: gl.trim(), dayOfWeek: day, periodIndex: period, locked: true })
    onCancel()
  }
  const cc = courses.filter(c => c.classId === classId)
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={e => { if (e.target === e.currentTarget) onCancel() }}>
      <div className="bg-white rounded shadow-lg p-4 w-80" onClick={e => e.stopPropagation()}>
        <h3 className="font-bold mb-2">Add Course</h3>
        <select className="border rounded px-2 py-1 w-full mb-2" value={cId} onChange={e => setCId(e.target.value)}>
          <option value="">Course</option>
          {cc.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select className="border rounded px-2 py-1 w-full mb-2" value={tId} onChange={e => setTId(e.target.value)}>
          <option value="">Teacher</option>
          {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <select className="border rounded px-2 py-1 w-full mb-2" value={rId} onChange={e => setRId(e.target.value)}>
          <option value="">Room</option>
          {rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
        <input className="border rounded px-2 py-1 w-full mb-2" placeholder="Group label (optional)" value={gl} onChange={e => setGl(e.target.value)} />
        <div className="flex gap-2">
          <button className="bg-blue-500 text-white px-4 py-1 rounded flex-1" onClick={save}>Add</button>
          <button className="bg-gray-300 px-4 py-1 rounded flex-1" onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  )
}

export function ScheduleView() {
  const cycles = useStore(s => s.cycles)
  const activeCycleId = useStore(s => s.activeCycleId)
  const timeProfiles = useStore(s => s.timeProfiles)
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
  const moveEntry = useStore(s => s.moveEntry)
  const removeEntry = useStore(s => s.removeEntry)
  const [cellEdit, setCellEdit] = useState<{ classId: string; day: number; period: number } | null>(null)
  const [dragId, setDragId] = useState<string | null>(null)

  const activeCycle = useMemo(() => cycles.find(c => c.id === activeCycleId) || cycles[0], [cycles, activeCycleId])
  const activeTimeProfile = useMemo(() => timeProfiles.find(tp => tp.id === activeCycle?.timeProfileId) || timeProfiles[0], [timeProfiles, activeCycle])
  const periodTimeLabel = useMemo(() => {
    const m = new Map<number, string>()
    if (!activeTimeProfile) return m
    for (const pr of activeTimeProfile.periods) m.set(pr.periodIndex, `${pr.start}-${pr.end}`)
    return m
  }, [activeTimeProfile])

  const getCourseName = useMemo(() => (id: string) => courses.find(c => c.id === id)?.name ?? '-', [courses])
  const getTeacherName = useMemo(() => (id: string) => teachers.find(t => t.id === id)?.name ?? '-', [teachers])
  const getRoomName = useMemo(() => (id: string) => rooms.find(r => r.id === id)?.name ?? '-', [rooms])
  const getClassName = useMemo(() => (id: string) => classes.find(c => c.id === id)?.name ?? '-', [classes])

  const handleGenerate = useCallback(() => {
    setSchedule(generateSchedule({ classes, teachers, rooms, courses }, schedule.filter(e => e.locked)))
  }, [classes, teachers, rooms, courses, schedule, setSchedule])

  const conflicts = useMemo(() => schedule.length ? findConflicts(schedule) : null, [schedule])
  const totalConflicts = conflicts ? conflicts.teacherConflicts.length + conflicts.roomConflicts.length + conflicts.classConflicts.length : 0

  const conflictEntryIds = useMemo(() => {
    if (!conflicts) return new Set<string>()
    const ids = new Set<string>()
    for (const [a, b] of conflicts.teacherConflicts) { ids.add(a.id); ids.add(b.id) }
    for (const [a, b] of conflicts.roomConflicts) { ids.add(a.id); ids.add(b.id) }
    for (const [a, b] of conflicts.classConflicts) { ids.add(a.id); ids.add(b.id) }
    return ids
  }, [conflicts])
  const targetClasses = viewTargetId ? classes.filter(c => c.id === viewTargetId) : classes

  const handleDelete = useCallback((id: string) => {
    if (confirm('Remove this entry?')) removeEntry(id)
  }, [removeEntry])

  const handleDragStart = (e: React.DragEvent, id: string) => { setDragId(id); e.dataTransfer.effectAllowed = 'move' }
  const handleDrop = (to: { classId: string; day: number; period: number }) => {
    if (!dragId) return
    const ent = schedule.find(e => e.id === dragId)
    // Locked items are meant to stay fixed (and generation already preserves them).
    if (ent?.locked) { setDragId(null); return }
    moveEntry(dragId, to)
    setDragId(null)
  }
  const handleDragOver = (e: React.DragEvent) => e.preventDefault()

  return (
    <div className="p-4">
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <h2 className="text-xl font-bold">Timetable</h2>
        <button className="bg-green-600 text-white px-4 py-1 rounded" onClick={handleGenerate}>Generate</button>
        {schedule.length > 0 ? (<>
          <button className="bg-gray-500 text-white px-4 py-1 rounded" onClick={() => clearSchedule()}>Clear</button>
          {conflicts && totalConflicts > 0 ? <span className="text-red-600 font-semibold">Conflicts: {totalConflicts}</span> : <span className="text-green-600">No conflicts</span>}
        </>) : <p className="text-gray-500">Add classes and courses in Manage, then click Generate.</p>}
      </div>
      <div className="flex gap-2 mb-4 flex-wrap items-center">
        <span className="text-sm text-gray-600">View:</span>
        <select className="border rounded px-2 py-1 text-sm" value={viewMode} onChange={(e: any) => setViewMode(e.target.value)}>
          <option value="class">By Class</option>
          <option value="teacher">By Teacher</option>
          <option value="room">By Room</option>
        </select>
        {viewMode === 'class' && <select className="border rounded px-2 py-1 text-sm" value={viewTargetId ?? ''} onChange={(e: any) => setViewTargetId(e.target.value || null)}>
          <option value="">All Classes</option>
          {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>}
        {viewMode === 'teacher' && <select className="border rounded px-2 py-1 text-sm" value={viewTargetId ?? ''} onChange={(e: any) => setViewTargetId(e.target.value || null)}>
          <option value="">All Teachers</option>
          {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>}
        {viewMode === 'room' && <select className="border rounded px-2 py-1 text-sm" value={viewTargetId ?? ''} onChange={(e: any) => setViewTargetId(e.target.value || null)}>
          <option value="">All Rooms</option>
          {rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>}
      </div>
      {viewMode === 'class' && schedule.length > 0 && targetClasses.map((cl) => (
        <div key={cl.id} className="bg-white rounded shadow p-4 mb-6">
          <h3 className="font-bold text-lg mb-3">{cl.name}</h3>
          <div className="overflow-x-auto">
            <table className="border-collapse w-full text-sm">
              <thead><tr className="bg-gray-100"><th className="border p-2 w-12">Prd</th>{DAYS.map((d,i) => <th key={i} className="border p-2 text-center">{d}</th>)}</tr></thead>
              <tbody>
                {PERIODS.map((p) => (
                  <tr key={p}>
                    <td className="border p-2 text-center text-gray-400 whitespace-nowrap">
                      <div className="font-semibold text-gray-600">P{p}</div>
                      <div className="text-[10px] text-gray-400">{periodTimeLabel.get(p) || ''}</div>
                    </td>
                    {DAYS.map((_, dy) => {
                      const entries = schedule.filter(e => e.classId === cl.id && e.dayOfWeek === dy && e.periodIndex === p)
                      const cellHasConflict = entries.some(e => conflictEntryIds.has(e.id))
                      return (
                        <td
                          key={dy}
                          className={`border p-1 min-w-[150px] align-top ${cellHasConflict ? 'bg-red-50' : ''}`}
                          onDragOver={handleDragOver}
                          onDrop={() => handleDrop({ classId: cl.id, day: dy, period: p })}
                        >
                          {entries.length === 0 ? (
                            <div className="hover:bg-gray-100 cursor-pointer rounded text-center text-gray-300" onClick={() => setCellEdit({ classId: cl.id, day: dy, period: p })}>+</div>
                          ) : (
                            <div className="flex gap-1 items-stretch">
                              {entries.map((ent) => (
                                <div
                                  key={ent.id}
                                  className={`rounded p-1 text-xs flex-1 min-w-0 ${ent.locked ? 'bg-yellow-100 border border-yellow-400' : 'bg-blue-50 hover:bg-blue-100'} ${conflictEntryIds.has(ent.id) ? 'ring-2 ring-red-500' : ''}`}
                                  title={conflictEntryIds.has(ent.id) ? 'Conflict detected' : undefined}
                                >
                                  <div
                                    className={`font-semibold ${ent.locked ? '' : 'cursor-grab active:cursor-grabbing'}`}
                                    draggable={!ent.locked}
                                    onDragStart={(e) => handleDragStart(e, ent.id)}
                                  >
                                    {getCourseName(ent.courseId)}
                                  </div>
                                  <div className="text-gray-600 truncate">{ent.groupLabel ? ent.groupLabel + ' @ ' : '@ '}{getRoomName(ent.roomId)}</div>
                                  <div className="text-gray-500">{getTeacherName(ent.teacherId)}</div>
                                  <div className="flex gap-1 mt-1">
                                    <button
                                      className={`px-1 rounded border text-[10px] ${ent.locked ? 'border-yellow-500 text-yellow-700 bg-white' : 'border-gray-300 text-gray-600 bg-white hover:bg-gray-50'}`}
                                      onClick={() => toggleLock(ent.id)}
                                      title={ent.locked ? 'Unlock (allow regenerate/move)' : 'Lock (keep fixed on regenerate)'}
                                    >
                                      {ent.locked ? 'Unlock' : 'Lock'}
                                    </button>
                                    <button
                                      className="px-1 rounded border border-red-300 text-red-600 bg-white hover:bg-red-50 text-[10px]"
                                      onClick={() => handleDelete(ent.id)}
                                      title="Delete"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </div>
                              ))}
                              <button
                                className="px-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded"
                                onClick={() => setCellEdit({ classId: cl.id, day: dy, period: p })}
                                title="Add parallel course"
                              >
                                +
                              </button>
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
        </div>
      ))}
      {viewMode === 'teacher' && schedule.length > 0 && (
        viewTargetId ? (
          <div className="space-y-8">
            {teachers.filter(t => t.id === viewTargetId).map((teach) => {
              const es = schedule.filter(e => e.teacherId === teach.id)
              if (!es.length) return null
              return (
                <div key={teach.id} className="bg-white rounded shadow p-4 mb-6">
                  <h3 className="font-bold text-lg mb-3">{teach.name}</h3>
                  <div className="overflow-x-auto">
                    <table className="border-collapse w-full text-sm">
                      <thead><tr className="bg-gray-100"><th className="border p-2 w-12">Prd</th>{DAYS.map((d,i) => <th key={i} className="border p-2">{d}</th>)}</tr></thead>
                      <tbody>{PERIODS.map(p => (<tr key={p}><td className="border p-2 text-center text-gray-400 whitespace-nowrap"><div className="font-semibold text-gray-600">P{p}</div><div className="text-[10px] text-gray-400">{periodTimeLabel.get(p) || ''}</div></td>
                        {DAYS.map((_, dy) => { const es2 = es.filter(e => e.dayOfWeek === dy && e.periodIndex === p)
                        const cellHasConflict = es2.some(e => conflictEntryIds.has(e.id))
                        return <td key={dy} className={`border p-1 min-w-[140px] align-top ${cellHasConflict ? 'bg-red-50' : ''}`}>
                          {es2.length === 0 ? <div className="text-gray-300 text-xs text-center">-</div> : (
                            <div className="flex gap-1 items-stretch">
                              {es2.map((ent) => (
                                <div key={ent.id} className={`rounded p-1 text-xs flex-1 min-w-0 ${ent.locked ? 'bg-yellow-100 border border-yellow-400' : 'bg-blue-50'} ${conflictEntryIds.has(ent.id) ? 'ring-2 ring-red-500' : ''}`}>
                                  <div className="font-semibold truncate">{getCourseName(ent.courseId)}</div>
                                  <div className="text-gray-600 truncate">{getClassName(ent.classId)} | @{getRoomName(ent.roomId)}</div>
                                </div>
                              ))}
                            </div>
                          )}
                        </td>})}
                      </tr>))}</tbody>
                    </table>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="space-y-6">
            {teachers.map((teach) => {
              const es = schedule.filter(e => e.teacherId === teach.id)
              if (!es.length) return null
              return (
                <div key={teach.id} className="bg-white rounded shadow p-4 mb-6">
                  <h3 className="font-bold text-lg mb-3">{teach.name}</h3>
                  <div className="overflow-x-auto">
                    <table className="border-collapse w-full text-sm">
                      <thead><tr className="bg-gray-100"><th className="border p-2 w-12">Prd</th>{DAYS.map((d,i) => <th key={i} className="border p-2">{d}</th>)}</tr></thead>
                      <tbody>{PERIODS.map(p => (<tr key={p}><td className="border p-2 text-center text-gray-400 whitespace-nowrap"><div className="font-semibold text-gray-600">P{p}</div><div className="text-[10px] text-gray-400">{periodTimeLabel.get(p) || ''}</div></td>
                        {DAYS.map((_, dy) => { const es2 = es.filter(e => e.dayOfWeek === dy && e.periodIndex === p)
                        const cellHasConflict = es2.some(e => conflictEntryIds.has(e.id))
                        return <td key={dy} className={`border p-1 min-w-[140px] align-top ${cellHasConflict ? 'bg-red-50' : ''}`}>
                          {es2.length === 0 ? <div className="text-gray-300 text-xs text-center">-</div> : (
                            <div className="flex gap-1 items-stretch">
                              {es2.map((ent) => (
                                <div key={ent.id} className={`rounded p-1 text-xs flex-1 min-w-0 ${ent.locked ? 'bg-yellow-100 border border-yellow-400' : 'bg-blue-50'} ${conflictEntryIds.has(ent.id) ? 'ring-2 ring-red-500' : ''}`}>
                                  <div className="font-semibold truncate">{getCourseName(ent.courseId)}</div>
                                  <div className="text-gray-600 truncate">{getClassName(ent.classId)} | @{getRoomName(ent.roomId)}</div>
                                </div>
                              ))}
                            </div>
                          )}
                        </td>})}
                      </tr>))}</tbody>
                    </table>
                  </div>
                </div>
              )
            })}
          </div>
        )
      )}

      {viewMode === 'room' && schedule.length > 0 && (
        <div className="space-y-6">
          {rooms.map((rm) => {
            const es = schedule.filter(e => e.roomId === rm.id)
            if (!es.length) return null
            return (
              <div key={rm.id} className="bg-white rounded shadow p-4 mb-6">
                <h3 className="font-bold text-lg mb-3">{rm.name}</h3>
                <div className="overflow-x-auto">
                  <table className="border-collapse w-full text-sm">
                    <thead><tr className="bg-gray-100"><th className="border p-2 w-12">Prd</th>{DAYS.map((d,i) => <th key={i} className="border p-2">{d}</th>)}</tr></thead>
                    <tbody>{PERIODS.map(p => (<tr key={p}><td className="border p-2 text-center text-gray-400 whitespace-nowrap"><div className="font-semibold text-gray-600">P{p}</div><div className="text-[10px] text-gray-400">{periodTimeLabel.get(p) || ''}</div></td>
                      {DAYS.map((_, dy) => { const es2 = es.filter(e => e.dayOfWeek === dy && e.periodIndex === p)
                      const cellHasConflict = es2.some(e => conflictEntryIds.has(e.id))
                      return <td key={dy} className={`border p-1 min-w-[140px] align-top ${cellHasConflict ? 'bg-red-50' : ''}`}>
                        {es2.length === 0 ? <div className="text-gray-300 text-xs text-center">-</div> : (
                          <div className="flex gap-1 items-stretch">
                            {es2.map((ent) => (
                              <div key={ent.id} className={`rounded p-1 text-xs flex-1 min-w-0 ${ent.locked ? 'bg-yellow-100' : 'bg-blue-50'} ${conflictEntryIds.has(ent.id) ? 'ring-2 ring-red-500' : ''}`}>
                                <div className="font-semibold truncate">{getCourseName(ent.courseId)}</div>
                                <div className="text-gray-600 truncate">{getClassName(ent.classId)} | {getTeacherName(ent.teacherId)}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>})}
                    </tr>))}</tbody>
                  </table>
                </div>
              </div>
            )
          })}
        </div>
      )}
      {classes.length === 0 && <p className="text-gray-500 mt-8">Add classes, teachers, rooms in Manage first.</p>}
      {cellEdit && <CellModal classId={cellEdit.classId} day={cellEdit.day} period={cellEdit.period} onCancel={() => setCellEdit(null)} />}
    </div>
  )
}
