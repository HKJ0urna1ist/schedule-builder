import { useStore } from './store'
import { ClassManager } from './components/ClassManager'
import { TeacherManager } from './components/TeacherManager'
import { RoomManager } from './components/RoomManager'
import { CourseManager } from './components/CourseManager'
import { ScheduleView } from './components/ScheduleView'

function App() {
  const currentPage = useStore(s => s.currentPage)
  const setCurrentPage = useStore(s => s.setCurrentPage)

  return (
    <div className="min-h-screen bg-white">
      <nav className="bg-gray-800 text-white px-4 py-2 flex items-center gap-4 sticky top-0 z-50">
        <span className="font-bold text-lg">排课系-'经</span>
        <div className="flex gap-1">
          <button
            className={`px-3 py-1 rounded text-sm ${currentPage === 'schedule' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
            onClick={() => setCurrentPage('schedule')}
          >
            课表
          </button>
          <button
            className={`px-3 py-1 rounded text-sm ${currentPage === 'manage' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
            onClick={() => setCurrentPage('manage')}
          >
            管理
          </button>
        </div>
      </nav>
      <main className="max-w-6xl mx-auto">
        {currentPage === 'schedule' && <ScheduleView />}
        {currentPage === 'manage' && (
          <div className="space-y-8 py-4">
            <ClassManager />
            <hr className="border-gray-200" />
            <TeacherManager />
            <hr className="border-gray-200" />
            <RoomManager />
            <hr className="border-gray-200" />
            <CourseManager />
          </div>
        )}
      </main>
    </div>
  )
}

export default App
