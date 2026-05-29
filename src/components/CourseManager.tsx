import { useState } from 'react'
import { useStore, genId } from '../store'
import type { CourseType, CourseGroup } from '../types'

export function CourseManager() {
  const { courses, teachers, rooms, classes, addCourse, removeCourse, updateCourse } = useStore()
  const [name, setName] = useState('')
  const [type, setType] = useState<CourseType>('必修')
  const [classId, setClassId] = useState('')
  const [lpw, setLpw] = useState(3)
  const [enroll, setEnroll] = useState<string>('')
  const [groups, setGroups] = useState<CourseGroup[]>([])
  const [editId, setEditId] = useState<string | null>(null)
  const [gl, setGl] = useState('')
  const [gt, setGt] = useState('')
  const [gr, setGr] = useState('')
  const addGroup = () => {
    if (!gt || !gr) return
    // label is optional: empty means whole-class / no subgroup label
    setGroups([...groups, { label: gl.trim(), teacherId: gt, roomId: gr }])
    setGl(''); setGt(''); setGr('')
  }
  const handleAdd = () => {
    if (!name.trim() || !classId || groups.length === 0) return
    const enrollment = enroll.trim() ? Number(enroll) : undefined
    if (enroll.trim() && (!Number.isFinite(enrollment) || enrollment! < 0)) return

    if (editId) { updateCourse({ id: editId, name: name.trim(), type, classId, lessonsPerWeek: lpw, enrollment, groups }); setEditId(null) }
    else { addCourse({ id: genId(), name: name.trim(), type, classId, lessonsPerWeek: lpw, enrollment, groups }) }
    setName(''); setClassId(''); setGroups([]); setLpw(3)
    setEnroll('')
  }
  const startEdit = (co: typeof courses[number]) => {
    setEditId(co.id)
    setName(co.name)
    setType(co.type)
    setClassId(co.classId)
    setLpw(co.lessonsPerWeek)
    setEnroll(typeof co.enrollment === 'number' ? String(co.enrollment) : '')
    setGroups([...co.groups])
  }
  const tn = (id: string) => teachers.find(t => t.id === id)?.name ?? '-'
  const rn = (id: string) => rooms.find(r => r.id === id)?.name ?? '-'
  const cn= (id: string) => classes.find(c => c.id === id)?.name ?? '-'
  return (
    <div className="p-4 max-w-3xl">
      <h2 className="text-xl font-bold mb-4">Courses</h2>
      <div className="flex gap-2 mb-4 flex-wrap items-end">
        <input className="border rounded px-2 py-1 flex-1 min-w-[100px]" placeholder="Course name" value={name} onChange={(e) => setName(e.target.value)} />
        <select className="border rounded px-2 py-1" value={type} onChange={(e) => setType(e.target.value as CourseType)}>
          <option value="必修">Required</option><option value="走班">Elective</option>
        </select>
        <select className="border rounded px-2 py-1" value={classId} onChange={(e) => setClassId(e.target.value)}>
          <option value="">Select class</option>
          {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <div className="flex items-center gap-1">
          <span className="text-sm text-gray-600">Per week:</span>
          <input className="border rounded px-2 py-1 w-16" type="number" min={1} max={20} value={lpw} onChange={(e) => setLpw(Number(e.target.value))} />
        </div>
        <div className="flex items-center gap-1">
          <span className="text-sm text-gray-600">Students:</span>
          <input className="border rounded px-2 py-1 w-20" placeholder="e.g. 18" inputMode="numeric" value={enroll} onChange={(e) => setEnroll(e.target.value)} />
        </div>
        <button className="bg-blue-500 text-white px-4 py-1 rounded" onClick={handleAdd}>{editId ? 'Update' : 'Add'}</button>
        {editId && <button className="text-gray-500 text-sm" onClick={() => { setEditId(null); setName(''); setClassId(''); setGroups([]); setLpw(3); setEnroll('') }}>Cancel</button>}
      </div>
      <div className="border rounded p-3 mb-4 bg-gray-50">
        <p className="text-sm font-semebold mb-2">Add group (parallel sessions at same time)</p>
        <div className="flex gap-2 flex-wrap items-end">
          <input className="border rounded px-2 py-1 w-32" placeholder="Group label (optional)" value={gl} onChange={(e) => setGl(e.target.value)} />
          <select className="border rounded px-2 py-1" value={gt} onChange={(e) => setGt(e.target.value)}>
            <option value="">Teacher</option>
            {teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <select className="border rounded px-2 py-1" value={gr} onChange={(e) => setGr(e.target.value)}>
            <option value="">Room</option>
            {rooms.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
          <button className="bg-green-500 text-white px-3 py-1 rounded text-sm" onClick={addGroup}>Add Group</button>
        </div>
        {groups.length > 0 && (
          <div className="flex gap-2 mt-2 flex-wrap">
            {groups.map((g, i) => (
              <span key={i} className="bg-white border rounded px-2 py-1 text-sm">
                {(g.label || 'All')}(@{rn(g.roomId)}) - {tn(g.teacherId)}
                <button className="text-red-500 ml-1" onClick={() => setGroups(groups.filter((_, id) => id !== i))}>x</button>
              </span>
            ))}
          </div>
        )}
      </div>
      {courses.length === 0 ? <p className="text-gray-400 text-sm">No courses yet.</p> : (
        <table className="w-full border-collapse">
          <thead><tr className="bg-gray-100">
            <th className="border p-2 text-left">Name</th>
            <th className="border p-2 text-left">Type</th>
            <th className="border p-2 text-left">Class</th>
            <th className="border p-2 text-left">Groups</th>
            <th className="border p-2 text-left">Per Week</th>
            <th className="border p-2 text-left">Students</th>
            <th className="border p-2 text-left">Actions</th>
          </tr></thead>
          <tbody>
            {courses.map((co) => (
              <tr key={co.id}>
                <td className="border p-2">{co.name}</td>
                <td className="border p-2"><span className={co.type === '走班' ? 'text-orange-500 font-semibold' : ''}>{co.type}</span></td>
                <td className="border p-2">{cn(co.classId)}</td>
                <td className="border p-2 text-sm">{co.groups.map((g) => `${g.label || 'All'}(${tn(g.teacherId)})`).join(', ')}</td>
                <td className="border p-2">{co.lessonsPerWeek}</td>
                <td className="border p-2">{typeof co.enrollment === 'number' ? co.enrollment : <span className="text-gray-400 text-sm">-</span>}</td>
                <td className="border p-2 space-x-1">
                  <button className="text-blue-500 text-sm" onClick={() => startEdit(co)}>Edit</button>
                  <button className="text-red-500 text-sm" onClick={() => { if (confirm('Delete?')) removeCourse(co.id) }}>Del</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
