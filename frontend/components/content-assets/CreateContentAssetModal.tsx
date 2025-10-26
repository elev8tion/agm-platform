/**
 * Create Content Asset Modal
 * Form to create new content manually
 */

'use client';

import { useState } from 'react';
import { ContentType } from '@/types';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { X } from 'lucide-react';

interface CreateContentAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateContentFormData) => void;
}

export interface CreateContentFormData {
  title: string;
  content_type: ContentType;
  content: string;
  title_tag: string;
  meta_description: string;
  target_keywords: string[];
}

export function CreateContentAssetModal({
  isOpen,
  onClose,
  onSubmit
}: CreateContentAssetModalProps) {
  const [formData, setFormData] = useState<CreateContentFormData>({
    title: '',
    content_type: ContentType.BLOG_POST,
    content: '',
    title_tag: '',
    meta_description: '',
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
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <form onSubmit={handleSubmit}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-xl font-bold text-slate-100">Create Content Asset</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-800/60 transition-colors"
          >
            <X className="h-5 w-5 text-slate-400" />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-4 max-h-[600px] overflow-y-auto">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-slate-200 mb-2">
              Title *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 bg-slate-900/50 border border-white/10 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand/40"
              placeholder="Enter content title"
            />
          </div>

          {/* Content Type */}
          <div>
            <label className="block text-sm font-medium text-slate-200 mb-2">
              Content Type *
            </label>
            <select
              required
              value={formData.content_type}
              onChange={(e) => setFormData({ ...formData, content_type: e.target.value as ContentType })}
              className="w-full px-4 py-2 bg-slate-900/50 border border-white/10 rounded-lg text-slate-100 focus:outline-none focus:border-brand/40"
            >
              <option value={ContentType.BLOG_POST}>Blog Post</option>
              <option value={ContentType.EMAIL}>Email</option>
              <option value={ContentType.LANDING_PAGE}>Landing Page</option>
              <option value={ContentType.SOCIAL_POST}>Social Post</option>
              <option value={ContentType.VIDEO_SCRIPT}>Video Script</option>
              <option value={ContentType.AD_COPY}>Ad Copy</option>
            </select>
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-slate-200 mb-2">
              Content *
            </label>
            <textarea
              required
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={8}
              className="w-full px-4 py-2 bg-slate-900/50 border border-white/10 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand/40 resize-none"
              placeholder="Enter your content here..."
            />
          </div>

          {/* SEO Metadata */}
          <div className="pt-4 border-t border-white/10">
            <h3 className="text-sm font-semibold text-slate-200 mb-4">SEO Metadata</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  Title Tag *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title_tag}
                  onChange={(e) => setFormData({ ...formData, title_tag: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-900/50 border border-white/10 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand/40"
                  placeholder="SEO title tag"
                  maxLength={60}
                />
                <p className="text-xs text-slate-400 mt-1">{formData.title_tag.length}/60</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  Meta Description *
                </label>
                <textarea
                  required
                  value={formData.meta_description}
                  onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 bg-slate-900/50 border border-white/10 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand/40 resize-none"
                  placeholder="SEO meta description"
                  maxLength={160}
                />
                <p className="text-xs text-slate-400 mt-1">{formData.meta_description.length}/160</p>
              </div>

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
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-white/10">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary">
            Create Content
          </Button>
        </div>
      </form>
    </Modal>
  );
}
