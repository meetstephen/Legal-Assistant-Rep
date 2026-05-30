// ============================================================
// lexi/pages/Tasks.jsx — Task Manager
// ============================================================

import React, { useState, useMemo } from 'react';
import { ListChecks, Plus, Trash2, AlertCircle, CheckCircle2, Clock, Circle } from 'lucide-react';
import { useApp } from '../AppContext.jsx';
import { Card, Button, Input, Textarea, Select, Badge, Modal, EmptyState, PageHeader } from '../components/ui.jsx';
import { STATUS_BADGE, PRIORITY_BADGE } from '../themes.js';
import { formatDate, formatRelativeDate, daysUntil, cn } from '../utils.js';

const STATUSES = ['todo', 'in-progress', 'done'];
const PRIORITIES = ['high', 'medium', 'low'];

export function Tasks() {
  const { tasks, addTask, updateTask, deleteTask, cases, showToast } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm());

  function emptyForm() {
    return { title: '', due: '', priority: 'medium', status: 'todo', caseId: '', assignee: '', notes: '' };
  }

  const withOverdue = useMemo(
    () => tasks.map((t) => ({ ...t, overdue: t.status !== 'done' && t.due && daysUntil(t.due) < 0 })),
    [tasks]
  );
  const counts = useMemo(() => ({
    todo: tasks.filter((t) => t.status === 'todo').length,
    inProgress: tasks.filter((t) => t.status === 'in-progress').length,
    done: tasks.filter((t) => t.status === 'done').length,
    overdue: withOverdue.filter((t) => t.overdue).length,
  }), [tasks, withOverdue]);

  const submit = () => {
    if (!form.title.trim()) { showToast('warning', 'Task title is required.'); return; }
    addTask(form);
    showToast('success', 'Task added.');
    setShowModal(false);
    setForm(emptyForm());
  };

  const sorted = [...withOverdue].sort((a, b) => {
    if (a.status === 'done' && b.status !== 'done') return 1;
    if (b.status === 'done' && a.status !== 'done') return -1;
    return new Date(a.due || '2999') - new Date(b.due || '2999');
  });

  return (
    <div className="space-y-6">
      <PageHeader icon={ListChecks} title="Task Manager" subtitle="Deadlines, priorities, and matter-linked tasks" gradient="from-blue-400 to-cyan-500">
        <Button onClick={() => setShowModal(true)} leftIcon={<Plus className="w-4 h-4" />}>Add task</Button>
      </PageHeader>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'To do', value: counts.todo, icon: Circle, tone: 'text-slate-500' },
          { label: 'In progress', value: counts.inProgress, icon: Clock, tone: 'text-blue-500' },
          { label: 'Done', value: counts.done, icon: CheckCircle2, tone: 'text-emerald-500' },
          { label: 'Overdue', value: counts.overdue, icon: AlertCircle, tone: 'text-red-500' },
        ].map((s) => (
          <Card key={s.label} variant="flat" className="py-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">{s.label}</span>
              <s.icon className={cn('w-4 h-4', s.tone)} />
            </div>
            <div className={cn('text-2xl font-bold mt-1', s.tone)}>{s.value}</div>
          </Card>
        ))}
      </div>

      {sorted.length === 0 ? (
        <EmptyState icon={ListChecks} title="No tasks yet" description="Stay on top of deadlines and to-dos." action={{ label: 'Add task', onClick: () => setShowModal(true), icon: <Plus className="w-4 h-4" /> }} />
      ) : (
        <div className="space-y-2">
          {sorted.map((t) => (
            <Card key={t.id} variant="glass" className="py-3">
              <div className="flex items-center gap-3">
                <button onClick={() => updateTask(t.id, { status: t.status === 'done' ? 'todo' : 'done' })}>
                  {t.status === 'done' ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <Circle className="w-5 h-5 text-slate-300" />}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={cn('font-medium', t.status === 'done' ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-100')}>{t.title}</span>
                    <Badge className={PRIORITY_BADGE[t.priority]}>{t.priority}</Badge>
                    {t.overdue && <Badge variant="danger">overdue</Badge>}
                    {t.caseId && <Badge variant="info">{cases.find((c) => c.id === t.caseId)?.title || 'case'}</Badge>}
                  </div>
                  {(t.due || t.assignee) && (
                    <p className="text-xs text-slate-400 mt-0.5">
                      {t.due && <>Due {formatDate(t.due)} ({formatRelativeDate(t.due)})</>}{t.assignee && ` · ${t.assignee}`}
                    </p>
                  )}
                </div>
                <select value={t.status} onChange={(e) => updateTask(t.id, { status: e.target.value })}
                  className={cn('px-2.5 py-1 rounded-lg text-xs border-0 cursor-pointer', STATUS_BADGE[t.status])}>
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <button onClick={() => deleteTask(t.id)} className="text-red-500 p-1"><Trash2 className="w-4 h-4" /></button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add task" size="lg">
        <div className="space-y-4">
          <Input label="Task *" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="File defence" />
          <div className="grid sm:grid-cols-2 gap-4">
            <Input label="Due date" type="date" value={form.due} onChange={(e) => setForm({ ...form, due: e.target.value })} />
            <Select label="Priority" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} options={PRIORITIES.map((p) => ({ value: p, label: p }))} />
            <Select label="Linked case" value={form.caseId} onChange={(e) => setForm({ ...form, caseId: e.target.value })}
              options={[{ value: '', label: 'None' }, ...cases.map((c) => ({ value: c.id, label: c.title }))]} />
            <Input label="Assignee" value={form.assignee} onChange={(e) => setForm({ ...form, assignee: e.target.value })} placeholder="Counsel name" />
          </div>
          <Textarea label="Notes" rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={submit}>Save task</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
