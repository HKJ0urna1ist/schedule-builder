import { useMemo, useState } from 'react'
import { useStore } from '../store'
import type { ExamRoomAssignment, ExamSession } from '../types'

function dayLabel(dateISO: string) {
  const d = new Date(dateISO + 'T00:00:00')
  if (Number.isNaN(d.getTime())) return dateISO
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
}

type Slot = {
  session: ExamSession
  assignments: ExamRoomAssignment[]
}

export function ExamGridView() {
  const classes = useStore(s => s.classes)
  const teachers = useStore(s => s.teachers)
  const rooms = useStore(s => s.rooms)
  const sessions = useStore(s => s.examSessions)
  const assigns = useStore(s => s.examAssignments)

  const [filterDate, setFilterDate] = useState('')

  const teacherById = useMemo(() => new Map(teachers.map(t => [t.id, t.name])), [teachers])
  const roomById = useMemo(() => new Map(rooms.map(r => [r.id, r.name])), [rooms])
  const classById = useMemo(() => new Map(classes.map(c => [c.id, c.name])), [classes])

  const slots = useMemo(() => {
    const aBySession = new Map<string, ExamRoomAssignment[]>()
    for (const a of assigns) {
      const arr = aBySession.get(a.sessionId) || []
      arr.push(a)
      aBySession.set(a.sessionId, arr)
    }
    const out: Slot[] = []
    for (const s of sessions) {
      if (filterDate && s.date !== filterDate) continue
      out.push({ session: s, assignments: aBySession.get(s.id) || [] })
    }
    out.sort((A, B) => (A.session.date + A.session.startTime).localeCompare(B.session.date + B.session.startTime))
    return out
  }, [sessions, assigns, filterDate])

  const byDate = useMemo(() => {
    const m = new Map<string, Slot[]>()
    for (const sl of slots) {
      const arr = m.get(sl.session.date) || []
      arr.push(sl)
      m.set(sl.session.date, arr)
    }
    return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0]))
  }, [slots])

  return (
    <div className="p-4 max-w-6xl">
      <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
        <h2 className="text-xl font-bold">Exam Timetable</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Date:</span>
          <input className="border rounded px-2 py-1 text-sm" type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} />
          {filterDate && <button className="text-sm text-gray-600" onClick={() => setFilterDate('')}>Clear</button>}
        </div>
      </div>

      {sessions.length === 0 ? (
        <div className="text-sm text-gray-400">No exam sessions yet. Add them in the List view.</div>
      ) : (
        <div className="space-y-8">
          {byDate.map(([date, daySlots]) => (
            <div key={date} className="border rounded bg-white">
              <div className="px-3 py-2 border-b bg-gray-50 flex items-center justify-between">
                <div className="font-semibold">{dayLabel(date)} ({date})</div>
                <div className="text-xs text-gray-500">{daySlots.length} sessions</div>
              </div>
              <div className="divide-y">
                {daySlots.map(({ session, assignments }) => (
                  <div key={session.id} className="p-3">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="min-w-0">
                        <div className="font-semibold">{session.startTime}-{session.endTime} | {session.subjectText}</div>
                        <div className="text-xs text-gray-500">{session.examName}{typeof session.candidateCount === 'number' ? ` | ${session.candidateCount} students` : ''}</div>
                      </div>
                    </div>
                    {assignments.length === 0 ? (
                      <div className="text-sm text-gray-400 mt-2">No room assignments yet.</div>
                    ) : (
                      <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                        {assignments.map((a) => (
                          <div key={a.id} className="border rounded p-2 bg-gray-50">
                            <div className="text-sm font-semibold">{roomById.get(a.roomId) || '-'}</div>
                            <div className="text-xs text-gray-600">Invigilators: {a.invigilatorTeacherIds.map(id => teacherById.get(id) || '-').join(', ') || '-'}</div>
                            <div className="text-xs text-gray-600">Classes: {a.classIds.map(id => classById.get(id) || '-').join(', ') || '-'}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
