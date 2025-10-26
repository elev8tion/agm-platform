/**
 * Create Campaign Modal
 * Form to create new campaign
 */

'use client';

import { useState } from 'react';
import { CampaignGoal } from '@/types';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { X } from 'lucide-react';

interface CreateCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateCampaignFormData) => void;
}

export interface CreateCampaignFormData {
  name: string;
  description: string;
  goal: CampaignGoal;
  budget_usd: number;
  start_date?: string;
  end_date?: string;
  target_keywords: string[];
}

export function CreateCampaignModal({
  isOpen,
  onClose,
  onSubmit
}: CreateCampaignModalProps) {
  const [formData, setFormData] = useState<CreateCampaignFormData>({
    name: '',
    description: '',
    goal: CampaignGoal.AWARENESS,
    budget_usd: 1000,
    target_keywords: []
  });
  const [keywordInput, setKeywordInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    onClose();
  };

  const addKeyword = () => {
    if (keywordInput.trim() && !formData.target_keywords.includes(keywordInput.trim())) {
      setFormData({
        ...formData,
        target_keywords: [...formData.target_keywords, keywordInput.trim()]
      });
      setKeywordInput('');
    }
  };

  const removeKeyword = (keyword: string) => {
    setFormData({
      ...formData,
      target_keywords: formData.target_keywords.filter((k) => k !== keyword)
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <form onSubmit={handleSubmit}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-xl font-bold text-slate-100">Create Campaign</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-800/60 transition-colors"
          >
            <X className="h-5 w-5 text-slate-400" />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-slate-200 mb-2">
              Campaign Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 bg-slate-900/50 border border-white/10 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand/40"
              placeholder="Enter campaign name"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-200 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 bg-slate-900/50 border border-white/10 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand/40 resize-none"
              placeholder="Campaign description"
            />
          </div>

          {/* Goal */}
          <div>
            <label className="block text-sm font-medium text-slate-200 mb-2">
              Campaign Goal *
            </label>
            <select
              required
              value={formData.goal}
              onChange={(e) => setFormData({ ...formData, goal: e.target.value as CampaignGoal })}
              className="w-full px-4 py-2 bg-slate-900/50 border border-white/10 rounded-lg text-slate-100 focus:outline-none focus:border-brand/40"
            >
              <option value={CampaignGoal.AWARENESS}>Brand Awareness</option>
              <option value={CampaignGoal.ENGAGEMENT}>Engagement</option>
              <option value={CampaignGoal.CONVERSION}>Conversion</option>
              <option value={CampaignGoal.RETENTION}>Retention</option>
            </select>
          </div>

          {/* Budget */}
          <div>
            <label className="block text-sm font-medium text-slate-200 mb-2">
              Budget (USD) *
            </label>
            <input
              type="number"
              required
              min="0"
              step="100"
              value={formData.budget_usd}
              onChange={(e) => setFormData({ ...formData, budget_usd: parseFloat(e.target.value) })}
              className="w-full px-4 py-2 bg-slate-900/50 border border-white/10 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand/40"
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={formData.start_date || ''}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="w-full px-4 py-2 bg-slate-900/50 border border-white/10 rounded-lg text-slate-100 focus:outline-none focus:border-brand/40"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={formData.end_date || ''}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                className="w-full px-4 py-2 bg-slate-900/50 border border-white/10 rounded-lg text-slate-100 focus:outline-none focus:border-brand/40"
              />
            </div>
          </div>

          {/* Keywords */}
          <div>
            <label className="block text-sm font-medium text-slate-200 mb-2">
              Target Keywords
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
                className="flex-1 px-4 py-2 bg-slate-900/50 border border-white/10 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand/40"
                placeholder="Add keyword and press Enter"
              />
              <Button type="button" onClick={addKeyword} variant="secondary">
                Add
              </Button>
            </div>
            {formData.target_keywords.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {formData.target_keywords.map((keyword) => (
                  <span
                    key={keyword}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand/10 text-brand border border-brand/20 text-sm"
                  >
                    {keyword}
                    <button
                      type="button"
                      onClick={() => removeKeyword(keyword)}
                      className="hover:text-brand/70"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-white/10">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary">
            Create Campaign
          </Button>
        </div>
      </form>
    </Modal>
  );
}
