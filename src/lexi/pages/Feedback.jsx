// ============================================================
// lexi/pages/Feedback.jsx — User Feedback submission page
// ============================================================

import React, { useState, useMemo } from 'react';
import { MessageSquarePlus, Star, Send, Trash2 } from 'lucide-react';
import { useApp } from '../AppContext.jsx';
import { storage, STORAGE_KEYS } from '../database.js';
import { generateId, formatDateTime, cn } from '../utils.js';
import { Card, Button, Input, Select, Textarea, PageHeader, Badge, EmptyState } from '../components/ui.jsx';

const CATEGORIES = [
  { value: 'ai-quality', label: 'AI Quality' },
  { value: 'usability', label: 'Usability' },
  { value: 'features', label: 'Features' },
  { value: 'bug-report', label: 'Bug Report' },
  { value: 'other', label: 'Other' },
];

const CATEGORY_VARIANTS = {
  'ai-quality': 'info',
  'usability': 'success',
  'features': 'violet',
  'bug-report': 'danger',
  'other': 'default',
};

function StarRating({ value, onChange, readonly = false }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => !readonly && onChange(star)}
          onMouseEnter={() => !readonly && setHover(star)}
          onMouseLeave={() => !readonly && setHover(0)}
          className={cn(
            'transition-colors duration-150',
            readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'
          )}
        >
          <Star
            className={cn(
              'w-6 h-6 transition-colors',
              (hover || value) >= star
                ? 'text-amber-400 fill-amber-400'
                : 'text-slate-300 dark:text-slate-600'
            )}
          />
        </button>
      ))}
    </div>
  );
}

export function Feedback() {
  const { showToast, audit, profile } = useApp();
  const [feedbackList, setFeedbackList] = useState(() => storage.get(STORAGE_KEYS.FEEDBACK, []));
  const [form, setForm] = useState({ rating: 0, category: 'ai-quality', message: '', name: '' });

  const myFeedback = useMemo(() => {
    return [...feedbackList].reverse();
  }, [feedbackList]);

  const submit = () => {
    if (form.rating === 0) {
      showToast('warning', 'Please select a star rating.');
      return;
    }
    if (!form.message.trim()) {
      showToast('warning', 'Please enter a message.');
      return;
    }
    const entry = {
      id: generateId(),
      rating: form.rating,
      category: form.category,
      message: form.message.trim(),
      name: form.name.trim() || profile.lawyerName || 'Anonymous',
      createdAt: new Date().toISOString(),
    };
    const updated = [...feedbackList, entry];
    setFeedbackList(updated);
    storage.set(STORAGE_KEYS.FEEDBACK, updated);
    audit('FEEDBACK_SUBMIT', entry.category);
    showToast('success', 'Thank you for your feedback!');
    setForm({ rating: 0, category: 'ai-quality', message: '', name: '' });
  };

  const removeFeedback = (id) => {
    const updated = feedbackList.filter((f) => f.id !== id);
    setFeedbackList(updated);
    storage.set(STORAGE_KEYS.FEEDBACK, updated);
    showToast('success', 'Feedback removed.');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={MessageSquarePlus}
        title="Feedback"
        subtitle="Help us improve LexiAssist — share your experience"
        gradient="from-violet-500 to-purple-600"
      />

      <Card variant="glass" className="space-y-4">
        <h3 className="font-semibold text-slate-900 dark:text-white">Submit Feedback</h3>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Rating
          </label>
          <StarRating value={form.rating} onChange={(v) => setForm({ ...form, rating: v })} />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <Select
            label="Category"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            options={CATEGORIES}
          />
          <Input
            label="Your name (optional)"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder={profile.lawyerName || 'Anonymous'}
          />
        </div>

        <Textarea
          label="Message"
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          placeholder="Tell us what you think — what works well, what could be better, or report a bug..."
          rows={4}
        />

        <Button onClick={submit} leftIcon={<Send className="w-4 h-4" />}>
          Submit Feedback
        </Button>
      </Card>

      {myFeedback.length > 0 ? (
        <Card variant="glass" className="space-y-4">
          <h3 className="font-semibold text-slate-900 dark:text-white">
            Your Previous Feedback ({myFeedback.length})
          </h3>
          <div className="space-y-3">
            {myFeedback.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <StarRating value={item.rating} readonly />
                      <Badge variant={CATEGORY_VARIANTS[item.category] || 'default'}>
                        {CATEGORIES.find((c) => c.value === item.category)?.label || item.category}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-700 dark:text-slate-300 mt-2">{item.message}</p>
                    <p className="text-xs text-slate-400 mt-2">
                      {item.name} &middot; {formatDateTime(item.createdAt)}
                    </p>
                  </div>
                  <button
                    onClick={() => removeFeedback(item.id)}
                    className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 transition-colors"
                    title="Remove"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      ) : (
        <EmptyState
          icon={MessageSquarePlus}
          title="No feedback yet"
          description="Your submitted feedback will appear here."
        />
      )}
    </div>
  );
}
