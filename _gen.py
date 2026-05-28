import os

lines = []
def L(s): lines.append(s)

L("import { useState, useMemo, useCallback } from 'react'")
L("import { useStore, genId } from '../store'")
L("import { generateSchedule, findConflicts } from '../algorithm/scheduler'")
L("import { DAYS, PERIODS } from '../types'")
L("import type { ScheduleEntry } from '../types'")
L("")
L("function CellModal({ classId, day, period, onCancel }: { classId: string; day: number; period: number; onCancel: () => void }) {")
L("  const { courses, teachers, rooms, addManualEntry } = useStore()")
L("  const [cId, setCId] = useState('')")
L("  const [tId, setTId] = useState('')")
L("  const [rId, setRId] = useState('')")
L("  const [gl, setGl] = useState('')")
L("  const save = () => {")
L("    if (!cId || !tId || !rId) return")
L("    addManualEntry({ id: genId(), classId, courseId: cId, teacherId: tId, roomId: rId, groupLabel: gl.trim() || '-', dayOfWeek: day, periodIndex: period, locked: true })")
L("    onCancel()")
L("  }")
L("  const cc = courses.filter(c => c.classId === classId)")
L("  return (")
L('    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={e => { if (e.target === e.currentTarget) onCancel() }}>')
L('      <div className="bg-white rounded shadow-lg p-4 w-80" onClick={e => e.stopPropagation()}>')
L('        <h3 className="font-bold mb-2">Add Course</h3>')

