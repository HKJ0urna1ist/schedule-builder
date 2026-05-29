import { useMemo, useState } from 'react'
import { useStore, genId } from '../store'
import type { ExamRoomAssignment, ExamSession } from '../types'
import { findExamConflicts } from '../algorithm/examConflicts'

function todayISO() {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export function ExamManager() {
  const classes = useStore(s => s.classes)
  const teachers = useStore(s => s.teachers)
  const rooms = useStore(s => s.rooms)
  const courses = useStore(s => s.courses)

  const sessions = useStore(s => s.examSessions)
  const assigns = useStore(s => s.examAssignments)

  const addSession = useStore(s => s.addExamSession)
  const updateSession = useStore(s => s.updateExamSession)
  const deleteSession = useStore(s => s.deleteExamSession)
  const addAssign = useStore(s => s.addExamAssignment)
  const updateAssign = useStore(s => s.updateExamAssignment)
  const deleteAssign = useStore(s => s.deleteExamAssignment)

  const [filterDate, setFilterDate] = useState<string>('')
  const [editSessionId, setEditSessionId] = useState<string | null>(null)
  const [examName, setExamName] = useState('')
  const [courseId, setCourseId] = useState('')
  const [subjectText, setSubjectText] = useState('')
  const [date, setDate] = useState(todayISO())
  const [startTime, setStartTime] = useState('08:00')
  const [endTime, setEndTime] = useState('09:00')
  const [candidateCount, setCandidateCount] = useState<string>('')

  const [editAssignId, setEditAssignId] = useState<string | null>(null)
  const [assignSessionId, setAssignSessionId] = useState<string>('')
  const [assignRoomId, setAssignRoomId] = useState<string>('')
  const [assignTeacherIds, setAssignTeacherIds] = useState<string[]>([])
  const [assignClassIds, setAssignClassIds] = useState<string[]>([])
  const [assignCount, setAssignCount] = useState<string>('')

  const sessionsById = useMemo(() => new Map(sessions.map(s => [s.id, s])), [sessions])
  const roomById = useMemo(() => new Map(rooms.map(r => [r.id, r])), [rooms])
  const teacherById = useMemo(() => new Map(teachers.map(t => [t.id, t])), [teachers])
  const classById = useMemo(() => new Map(classes.map(c => [c.id, c])), [classes])
  const courseById = useMemo(() => new Map(courses.map(c => [c.id, c])), [courses])

  const conflicts = useMemo(() => findExamConflicts(sessions, assigns), [sessions, assigns])
  const conflictAssignIds = useMemo(() => {
    const s = new Set<string>()
    for (const c of conflicts) { s.add(c.aAssignmentId); s.add(c.bAssignmentId) }
    return s
  }, [conflicts])

  const shownAssigns = useMemo(() => {
    if (!filterDate) return assigns
    return assigns.filter(a => sessionsById.get(a.sessionId)?.date === filterDate)
  }, [assigns, filterDate, sessionsById])

  const resetSessionForm = () => {
    setEditSessionId(null)
    setExamName('')
    setCourseId('')
    setSubjectText('')
    setDate(todayISO())
    setStartTime('08:00')
    setEndTime('09:00')
    setCandidateCount('')
  }

  const startEditSession = (s: ExamSession) => {
    setEditSessionId(s.id)
    setExamName(s.examName)
    setCourseId(s.courseId || '')
    setSubjectText(s.subjectText)
    setDate(s.date)
    setStartTime(s.startTime)
    setEndTime(s.endTime)
    setCandidateCount(typeof s.candidateCount === 'number' ? String(s.candidateCount) : '')
  }

  const saveSession = () => {
    const nm = examName.trim()
    const subj = subjectText.trim() || courseById.get(courseId)?.name || ''
    if (!nm || !subj || !date || !startTime || !endTime) return

    const course = courseId ? courseById.get(courseId) : undefined
    const defaultCount = typeof course?.enrollment === 'number' ? course.enrollment : undefined
    const cc = candidateCount.trim() ? Number(candidateCount) : defaultCount
    const payload: ExamSession = {
      id: editSessionId || genId(),
      examName: nm,
      subjectText: subj,
      courseId: courseId || undefined,
      date,
      startTime,
      endTime,
      candidateCount: Number.isFinite(cc as any) ? (cc as any) : undefined,
    }

    if (editSessionId) updateSession(payload)
    else addSession(payload)
    resetSessionForm()
  }

  const resetAssignForm = () => {
    setEditAssignId(null)
    setAssignSessionId('')
    setAssignRoomId('')
    setAssignTeacherIds([])
    setAssignClassIds([])
    setAssignCount('')
  }

  const startEditAssign = (a: ExamRoomAssignment) => {
    setEditAssignId(a.id)
    setAssignSessionId(a.sessionId)
    setAssignRoomId(a.roomId)
    setAssignTeacherIds([...a.invigilatorTeacherIds])
    setAssignClassIds([...a.classIds])
    setAssignCount(typeof a.assignedCandidateCount === 'number' ? String(a.assignedCandidateCount) : '')
  }

  const saveAssign = () => {
    if (!assignSessionId || !assignRoomId) return
    const count = assignCount.trim() ? Number(assignCount) : undefined
    const payload: ExamRoomAssignment = {
      id: editAssignId || genId(),
      sessionId: assignSessionId,
      roomId: assignRoomId,
      invigilatorTeacherIds: assignTeacherIds.slice(0, 2),
      classIds: assignClassIds,
      assignedCandidateCount: Number.isFinite(count as any) ? (count as any) : undefined,
    }
    if (editAssignId) updateAssign(payload)
    else addAssign(payload)
    resetAssignForm()
  }

  const sessionOptions = useMemo(() => [...sessions].sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime)), [sessions])

  return (
    <div className="p-4 max-w-6xl">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h2 className="text-xl font-bold">Exams / Invigilation</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Filter date:</span>
          <input className="border rounded px-2 py-1 text-sm" type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} />
          {filterDate && <button className="text-sm text-gray-600" onClick={() => setFilterDate('')}>Clear</button>}
        </div>
      </div>

      {conflicts.length > 0 ? (
        <div className="mt-3 border border-red-300 bg-red-50 rounded p-2 text-sm text-red-700">
          <div className="font-semibold">Conflicts: {conflicts.length}</div>
          <div className="text-xs">(teacher/room overlap at the same time)</div>
        </div>
      ) : (
        <div className="mt-3 text-sm text-green-700">No exam conflicts</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
        <div className="border rounded p-3 bg-gray-50">
          <h3 className="font-semibold mb-2">Exam Session</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-end">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Exam name</label>
              <input className="border rounded px-2 py-1 w-full" value={examName} onChange={(e) => setExamName(e.target.value)} placeholder="e.g. Final Exam" />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Course (optional)</label>
              <select
                className="border rounded px-2 py-1 w-full"
                value={courseId}
                onChange={(e) => {
                  const id = e.target.value
                  setCourseId(id)
                  const co = id ? courseById.get(id) : undefined
                  if (co) {
                    setSubjectText(co.name)
                    if (typeof co.enrollment === 'number') setCandidateCount(String(co.enrollment))
                  }
                }}
              >
                <option value="">(none)</option>
                {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs text-gray-600 mb-1">Subject (type or use Course)</label>
              <input
                className="border rounded px-2 py-1 w-full"
                value={subjectText}
                onChange={(e) => { setSubjectText(e.target.value); if (courseId) setCourseId('') }}
                placeholder="e.g. AP Physics 1"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Date</label>
              <input className="border rounded px-2 py-1 w-full" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Candidate count</label>
              <input className="border rounded px-2 py-1 w-full" inputMode="numeric" value={candidateCount} onChange={(e) => setCandidateCount(e.target.value)} placeholder="(optional)" />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Start</label>
              <input className="border rounded px-2 py-1 w-full" value={startTime} onChange={(e) => setStartTime(e.target.value)} placeholder="HH:mm" />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">End</label>
              <input className="border rounded px-2 py-1 w-full" value={endTime} onChange={(e) => setEndTime(e.target.value)} placeholder="HH:mm" />
            </div>
          </div>

          <div className="flex gap-2 mt-3">
            <button className="bg-green-600 text-white px-3 py-1 rounded text-sm" onClick={saveSession}>{editSessionId ? 'Update' : 'Add'}</button>
            <button className="text-gray-600 text-sm" onClick={resetSessionForm}>Clear</button>
          </div>

          <div className="mt-4">
            <h4 className="font-semibold mb-2">Sessions</h4>
            {sessions.length === 0 ? <div className="text-sm text-gray-400">No sessions yet.</div> : (
              <div className="space-y-2">
                {sessionOptions.map((s) => (
                  <div key={s.id} className="bg-white border rounded p-2 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-medium truncate">{s.examName} | {s.subjectText}</div>
                      <div className="text-xs text-gray-500">{s.date} {s.startTime}-{s.endTime}{typeof s.candidateCount === 'number' ? ` | ${s.candidateCount} students` : ''}</div>
                    </div>
                    <div className="flex gap-2">
                      <button className="text-blue-600 text-sm" onClick={() => startEditSession(s)}>Edit</button>
                      <button className="text-red-600 text-sm" onClick={() => { if (confirm('Delete session? (Assignments will be removed)')) deleteSession(s.id) }}>Del</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="border rounded p-3 bg-gray-50">
          <h3 className="font-semibold mb-2">Room Assignment</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-end">
            <div className="sm:col-span-2">
              <label className="block text-xs text-gray-600 mb-1">Session</label>
              <select className="border rounded px-2 py-1 w-full" value={assignSessionId} onChange={(e) => setAssignSessionId(e.target.value)}>
                <option value="">Select session</option>
                {sessionOptions.map(s => <option key={s.id} value={s.id}>{s.date} {s.startTime}-{s.endTime} | {s.subjectText}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Room</label>
              <select className="border rounded px-2 py-1 w-full" value={assignRoomId} onChange={(e) => setAssignRoomId(e.target.value)}>
                <option value="">Select room</option>
                {rooms.map(r => <option key={r.id} value={r.id}>{r.name}{typeof r.capacity === 'number' ? ` (${r.capacity})` : ''}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Assigned count</label>
              <input className="border rounded px-2 py-1 w-full" inputMode="numeric" value={assignCount} onChange={(e) => setAssignCount(e.target.value)} placeholder="(optional)" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs text-gray-600 mb-1">Invigilators (max 2)</label>
              <select
                className="border rounded px-2 py-1 w-full"
                multiple
                value={assignTeacherIds}
                onChange={(e) => {
                  const vals = Array.from(e.target.selectedOptions).map(o => o.value)
                  setAssignTeacherIds(vals.slice(0, 2))
                }}
              >
                {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
              <div className="text-xs text-gray-500 mt-1">Hold Cmd/Ctrl to select 2 teachers</div>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs text-gray-600 mb-1">Classes</label>
              <select
                className="border rounded px-2 py-1 w-full"
                multiple
                value={assignClassIds}
                onChange={(e) => setAssignClassIds(Array.from(e.target.selectedOptions).map(o => o.value))}
              >
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <div className="text-xs text-gray-500 mt-1">Hold Cmd/Ctrl to select multiple classes</div>
            </div>
          </div>

          <div className="flex gap-2 mt-3">
            <button className="bg-green-600 text-white px-3 py-1 rounded text-sm" onClick={saveAssign}>{editAssignId ? 'Update' : 'Add'}</button>
            <button className="text-gray-600 text-sm" onClick={resetAssignForm}>Clear</button>
          </div>

          <div className="mt-4">
            <h4 className="font-semibold mb-2">Assignments</h4>
            {shownAssigns.length === 0 ? <div className="text-sm text-gray-400">No assignments.</div> : (
              <div className="space-y-2">
                {shownAssigns.map((a) => {
                  const s = sessionsById.get(a.sessionId)
                  const room = roomById.get(a.roomId)
                  const cap = room?.capacity
                  const cnt = typeof a.assignedCandidateCount === 'number' ? a.assignedCandidateCount : (s?.candidateCount)
                  const overCap = typeof cap === 'number' && typeof cnt === 'number' && cnt > cap
                  const warnTeachers = (typeof cnt === 'number' && cnt <= 20 && a.invigilatorTeacherIds.length > 1) || (typeof cnt === 'number' && cnt > 20 && a.invigilatorTeacherIds.length < 2)
                  return (
                    <div key={a.id} className={`bg-white border rounded p-2 ${conflictAssignIds.has(a.id) ? 'border-red-400 bg-red-50' : ''}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="font-medium truncate">{s ? `${s.date} ${s.startTime}-${s.endTime} | ${s.subjectText}` : '(missing session)'}</div>
                          <div className="text-sm text-gray-700">Room: {room?.name || '-'}</div>
                          <div className="text-sm text-gray-700">Invigilators: {a.invigilatorTeacherIds.map(id => teacherById.get(id)?.name || '-').join(', ') || '-'}</div>
                          <div className="text-sm text-gray-700">Classes: {a.classIds.map(id => classById.get(id)?.name || '-').join(', ') || '-'}</div>
                          <div className={`text-xs ${overCap ? 'text-red-700 font-semibold' : 'text-gray-500'}`}>
                            Count: {typeof cnt === 'number' ? cnt : '-'}{typeof cap === 'number' ? ` | Capacity: ${cap}` : ''}{overCap ? ' (over capacity)' : ''}
                            {warnTeachers ? ' | Invigilator count check' : ''}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button className="text-blue-600 text-sm" onClick={() => startEditAssign(a)}>Edit</button>
                          <button className="text-red-600 text-sm" onClick={() => { if (confirm('Delete assignment?')) deleteAssign(a.id) }}>Del</button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
