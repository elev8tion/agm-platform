/**
 * Content Asset Detail Modal
 * Full content preview with metadata
 */

'use client';

import { ContentAsset } from '@/types';
import { Modal } from '@/components/ui/Modal';
import { ContentStatusBadge } from './ContentStatusBadge';
import { SEOScoreDisplay } from './SEOScoreDisplay';
import { X, Calendar, Tag } from 'lucide-react';

interface ContentAssetDetailProps {
  asset: ContentAsset | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ContentAssetDetail({ asset, isOpen, onClose }: ContentAssetDetailProps) {
  if (!asset) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <div className="relative">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-white/10">
          <div className="flex-1 pr-6">
            <h2 className="text-2xl font-bold text-slate-100 mb-2">{asset.title}</h2>
            <div className="flex items-center gap-3">
              <ContentStatusBadge status={asset.status} />
              {asset.seo_metadata.seo_score && (
                <SEOScoreDisplay score={asset.seo_metadata.seo_score} />
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-800/60 transition-colors"
          >
            <X className="h-5 w-5 text-slate-400" />
          </button>
        </div>

        {/* Metadata */}
        <div className="p-6 border-b border-white/10 bg-slate-900/30">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-slate-400" />
              <span className="text-slate-300">
                Updated: {new Date(asset.updated_at).toLocaleDateString()}
              </span>
            </div>
            {asset.published_at && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-slate-400" />
                <span className="text-slate-300">
                  Published: {new Date(asset.published_at).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>

          {/* SEO Metadata */}
          <div className="mt-4 space-y-3">
            <div>
              <label className="text-xs text-slate-400 uppercase tracking-wide">Title Tag</label>
              <p className="text-sm text-slate-200 mt-1">{asset.seo_metadata.title_tag}</p>
            </div>
            <div>
              <label className="text-xs text-slate-400 uppercase tracking-wide">Meta Description</label>
              <p className="text-sm text-slate-200 mt-1">{asset.seo_metadata.meta_description}</p>
            </div>
            <div>
              <label className="text-xs text-slate-400 uppercase tracking-wide mb-2 block">
                Target Keywords
              </label>
              <div className="flex flex-wrap gap-2">
                {asset.seo_metadata.target_keywords.map((keyword, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand/10 text-brand border border-brand/20 text-sm"
                  >
                    <Tag className="h-3 w-3" />
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[500px] overflow-y-auto">
          <label className="text-xs text-slate-400 uppercase tracking-wide mb-3 block">
            Content
          </label>
          <div className="prose prose-invert prose-slate max-w-none">
            <div className="text-slate-200 whitespace-pre-wrap leading-relaxed">
              {asset.content}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
