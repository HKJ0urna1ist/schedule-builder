import { useState } from 'react'
import { useStore, genId } from '../store'

export function RoomManager() {
  const { rooms, addRoom, removeRoom, updateRoom } = useStore()
  const [name, setName] = useState('')
  const [cap, setCap] = useState<string>('')
  const [editId, setEditId] = useState<string | null>(null)
  const handleAdd = () => {
    if (!name.trim()) return
    const capacity = cap.trim() ? Number(cap) : undefined
    if (cap.trim() && (!Number.isFinite(capacity) || capacity! < 0)) return

    if (editId) { updateRoom({ id: editId, name: name.trim(), capacity }); setEditId(null) }
    else { addRoom({ id: genId(), name: name.trim(), capacity }) }
    setName('')
    setCap('')
  }
  return (
    <div className="p-4 max-w-2xl">
      <h2 className="text-xl font-bold mb-4">Rooms</h2>
      <div className="flex gap-2 mb-4 flex-wrap items-end">
        <input className="border rounded px-2 py-1 flex-1 min-w-[160px]" placeholder="Room name" value={name} onChange={(e) => setName(e.target.value)} />
        <input className="border rounded px-2 py-1 w-28" placeholder="Capacity" inputMode="numeric" value={cap} onChange={(e) => setCap(e.target.value)} />
        <button className="bg-blue-500 text-white px-4 py-1 rounded" onClick={handleAdd}>{editId ? 'Update' : 'Add'}</button>
      </div>
      <table className="w-full border-collapse">
        <thead><tr className="bg-gray-100"><th className="border p-2 text-left">Name</th><th className="border p-2 text-left">Capacity</th><th className="border p-2 text-left">Actions</th></tr></thead>
        <tbody>
          {rooms.map((r) => (
            <tr key={r.id}><td className="border p-2">{r.name}</td>
              <td className="border p-2">{typeof r.capacity === 'number' ? r.capacity : <span className="text-gray-400 text-sm">-</span>}</td>
              <td className="border p-2 space-x-1">
                <button className="text-blue-500 text-sm" onClick={() => { setEditId(r.id); setName(r.name); setCap(typeof r.capacity === 'number' ? String(r.capacity) : '') }}>Edit</button>
                <button className="text-red-500 text-sm" onClick={() => { if (confirm('Delete?')) removeRoom(r.id) }}>Del</button>
              </td></tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
