// ============================================================
// lexi/pages/Templates.jsx — document templates + placeholder detection
// ============================================================

import React, { useState } from 'react';
import { Files, Plus, Eye, Copy, Trash2, Wand2, Tag } from 'lucide-react';
import { useApp } from '../AppContext.jsx';
import { Card, Button, Input, Textarea, Select, Badge, Modal, PageHeader } from '../components/ui.jsx';
import { copyToClipboard } from '../exports.js';

function placeholders(content = '') {
  const set = new Set();
  const re = /\[([A-Z][A-Z0-9 _/&-]{1,40})\]/g;
  let m;
  while ((m = re.exec(content)) !== null) set.add(m[1].trim());
  return [...set];
}

export function Templates() {
  const { templates, addTemplate, deleteTemplate, navigate, showToast } = useApp();
  const [preview, setPreview] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', category: 'Litigation', content: '' });

  const categories = ['Litigation', 'Corporate', 'Property', 'Family', 'Other'];

  const loadIntoAi = (t) => {
    navigate('ai', { prefill: `Adapt and complete this template for my matter, replacing every [PLACEHOLDER]:\n\n${t.content}` });
    showToast('info', 'Loaded into AI Assistant — describe your matter and generate.');
  };

  const save = () => {
    if (!form.name.trim() || !form.content.trim()) { showToast('warning', 'Name and content are required.'); return; }
    addTemplate(form);
    showToast('success', 'Template added.');
    setShowAdd(false);
    setForm({ name: '', category: 'Litigation', content: '' });
  };

  return (
    <div className="space-y-6">
      <PageHeader icon={Files} title="Document Templates" subtitle="Nigerian legal templates with [PLACEHOLDER] detection" gradient="from-orange-400 to-red-500">
        <Button onClick={() => setShowAdd(true)} leftIcon={<Plus className="w-4 h-4" />}>Add template</Button>
      </PageHeader>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((t) => {
          const ph = placeholders(t.content);
          return (
            <Card key={t.id} variant="glass" className="flex flex-col">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">{t.name}</h3>
                  <Badge variant="success" className="mt-1">{t.category}</Badge>
                </div>
                <Files className="w-5 h-5 text-slate-400" />
              </div>
              <p className="text-sm text-slate-500 line-clamp-3 mb-2 whitespace-pre-wrap flex-1">{t.content.slice(0, 110)}…</p>
              {ph.length > 0 && (
                <p className="text-xs text-slate-400 mb-3 flex items-center gap-1"><Tag className="w-3 h-3" /> {ph.length} placeholder(s)</p>
              )}
              <div className="flex gap-2">
                <Button size="sm" variant="primary" className="flex-1" onClick={() => loadIntoAi(t)} leftIcon={<Wand2 className="w-4 h-4" />}>Use in AI</Button>
                <Button size="sm" variant="secondary" onClick={() => setPreview(t)}><Eye className="w-4 h-4" /></Button>
                {!t.id.startsWith('t-') && (
                  <Button size="sm" variant="ghost" onClick={() => deleteTemplate(t.id)} className="text-red-500"><Trash2 className="w-4 h-4" /></Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      <Modal isOpen={!!preview} onClose={() => setPreview(null)} title={preview?.name} size="lg">
        {preview && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="success">{preview.category}</Badge>
              {placeholders(preview.content).map((p) => <Badge key={p} variant="warning">[{p}]</Badge>)}
            </div>
            <pre className="whitespace-pre-wrap text-sm bg-slate-50 dark:bg-slate-800 p-4 rounded-xl font-mono max-h-96 overflow-y-auto thin-scrollbar">{preview.content}</pre>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => copyToClipboard(preview.content).then(() => showToast('success', 'Copied.'))} leftIcon={<Copy className="w-4 h-4" />}>Copy</Button>
              <Button onClick={() => { loadIntoAi(preview); setPreview(null); }} leftIcon={<Wand2 className="w-4 h-4" />}>Use in AI</Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Add template" size="lg">
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <Input label="Template name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Select label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} options={categories.map((c) => ({ value: c, label: c }))} />
          </div>
          <Textarea label="Content (use [PLACEHOLDER] markers)" rows={10} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={save}>Save template</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
