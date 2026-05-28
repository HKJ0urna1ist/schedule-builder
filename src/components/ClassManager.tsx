import { useState } from 'react'
import { useStore, genId } from '../store'
import type { ClassInfo } from '../types'

export function ClassManager() {
  const { classes, addClass, removeClass, updateClass } = useStore()
  const [name, setName] = useState('')
  const [editId, setEditId] = useState<string | null>(null)

  const handleAdd = () => {
    if (!name.trim()) return
    if (editId) {
      updateClass({ id: editId, name: name.trim() })
      setEditId(null)
    } else {
      addClass({ id: genId(), name: name.trim() })
    }
    setName('')
  }

  const startEdit = (c: ClassInfo) => {
    setEditId(c.id)
    setName(c.name)
  }

  return (
    <div className="p-4 max-w-2xl">
      <h2 className="text-xl font-bold mb-4">班级管理（行政班）</h2>
      <div className="flex gap-2 mb-4">
        <input className="border rounded px-2 py-1 flex-1" placeholder="班级名称" value={name} onChange={(e) => setName(e.target.value)} />
        <button className="bg-blue-500 text-white px-4 py-1 rounded" onClick={handleAdd}>
          {editId ? '更新' : '添加'}
        </button>
      </div>
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2 text-left">名称</th>
            <th className="border p-2 text-left">操作</th>
          </tr>
        </thead>
        <tbody>
          {classes.map((c) => (
            <tr key={c.id}>
              <td className="border p-2">{c.name}</td>
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