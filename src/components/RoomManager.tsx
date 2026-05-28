import { useState } from 'react'
import { useStore, genId } from '../store'

export function RoomManager() {
  const { rooms, addRoom, removeRoom, updateRoom } = useStore()
  const [name, setName] = useState('')
  const [editId, setEditId] = useState<string | null>(null)

  const handleAdd = () => {
    if (!name.trim()) return
    if (editId) {
      updateRoom({ id: editId, name: name.trim() })
      setEditId(null)
    } else {
      addRoom({ id: genId(), name: name.trim() })
    }
    setName('')
  }

  return (
    <div className="p-4 max-w-2xl">
      <h2 className="text-xl font-bold mb-4">教宺管理</h2>
      <div className="flex gap-2 mb-4">
        <input className="border rounded px-2 py-1 flex-1" placeholder="教定跢见名称" value={name} onChange={(e) => setName(e.target.value)} />
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
          {rooms.map((r) => (
            <tr key={r.id}>
              <td className="border p-2">{r.name}</td>
              <td className="border p-2 space-x-1">
                <button className="text-blue-500 text-sm" onClick={() => { setEditId(r.id); setName(r.name) }}>编辑</button>
                <button className="text-red-500 text-sm" onClick={() => { if (confirm('确定褻騘蝿？')) removeRoom(r.id) }}>删除</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
