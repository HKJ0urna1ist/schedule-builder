import { useState } from 'react'
import { useStore, genId } from '../store'
import type { CourseType, CourseGroup } from '../types'

export function CourseManager() {
  const { courses, teachers, rooms, classes, addCourse, removeCourse, updateCourse } = useStore()
  const [name, setName] = useState('')
  const [type, setType] = useState<CourseType>('必修')
  const [classId, setClassId] = useState('')
  const [lessonsPerWeek, setLessonsPerWeek] = useState(3)
  const [groups, setGroups] = useState<CourseGroup[]>([])
  const [editId, setEditId] = useState<string | null>(null)

  const [gLabel, setGLabel] = useState('')
  const [gTeacher, setGTeacher] = useState('')
  const [gRoom, setGRoom] = useState('')

  const addGroup = () => {
    if (!gLabel.trim() || !gTeacher || !gRoom) return
    setGroups([...groups, { label: gLabel.trim(), teacherId: gTeacher, roomId: gRoom }])
    setGLabel('')
    setGTeacher('')
    setGRoom('')
  }

  const removeGroup = (idx: number) => {
    setGroups(groups.filter((_, i) => i !== idx))
  }

  const handleAdd = () => {
    if (!name.trim() || !classId || groups.length === 0) return
    if (editId) {
      updateCourse({ id: editId, name: name.trim(), type, classId, lessonsPerWeek, groups })
      setEditId(null)
    } else {
      addCourse({ id: genId(), name: name.trim(), type, classId, lessonsPerWeek, groups })
    }
    setName('')
    setClassId('')
    setGroups([])
    setLessonsPerWeek(3)
  }

  const startEdit = (co: typeof courses[number]) => {
    setEditId(co.id)
    setName(co.name)
    setType(co.type)
    setClassId(co.classId)
    setLessonsPerWeek(co.lessonsPerWeek)
    setGroups([...co.groups])
  }

  const reset = () => {
    setEditId(null)
    setName('')
    setClassId('')
    setGroups([])
    setLessonsPerWeek(3)
  }

  const getTeacherName = (tid: string) => teachers.find((t) => t.id === tid)?.name ?? '-'
  const getRoomName = (rid: string) => rooms.find((r) => r.id === rid)?.name ?? '-'
  const getClassName = (cid: string) => classes.find((c) => c.id === cid)?.name ?? '-'

  return (
    <div className="p-4 max-w-3xl">
      <h2 className="text-xl font-bold mb-4">课程管理</h2>

      <div className="flex gap-2 mb-4 flex-wrap items-end">
        <input className="border rounded px-2 py-1 flex-1 min-w-[100px]" placeholder="课程名称" value={name} onChange={(e) => setName(e.target.value)} />
        <select className="border rounded px-2 py-1" value={type} onChange={(e) => setType(e.target.value as CourseType)}>
          <option value="必修">必修</option>
          <option value="走班">走班</option>
        </select>
        <select className="border rounded px-2 py-1" value={classId} onChange={(e) => setClassId(e.target.value)}>
          <option value="">选择班级</option>
          {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <div className="flex items-center gap-1">
          <span className="text-sm text-gray-600">周课时:</span>
          <input className="border rounded px-2 py-1 w-16" type="number" min={1} max={20} value={lessonsPerWeek}
            onChange={(event) => setLessonsPerWeek(Number(event.target.value))} />
        </div>
        <button className="bg-blue-500 text-white px-4 py-1 rounded" onClick={handleAdd}>
          {editId ? '更新' : '添加'}
        </button>
        {editId && (
          <button className="text-gray-500 text-sm" onClick={reset}>取消</button>
        )}
      </div>

      <div className="border rounded p-3 mb-4 bg-gray-50">
        <p className="text-sm font-semibold mb-2">已度分公（同各时间在不分啀对累上下青入）</p>
        <div className="flex gap-2 flex-wrap items-end">
          <input className="border rounded px-2 py-1 w-24" placeholder="分规秛" value={gLabel} onChange={(e) => setGLabel(e.target.value)} />
          <select className="border rounded px-2 py-1" value={gTeacher} onChange={(e) => setGTeacher(e.target.value)}>
            <option value="">选教师</option>
            {teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <select className="border rounded px-2 py-1" value={gRoom} onChange={(e) => setGRoom(e.target.value)}>
            <option value="">选教宺</option>
            {rooms.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
          <button className="bg-green-500 text-white px-3 py-1 rounded text-sm" onClick={addGroup}>添加分組员</button>
        </div>
        {groups.length > 0 && (
          <div className="flex gap-2 mt-2 flex-wrap">
            {groups.map((g, i) => (
              <span key={i} className="bg-white border rounded px-2 py-1 text-sm">
                {g.label}(@{getRoomName(g.roomId)}) - {getTeacherName(g.teacherId)}
                <button className="text-red-500 ml-1" onClick={() => removeGroup(i)}>x</button>
              </span>
            ))}
          </div>
        )}
      </div>

      {courses.length === 0 ? (
        <p className="text-gray-400 text-sm">暂无课程，请添加</p>
      ) : (
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2 text-left">名称</th>
              <th className="border p-2 text-left">类型教师金实即</th>
              <th className="border p-2 text-left">班级维</th>
              <th className="border p-2 text-left">分公_(合详／是在同时间对不同频原开的课</th>
              <th className="border p-2 text-left">周课月时</th>
              <th className="border p-2 text-left">操作</th>
            </tr>
          </thead>
          <tbody>
            {courses.map((co) => (
              <tr key={co.id}>
                <td className="border p-2">{co.name}</td>
                <td className="border p-2">
                  <span className={co.type === '走班' ? 'text-orange-500 font-semibold' : ''}>{co.type}</span>
                </td>
                <td className="border p-2">{getClassName(co.classId)}</td>
                <td className="border p-2 text-sm">
                  {co.groups.map((g) => `${g.label}(${getTeacherName(g.teacherId)})`).join(', ')}
                </td>
                <td className="border p-2">{co.lessonsPerWeek}</td>
                <td className="border p-2 space-x-1">
                  <button className="text-blue-500 text-sm" onClick={() => startEdit(co)}>编辑</button>
                  <button className="text-red-500 text-sm" onClick={() => { if (confirm('确定删除？')) removeCourse(co.id) }}>删除</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
