import { useStore } from './store'
import { ClassManager } from './components/ClassManager'
import { TeacherManager } from './components/TeacherManager'
import { RoomManager } from './components/RoomManager'
import { CourseManager } from './components/CourseManager'
import { ScheduleView } from './components/ScheduleView'

function App() {
  const currentPage = useStore(s => s.currentPage)
  const setCurrentPage = useStore(s => s.setCurrentPage)

  const cycles = useStore(s => s.cycles)
  const activeCycleId = useStore(s => s.activeCycleId)
  const setActiveCycle = useStore(s => s.setActiveCycle)
  const addCycle = useStore(s => s.addCycle)
  const cloneCycle = useStore(s => s.cloneCycle)
  const renameCycle = useStore(s => s.renameCycle)
  const deleteCycle = useStore(s => s.deleteCycle)

  const activeCycle = cycles.find(c => c.id === activeCycleId) || cycles[0]
  return (
    <div className="min-h-screen bg-white">
      <nav className="bg-gray-800 text-white px-4 py-2 flex items-center gap-4 sticky top-0 z-50">
        <span className="font-bold text-lg">Schedule Builder</span>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-gray-300">Cycle:</span>
          <select
            className="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm"
            value={activeCycle?.id || ''}
            onChange={(e) => setActiveCycle(e.target.value)}
          >
            {cycles.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <button
            className="px-2 py-1 rounded text-xs bg-gray-700 hover:bg-gray-600"
            onClick={() => {
              const nm = prompt('New cycle name?', `Cycle ${cycles.length + 1}`)
              if (nm) addCycle(nm)
            }}
            title="Create a new cycle"
          >
            New
          </button>
          <button
            className="px-2 py-1 rounded text-xs bg-gray-700 hover:bg-gray-600"
            onClick={() => {
              if (!activeCycle) return
              const nm = prompt('Copy cycle name?', `${activeCycle.name} Copy`)
              if (nm) cloneCycle(activeCycle.id, nm)
            }}
            title="Duplicate current cycle"
          >
            Duplicate
          </button>
          <button
            className="px-2 py-1 rounded text-xs bg-gray-700 hover:bg-gray-600"
            onClick={() => {
              if (!activeCycle) return
              const nm = prompt('Rename cycle:', activeCycle.name)
              if (nm) renameCycle(activeCycle.id, nm)
            }}
            title="Rename current cycle"
          >
            Rename
          </button>
          <button
            className={`px-2 py-1 rounded text-xs ${cycles.length <= 1 ? 'bg-gray-900 text-gray-500 cursor-not-allowed' : 'bg-red-700 hover:bg-red-600'}`}
            disabled={cycles.length <= 1}
            onClick={() => {
              if (!activeCycle) return
              if (cycles.length <= 1) return
              if (confirm(`Delete cycle '${activeCycle.name}'?`)) deleteCycle(activeCycle.id)
            }}
            title={cycles.length <= 1 ? 'You must keep at least one cycle' : 'Delete current cycle'}
          >
            Delete
          </button>
        </div>
        <div className="flex gap-1">
          <button className={`px-3 py-1 rounded text-sm ${currentPage === 'schedule' ? 'bg-blue-600' : 'hover:bg-gray-700'}`} onClick={() => setCurrentPage('schedule')}>Schedule</button>
          <button className={`px-3 py-1 rounded text-sm ${currentPage === 'manage' ? 'bg-blue-600' : 'hover:bg-gray-700'}`} onClick={() => setCurrentPage('manage')}>Manage</button>
        </div>
      </nav>
      <main className="max-w-6xl mx-auto">
        {currentPage === 'schedule' && <ScheduleView />}
        {currentPage === 'manage' && (
          <div className="space-y-8 py-4">
            <ClassManager /><hr className="border-gray-200" />
            <TeacherManager /><hr className="border-gray-200" />
            <RoomManager /><hr className="border-gray-200" />
            <CourseManager />
          </div>
        )}
      </main>
    </div>
  )
}
export default App
