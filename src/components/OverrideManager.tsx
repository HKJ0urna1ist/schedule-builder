import { useMemo, useState } from 'react'
import { useStore, genId } from '../store'
import type { ScheduleEntry, TimetableOverride } from '../types'
import { DAYS, PERIODS } from '../types'

function todayISO() {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export function OverrideManager() {
  const classes = useStore(s => s.classes)
  const teachers = useStore(s => s.teachers)
  const rooms = useStore(s => s.rooms)
  const courses = useStore(s => s.courses)

  const overrides = useStore(s => s.overrides)
  const addOverride = useStore(s => s.addOverride)
  const updateOverride = useStore(s => s.updateOverride)
  const deleteOverride = useStore(s => s.deleteOverride)

  const [cellEdit, setCellEdit] = useState<{ ovId: string; classId: string; day: number; period: number } | null>(null)

  const [editId, setEditId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [startDate, setStartDate] = useState(todayISO())
  const [endDate, setEndDate] = useState(todayISO())

  const active = useMemo(() => overrides.find(o => o.id === editId) || null, [overrides, editId])

  const getCourseName = useMemo(() => (id: string) => courses.find(c => c.id === id)?.name ?? '-', [courses])
  const getTeacherName = useMemo(() => (id: string) => teachers.find(t => t.id === id)?.name ?? '-', [teachers])
  const getRoomName = useMemo(() => (id: string) => rooms.find(r => r.id === id)?.name ?? '-', [rooms])

  const reset = () => {
    setEditId(null)
    setName('')
    setStartDate(todayISO())
    setEndDate(todayISO())
  }

  const startEdit = (ov: TimetableOverride) => {
    setEditId(ov.id)
    setName(ov.name)
    setStartDate(ov.startDate)
    setEndDate(ov.endDate)
  }

  const save = () => {
    const nm = name.trim()
    if (!nm || !startDate || !endDate) return
    if (endDate < startDate) return
    if (editId) {
      updateOverride({ id: editId, name: nm, startDate, endDate, schedule: active?.schedule || [] })
    } else {
      addOverride({ id: genId(), name: nm, startDate, endDate, schedule: [] })
    }
    reset()
  }

  // For v1: editing override schedule reuses the same add/remove entry APIs by tagging entries with
  // a synthetic id prefix and storing them inside the override object.
  const addToOverride = (ov: TimetableOverride, entry: any) => {
    updateOverride({ ...ov, schedule: [...ov.schedule, entry] })
  }
  const removeFromOverride = (ov: TimetableOverride, entryId: string) => {
    updateOverride({ ...ov, schedule: ov.schedule.filter(e => e.id !== entryId) })
  }

  return (
    <div className="p-4 max-w-6xl">
      <h2 className="text-xl font-bold mb-4">Temporary Timetable Overrides</h2>

      <div className="border rounded p-3 bg-gray-50 mb-6">
        <div className="flex gap-2 flex-wrap items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs text-gray-600 mb-1">Name</label>
            <input className="border rounded px-2 py-1 w-full" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Exam Week Override" />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Start</label>
            <input className="border rounded px-2 py-1" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">End</label>
            <input className="border rounded px-2 py-1" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
          <button className="bg-green-600 text-white px-3 py-1 rounded text-sm" onClick={save}>{editId ? 'Update' : 'Add'}</button>
          <button className="text-gray-600 text-sm" onClick={reset}>Clear</button>
        </div>
        <div className="text-xs text-gray-500 mt-2">Overrides replace the base timetable for dates in range (inclusive).</div>
      </div>

      <div className="space-y-4">
        {overrides.length === 0 ? (
          <div className="text-sm text-gray-400">No overrides yet.</div>
        ) : overrides.map((ov) => (
          <div key={ov.id} className="border rounded p-3 bg-white">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div>
                <div className="font-semibold">{ov.name}</div>
                <div className="text-xs text-gray-500">{ov.startDate} to {ov.endDate} | {ov.schedule.length} entries</div>
              </div>
              <div className="flex gap-2">
                <button className="text-blue-600 text-sm" onClick={() => startEdit(ov)}>Edit</button>
                <button className="text-red-600 text-sm" onClick={() => { if (confirm(`Delete override '${ov.name}'?`)) deleteOverride(ov.id) }}>Del</button>
              </div>
            </div>

            <details className="mt-2">
              <summary className="cursor-pointer text-sm text-gray-700">Edit override timetable entries</summary>
              <div className="mt-2">
                {classes.length === 0 ? <div className="text-sm text-gray-400">Add classes first.</div> : (
                  <div className="space-y-6">
                    {classes.map((cl) => (
                      <div key={cl.id} className="border rounded p-2 bg-gray-50">
                        <div className="font-semibold mb-2">{cl.name}</div>
                        <div className="overflow-x-auto">
                          <table className="border-collapse w-full text-sm">
                            <thead><tr className="bg-gray-100"><th className="border p-2 w-12">Prd</th>{DAYS.map((d,i) => <th key={i} className="border p-2 text-center">{d}</th>)}</tr></thead>
                            <tbody>
                              {PERIODS.map(p => (
                                <tr key={p}>
                                  <td className="border p-2 text-center text-gray-400">{p}</td>
                                  {DAYS.map((_, dy) => {
                                    const entries = ov.schedule.filter(e => e.classId === cl.id && e.dayOfWeek === dy && e.periodIndex === p)
                                    return (
                                      <td key={dy} className="border p-1 min-w-[160px] align-top">
                                        {entries.length === 0 ? (
                                          <button
                                            className="w-full text-gray-400 hover:bg-gray-100 rounded py-1"
                                            onClick={() => {
                                              setCellEdit({ ovId: ov.id, classId: cl.id, day: dy, period: p })
                                            }}
                                          >
                                            +
                                          </button>
                                        ) : (
                                          <div className="flex gap-1 items-stretch">
                                            {entries.map((ent) => (
                                              <div key={ent.id} className="flex-1 min-w-0 rounded p-1 text-xs bg-yellow-50 border border-yellow-300">
                                                <div className="font-semibold truncate">{getCourseName(ent.courseId)}</div>
                                                <div className="text-gray-600 truncate">@ {getRoomName(ent.roomId)}</div>
                                                <div className="text-gray-500 truncate">{getTeacherName(ent.teacherId)}</div>
                                                <button className="text-red-600 text-[10px]" onClick={() => removeFromOverride(ov, ent.id)}>Delete</button>
                                              </div>
                                            ))}
                                            <button
                                              className="px-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded"
                                              onClick={() => {
                                                setCellEdit({ ovId: ov.id, classId: cl.id, day: dy, period: p })
                                              }}
                                              title="Add parallel entry"
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
                        <div className="text-xs text-gray-500 mt-2">Override entries are locked by default and replace the base timetable during the override date range.</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </details>
          </div>
        ))}
      </div>

      {cellEdit && (
        <OverrideCellModal
          ovId={cellEdit.ovId}
          classId={cellEdit.classId}
          day={cellEdit.day}
          period={cellEdit.period}
          onCancel={() => setCellEdit(null)}
          onAdd={(entry) => {
            const ov = overrides.find(o => o.id === cellEdit.ovId)
            if (!ov) return
            addToOverride(ov, entry)
            setCellEdit(null)
          }}
        />
      )}
    </div>
  )
}

function OverrideCellModal(props: {
  ovId: string
  classId: string
  day: number
  period: number
  onCancel: () => void
  onAdd: (entry: ScheduleEntry) => void
}) {
  const { classId, day, period, onCancel, onAdd } = props
  const { courses, teachers, rooms } = useStore()
  const [cId, setCId] = useState('')
  const [tId, setTId] = useState('')
  const [rId, setRId] = useState('')
  const [gl, setGl] = useState('')
  const cc = courses.filter(c => c.classId === classId)
  const save = () => {
    if (!cId || !tId || !rId) return
    onAdd({ id: genId(), classId, courseId: cId, teacherId: tId, roomId: rId, groupLabel: gl.trim(), dayOfWeek: day, periodIndex: period, locked: true })
  }
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={(e) => { if (e.target === e.currentTarget) onCancel() }}>
      <div className="bg-white rounded shadow-lg p-4 w-80" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-bold mb-2">Add Override Entry</h3>
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
