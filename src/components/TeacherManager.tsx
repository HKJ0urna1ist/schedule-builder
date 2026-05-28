import { useState } from 'react'
import { useStore, genId } from '../store'

export function TeacherManager() {
  const { teachers, addTeacher, removeTeacher, updateTeacher, courses } = useStore()
  const [name, setName] = useState('')
  const [editId, setEditId] = useState<string | null>(null)
  const handleAdd = () => {
    if (!name.trim()) return
    if (editId) { updateTeacher({ id: editId, name: name.trim() }); setEditId(null) }
    else { addTeacher({ id: genId(), name: name.trim() }) }
    setName('')
  }
  return (
    <div className="p-4 max-w-2xl">
      <h2 className="text-xl font-bold mb-4">Teachers</h2>
      <div className="flex gap-2 mb-4">
        <input className="border rounded px-2 py-1 flex-1" placeholder="Teacher name" value={name} onChange={(e) => setName(e.target.value)} />
        <button className="bg-blue-500 text-white px-4 py-1 rounded" onClick={handleAdd}>{editId ? 'Update' : 'Add'}</button>
      </div>
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2 text-left">Name</th>
            <th className="border p-2 text-left">Courses</th>
            <th className="border p-2 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {teachers.map((t) => (
            <tr key={t.id}>
              <td className="border p-2">{t.name}</td>
              <td className="border p-2">
                {courses.filter((c) => c.groups.some((g) => g.teacherId === t.id)).map((c) => c.name).join(', ') || '-'}
              </td>
              <td className="border p-2 space-x-1">
                <button className="text-blue-500 text-sm" onClick={() => { setEditId(t.id); setName(t.name) }}>Edit</button>
                <button className="text-red-500 text-sm" onClick={() => { if (confirm('Delete?')) removeTeacher(t.id) }}>Del</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
