import { useState } from 'react'
import { useStore, genId } from '../store'
import type { ClassInfo } from '../types'

export function ClassManager() {
  const { classes, rooms, addClass, removeClass, updateClass, fixedSchedules } = useStore()
  const [name, setName] = useState('')
  const [roomId, setRoomId] = useState('')
  const [editId, setEditId] = useState<string | null>(null)

  const handleAdd = () => {
    if (!name.trim() || !roomId) return
    if (editId) {
      const existing = classes.find((c) => c.id === editId)
      if (existing) {
        updateClass({ ...existing, name: name.trim(), roomId })
      }
      setEditId(null)
    } else {
      addClass({ id: genId(), name: name.trim(), roomId, courseIds: [] })
    }
    setName('')
    setRoomId('')
  }

  const startEdit = (c: ClassInfo) => {
    setEditId(c.id)
    setName(c.name)
    setRoomId(c.roomId)
  }

  return (
    <div className="p-4 max-w-2xl">
      <h2 className="text-xl font-bold mb-4">班级管理</h2>
      <div className="flex gap-2 mb-4">
        <input className="border rounded px-2 py-1 flex-1" placeholder="班级名称" value={name} onChange={(e) => setName(e.target.value)} />
        <select className="border rounded px-2 py-1" value={roomId} onChange={(e) => setRoomId(e.target.value)}>
          <option value="">选择教室</option>
          {rooms.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
        <button className="bg-blue-500 text-white px-4 py-1 rounded" onClick={handleAdd}>
          {editId ? '更新' : '添加'}
        </button>
      </div>
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2 text-left">名称</th>
            <th className="border p-2 text-left">教室</th>
            <th className="border p-2 text-left">课程数</th>
            <th className="border p-2 text-left">固定课时</th>
            <th className="border p-2 text-left">操作</th>
          </tr>
        </thead>
        <tbody>
          {classes.map((c) => (
            <tr key={c.id}>
              <td className="border p-2">{c.name}</td>
              <td className="border p-2">{rooms.find((r) => r.id === c.roomId)?.name || '-'}</td>
              <td className="border p-2">{c.courseIds.length}</td>
              <td className="border p-2">{fixedSchedules.filter((f) => f.classId === c.id).length}</td>
              <td className="border p-2 space-x-1">
                <button className="text-blue-500 text-sm" onClick={() => startEdit(c)}>编辑</button>
                <button className="text-red-500 text-sm" onClick={() => { if (confirm('确定删除？')) removeClass(c.id) }}>删除</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}