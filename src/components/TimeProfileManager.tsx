import { useMemo, useState } from 'react'
import { useStore, genId } from '../store'
import { PERIODS } from '../types'

function isHHMM(v: string) {
  return /^\d{2}:\d{2}$/.test(v)
}

export function TimeProfileManager() {
  const timeProfiles = useStore(s => s.timeProfiles)
  const cycles = useStore(s => s.cycles)
  const activeCycleId = useStore(s => s.activeCycleId)
  const setCycleTimeProfile = useStore(s => s.setCycleTimeProfile)
  const addTimeProfile = useStore(s => s.addTimeProfile)
  const updateTimeProfile = useStore(s => s.updateTimeProfile)
  const deleteTimeProfile = useStore(s => s.deleteTimeProfile)

  const activeCycle = cycles.find(c => c.id === activeCycleId) || cycles[0]
  const activeTimeProfileId = activeCycle?.timeProfileId

  const [editId, setEditId] = useState<string | null>(null)
  const editing = useMemo(() => timeProfiles.find(p => p.id === editId) || null, [timeProfiles, editId])
  const [name, setName] = useState('')
  const [times, setTimes] = useState<Record<number, { start: string; end: string }>>({})

  const beginEdit = (id: string) => {
    const p = timeProfiles.find(tp => tp.id === id)
    if (!p) return
    setEditId(p.id)
    setName(p.name)
    const t: Record<number, { start: string; end: string }> = {}
    for (const pr of p.periods) t[pr.periodIndex] = { start: pr.start, end: pr.end }
    setTimes(t)
  }

  const beginNew = () => {
    setEditId(null)
    setName('New Time Profile')
    const t: Record<number, { start: string; end: string }> = {}
    for (const p of PERIODS) t[p] = { start: '08:00', end: '08:45' }
    setTimes(t)
  }

  const save = () => {
    const nm = name.trim()
    if (!nm) return
    const periods = PERIODS.map((p) => {
      const v = times[p] || { start: '08:00', end: '08:45' }
      return { periodIndex: p, start: v.start.trim(), end: v.end.trim() }
    })
    for (const pr of periods) {
      if (!isHHMM(pr.start) || !isHHMM(pr.end)) return
    }
    if (editId) updateTimeProfile({ id: editId, name: nm, periods })
    else {
      const id = genId()
      addTimeProfile({ id, name: nm, periods })
      // make it active for current cycle
      setCycleTimeProfile(id)
    }
  }

  return (
    <div className="p-4 max-w-4xl">
      <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
        <h2 className="text-xl font-bold">Time Profiles</h2>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-gray-600">Active for this cycle:</span>
          <select className="border rounded px-2 py-1 text-sm" value={activeTimeProfileId || ''} onChange={(e) => setCycleTimeProfile(e.target.value)}>
            {timeProfiles.map(tp => <option key={tp.id} value={tp.id}>{tp.name}</option>)}
          </select>
          <button className="bg-blue-500 text-white px-3 py-1 rounded text-sm" onClick={beginNew}>New</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="font-semibold mb-2">Profiles</h3>
          <div className="space-y-2">
            {timeProfiles.map(tp => (
              <div key={tp.id} className={`border rounded p-2 flex items-center justify-between gap-2 ${tp.id === activeTimeProfileId ? 'border-blue-400 bg-blue-50' : 'bg-white'}`}>
                <div className="min-w-0">
                  <div className="font-medium truncate">{tp.name}</div>
                  <div className="text-xs text-gray-500">{tp.periods.length} periods</div>
                </div>
                <div className="flex gap-2">
                  <button className="text-blue-600 text-sm" onClick={() => beginEdit(tp.id)}>Edit</button>
                  <button
                    className={`text-sm ${timeProfiles.length <= 1 ? 'text-gray-400 cursor-not-allowed' : 'text-red-600'}`}
                    disabled={timeProfiles.length <= 1}
                    onClick={() => {
                      if (timeProfiles.length <= 1) return
                      if (confirm(`Delete time profile '${tp.name}'?`)) deleteTimeProfile(tp.id)
                    }}
                  >
                    Del
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-2">Edit</h3>
          <div className="border rounded p-3 bg-gray-50">
            <div className="flex gap-2 items-end flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-xs text-gray-600 mb-1">Name</label>
                <input className="border rounded px-2 py-1 w-full" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <button className="bg-green-600 text-white px-3 py-1 rounded text-sm" onClick={save}>Save</button>
              <button
                className="text-gray-600 text-sm"
                onClick={() => { setEditId(null); setName(''); setTimes({}) }}
              >
                Clear
              </button>
            </div>

            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PERIODS.map((p) => {
                const v = times[p] || { start: '', end: '' }
                return (
                  <div key={p} className="flex items-center gap-2">
                    <div className="w-10 text-sm text-gray-600">P{p}</div>
                    <input
                      className="border rounded px-2 py-1 w-20 text-sm"
                      placeholder="HH:mm"
                      value={v.start}
                      onChange={(e) => setTimes(prev => ({ ...prev, [p]: { start: e.target.value, end: prev[p]?.end ?? '' } }))}
                    />
                    <span className="text-gray-500 text-sm">-</span>
                    <input
                      className="border rounded px-2 py-1 w-20 text-sm"
                      placeholder="HH:mm"
                      value={v.end}
                      onChange={(e) => setTimes(prev => ({ ...prev, [p]: { start: prev[p]?.start ?? '', end: e.target.value } }))}
                    />
                  </div>
                )
              })}
            </div>

            {editing && (
              <div className="mt-3 text-xs text-gray-500">
                Editing: {editing.name}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
