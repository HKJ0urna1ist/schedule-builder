import { useState } from 'react'
import { useStore, genId } from '../store'
import type { Room } from '../types'

export function RoomManager() {
  const { rooms, addRoom, removeRoom, updateRoom } = useStore()
  const [name, setName] = useState('')
  const [type, setType] = useState<Room['type']>('普通')
  const [capacity, setCapacity] = useState(50)
  const [editId, setEditId] = useState<string | null>(null)

  const handleAdd = () => {
    if (!name.trim()) return
    if (editId) {
      updateRoom({ id: editId, name: name.trim(), type, capacity })
      setEditId(null)
    } else {
      addRoom({ id: genId(), name: name.trim(), type, capacity })
    }
    setName('')
  }

  return (
    <div className="p-4 max-w-2xl">
      <h2 className="text-xl font-bold mb-4">教室管理</h2>
      <div className="flex gap-2 mb-4 flex-wrap">
        <input className="border rounded px-2 py-1 flex-1 min-w-[120px]" placeholder="教室名称" value={name} onChange={(e) => setName(e.target.value)} />
        <select className="border rounded px-2 py-1" value={type} onChange={(e) => setType(e.target.value as Room['type'])}>
          <option value="普通">普通</option>
          <option value="实验室">实验室</option>
          <option value="操场">操场</option>
          <option value="其他">其他</option>
        </select>
        <input className="border rounded px-2 py-1 w-20" type="number" placeholder="容量" value={capacity} onChange={(e) => setCapacity(Number(e.target.value))} />
        <button className="bg-blue-500 text-white px-4 py-1 rounded" onClick={handleAdd}>
          {editId ? '更新' : '添加'}
        </button>
      </div>
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2 text-left">名称</th>
            <th className="border p-2 text-left">类型</th>
            <th className="border p-2 text-left">容量</th>
            <th className="border p-2 text-left">操作</th>
          </tr>
        </thead>
        <tbody>
          {rooms.map((r) => (
            <tr key={r.id}>
              <td className="border p-2">{r.name}</td>
              <td className="border p-2">{r.type}</td>
              <td className="border p-2">{r.capacity}</td>
              <td className="border p-2 space-x-1">
                <button className="text-blue-500 text-sm" onClick={() => { setEditId(r.id); setName(r.name); setType(r.type); setCapacity(r.capacity) }}>编辑</button>
                <button className="text-red-500 text-sm" onClick={() => { if (confirm('确定删除？')) removeRoom(r.id) }}>删除</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}