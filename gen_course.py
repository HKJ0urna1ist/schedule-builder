import os

base = "/Users/yxq/Downloads/opencode project1/schedule/src/components"

content = """import { useState } from 'react';
import { useStore, genId } from '../store';

export function CourseManager() {
  const store = useStore();
  const courses = store.courses;
  const teachers = store.teachers;
  const classes = store.classes;

  const [name, setName] = useState('');
  const [type, setType] = useState('必修');
  const [teacherId, setTeacherId] = useState('');
  const [classIds, setClassIds] = useState([]);
  const [lessonsPerWeek, setLessonsPerWeek] = useState(3);
  const [editId, setEditId] = useState(null);

  function handleAdd() {
    if (!name.trim() || !teacherId || classIds.length === 0) return;
    if (editId) {
      store.updateCourse({ id: editId, name: name.trim(), type: type, teacherId: teacherId, classIds: classIds, lessonsPerWeek: lessonsPerWeek });
      setEditId(null);
    } else {
      store.addCourse({ id: genId(), name: name.trim(), type: type, teacherId: teacherId, classIds: classIds, lessonsPerWeek: lessonsPerWeek });
    }
    setName('');
    setClassIds([]);
  }

  function toggleClass(id) {
    if (classIds.includes(id)) {
      setClassIds(classIds.filter(function(x) { return x !== id; }));
    } else {
      setClassIds([...classIds, id]);
    }
  }

  return React.createElement('div', { className: 'p-4 max-w-2xl' },
    React.createElement('h2', { className: 'text-xl font-bold mb-4' }, '课程管理'),
    React.createElement('div', { className: 'flex gap-2 mb-4 flex-wrap' },
      React.createElement('input', { className: 'border rounded px-2 py-1 flex-1 min-w-[100px]', placeholder: '课程名称', value: name, onChange: function(e) { setName(e.target.value); } }),
      React.createElement('select', { className: 'border rounded px-2 py-1', value: type, onChange: function(e) { setType(e.target.value); } },
        React.createElement('option', { value: '必修' }, '必修'),
        React.createElement('option', { value: '走班' }, '走班')
      ),
      React.createElement('select', { className: 'border rounded px-2 py-1', value: teacherId, onChange: function(e) { setTeacherId(e.target.value); } },
        React.createElement('option', { value: '' }, '选择教师'),
        teachers.map(function(t) { return React.createElement('option', { key: t.id, value: t.id }, t.name); })
      ),
      React.createElement('input', { className: 'border rounded px-2 py-1 w-20', type: 'number', min: 1, value: lessonsPerWeek, onChange: function(e) { setLessonsPerWeek(Number(e.target.value)); } }),
      React.createElement('button', { className: 'bg-blue-500 text-white px-4 py-1 rounded', onClick: handleAdd },
        editId ? '更新' : '添加'
      )
    ),
    React.createElement('div', { className: 'flex gap-2 mb-4 flex-wrap' },
      React.createElement('span', { className: 'text-sm text-gray-600' }, '关联班级：'),
      classes.map(function(c) {
        return React.createElement('label', { key: c.id, className: 'flex items-center gap-1 text-sm' },
          React.createElement('input', { type: 'checkbox', checked: classIds.includes(c.id), onChange: function() { toggleClass(c.id); } }),
          c.name
        );
      })
    ),
    React.createElement('table', { className: 'w-full border-collapse' },
      React.createElement('thead', null,
        React.createElement('tr', { className: 'bg-gray-100' },
          React.createElement('th', { className: 'border p-2 text-left' }, '名称'),
          React.createElement('th', { className: 'border p-2 text-left' }, '类型'),
          React.createElement('th', { className: 'border p-2 text-left' }, '教师'),
          React.createElement('th', { className: 'border p-2 text-left' }, '班级'),
          React.createElement('th', { className: 'border p-2 text-left' }, '周课时'),
          React.createElement('th', { className: 'border p-2 text-left' }, '操作')
        )
      ),
      React.createElement('tbody', null,
        courses.map(function(co) {
          var courseTeacher = teachers.find(function(t) { return t.id === co.teacherId; });
          var classNames = co.classIds.map(function(cid) {
            var found = classes.find(function(c) { return c.id === cid; });
            return found ? found.name : '';
          }).filter(Boolean).join(', ') || '-';
          var isZouban = co.type === '走班';

          return React.createElement('tr', { key: co.id },
            React.createElement('td', { className: 'border p-2' }, co.name),
            React.createElement('td', { className: 'border p-2' },
              React.createElement('span', {
                className: isZouban ? 'text-orange-500 font-semibold' : ''
              }, co.type)
            ),
            React.createElement('td', { className: 'border p-2' }, courseTeacher ? courseTeacher.name : '-'),
            React.createElement('td', { className: 'border p-2' }, classNames),
            React.createElement('td', { className: 'border p-2' }, co.lessonsPerWeek),
            React.createElement('td', { className: 'border p-2 space-x-1' },
              React.createElement('button', {
                className: 'text-blue-500 text-sm',
                onClick: function() {
                  setEditId(co.id);
                  setName(co.name);
                  setType(co.type);
                  setTeacherId(co.teacherId);
                  setClassIds([...co.classIds]);
                  setLessonsPerWeek(co.lessonsPerWeek);
                }
              }, '编辑'),
              React.createElement('button', {
                className: 'text-red-500 text-sm',
                onClick: function() {
                  if (confirm('确定删除？')) store.removeCourse(co.id);
                }
              }, '删除')
            )
          );
        })
      )
    )
  );
}
"""

path = os.path.join(base, "CourseManager.tsx")
with open(path, "w") as f:
    f.write(content)
print("Written: CourseManager.tsx")