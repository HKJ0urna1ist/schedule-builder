import { useState } from 'react'
import { useStore, genId } from '../store'
import type { CourseType } from '../types'

export function CourseManager() {
  const { courses, teachers, classes, addCourse, removeCourse, updateCourse } = useStore()
  const [name, setName] = useState('')
  const [type, setType] = useState<CourseType>('必修')
  const [teacherId, setTeacherId] = useState('')
  const [classIds, setClassIds] = useState<string[]>([])
  const [lessonsPerWeek, setLessonsPerWeek] = useState(3)
  const [editId, setEditId] = useState<string | null>(null)

  const handleAdd = () => {
    if (!name.trim() || !teacherId || classIds.length === 0) return
    if (editId) {
      updateCourse({ id: editId, name: name.trim(), type, teacherId, classIds, lessonsPerWeek })
      setEditId(null)
    } else {
      addCourse({ id: genId(), name: name.trim(), type, teacherId, classIds, lessonsPerWeek })
    }
    setName('')
    setClassIds([])
    setTeacherId('')
    setLessonsPerWeek(3)
  }

  const toggleClass = (id: string) => {
    setClassIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const getTeacherName = (tid: string) => teachers.find((t) => t.id === tid)?.name ?? '-'
  const getClassNames = (cids: string[]) =>
    cids.map((id) => classes.find((c) => c.id === id)?.name ?? '').filter(Boolean).join(', ') || '-'

  return (
    <div className="p-4 max-w-3xl">
      <h2 className="text-xl font-bold mb-4">课程管理</h2>
      <div className="flex gap-2 mb-4 flex-wrap items-end">
        <input className="border rounded px-2 py-1 flex-1 min-w-[100px]" placeholder="课程名称" value={name} onChange={(e) => setName(e.target.value)} />
        <select className="border rounded px-2 py-1" value={type} onChange={(e) => setType(e.target.value as CourseType)}>
          <option value="必修">必修</option>
          <option value="走班">走班</option>
        </select>
        <select className="border rounded px-2 py-1" value={teacherId} onChange={(e) => setTeacherId(e.target.value)}>
          <option value="">选择教师</option>
          {teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <div className="flex items-center gap-1">
          <span className="text-sm text-gray-600">周课时:</span>
          <input className="border rounded px-2 py-1 w-16" type="number" min={1} max={20} value={lessonsPerWeek}
            onChange={(event) => {
              setLessonsPerWeek(Number(event.target.value))
            }} />
        </div>
        <button className="bg-blue-500 text-white px-4 py-1 rounded" onClick={handleAdd}>
          {editId ? '更新' : '添加'}
        </button>
        {editId && (
          <button className="text-gray-500 text-sm"
            onClick={() => {
              setEditId(null)
              setName('')
              setClassIds([])
              setTeacherId('')
              setLessonsPerWeek(3)
            }}
          >
            取消
          </button>
        )}
      </div>
      <div className="flex gap-2 mb-4 flex-wrap">
        <span className="text-sm text-gray-600 self-center">关联班级：</span>

      </div>
      <div className="flex gap-2 mb-4 flex-wrap">
        <span className="text-sm text-gray-600 self-center">关联班级：</span>
        {classes.length === 0 ? <span className="text-gray-400 text-sm">暂无班级</span> : classes.map((ci) => (
          <label key={ci.id} className="flex items-center gap-1 text-sm cursor-pointer">
            <input type="checkbox" checked={classIds.includes(ci.id)} onChange={() => toggleClass(ci.id)} />
            {ci.name}
          </label>
        ))}
      </div>      {courses.length === 0 ? (
        <p className="text-gray-400 text-sm">暂无课程、请淲加</p>
      ) : (
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2 text-left">名称</th>
              <th className="border p-2 text-left">类型</th>
              <th className="border p-2 text-left">教师</th>
              <th className="border p-2 text-left">班级</th>
              <th className="border p-2 text-left">周课时</th>
              <th className="border p-2 text-left">操作</th>
            </tr>
          </thead>
          <tbody>
            {courses.map((ci) => {
              const tn = getTeacherName(ci.teacherId)
              const cn = getClassNames(ci.classIds)
              const zb = ci.type === '走班'
              return (
                <tr key={ci.id}>
                  <td className="border p-2">{ci.name}</td>
                  <td className="border p-2">
                    <span className={zb ? 'text-orange-500 font-semibold' : ''}>{ci.type}</span>
                  </td>
                  <td className="border p-2">{tn}</td>
                  <td className="border p-2">{cn}</td>
                  <td className="border p-2">{ci.lessonsPerWeek}</td>
                  <td className="border p-2 space-x-1">
                    <button className="text-blue-500 text-sm" onClick={() => {
                      setEditId(ci.id)
                      setName(ci.name)
                      setType(ci.type)
                      setTeacherId(ci.teacherId)
                      setClassIds([...ci.classIds])
                      setLessonsPerWeek(ci.lessonsPerWeek)
                    }}>编辑</button>
                    <button className="text-red-500 text-sm" onClick={() => { if (confirm('确定轠阐？')) removeCourse(ci.id) }}>删除</button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </div>
  )
}
