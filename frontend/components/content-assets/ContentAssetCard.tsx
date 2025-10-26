/**
 * Content Asset Card
 * Displays content item with metadata and actions
 */

'use client';

import { ContentAsset, ContentType } from '@/types';
import { Card } from '@/components/ui/Card';
import { ContentStatusBadge } from './ContentStatusBadge';
import { SEOScoreDisplay } from './SEOScoreDisplay';
import {
  FileText,
  Mail,
  Globe,
  Share2,
  Video,
  PenTool,
  MoreVertical,
  Eye,
  Edit2,
  Trash2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ContentAssetCardProps {
  asset: ContentAsset;
  onClick?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  className?: string;
}

const contentTypeConfig: Record<ContentType, { icon: typeof FileText; label: string; color: string }> = {
  [ContentType.BLOG_POST]: { icon: FileText, label: 'Blog Post', color: 'text-blue-400' },
  [ContentType.EMAIL]: { icon: Mail, label: 'Email', color: 'text-purple-400' },
  [ContentType.LANDING_PAGE]: { icon: Globe, label: 'Landing Page', color: 'text-green-400' },
  [ContentType.SOCIAL_POST]: { icon: Share2, label: 'Social Post', color: 'text-pink-400' },
  [ContentType.VIDEO_SCRIPT]: { icon: Video, label: 'Video Script', color: 'text-red-400' },
  [ContentType.AD_COPY]: { icon: PenTool, label: 'Ad Copy', color: 'text-amber-400' }
};

export function ContentAssetCard({
  asset,
  onClick,
  onEdit,
  onDelete,
  className
}: ContentAssetCardProps) {
  const typeConfig = contentTypeConfig[asset.content_type];
  const Icon = typeConfig.icon;

  return (
    <Card
      className={cn(
        'hover:border-brand/40 transition-colors cursor-pointer',
        className
      )}
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-brand/10 border border-brand/20">
              <Icon className={cn('h-5 w-5', typeConfig.color)} />
            </div>
            <div>
              <h3 className="font-semibold text-slate-100 mb-1">{asset.title}</h3>
              <p className="text-xs text-slate-400">{typeConfig.label}</p>
            </div>
          </div>

          <button
            className="p-1.5 rounded-lg hover:bg-slate-800/60 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              // TODO: Show dropdown menu
            }}
          >
            <MoreVertical className="h-4 w-4 text-slate-400" />
          </button>
        </div>

        {/* Metadata */}
        <div className="space-y-3 mb-4">
          <div className="flex items-center justify-between">
            <ContentStatusBadge status={asset.status} />
            {asset.seo_metadata.seo_score && (
              <SEOScoreDisplay score={asset.seo_metadata.seo_score} size="sm" showLabel={false} />
            )}
          </div>

          {asset.seo_metadata.target_keywords.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {asset.seo_metadata.target_keywords.slice(0, 3).map((keyword, index) => (
                <span
                  key={index}
                  className="text-xs px-2 py-0.5 rounded bg-slate-800/60 text-slate-300 border border-white/5"
                >
                  {keyword}
                </span>
              ))}
              {asset.seo_metadata.target_keywords.length > 3 && (
                <span className="text-xs px-2 py-0.5 text-slate-400">
                  +{asset.seo_metadata.target_keywords.length - 3} more
                </span>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-white/10">
          <div className="text-xs text-slate-400">
            {new Date(asset.updated_at).toLocaleDateString()}
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClick?.(asset.id);
              }}
              className="p-1.5 rounded hover:bg-slate-800/60 transition-colors"
              title="View"
            >
              <Eye className="h-4 w-4 text-slate-400" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit?.(asset.id);
              }}
              className="p-1.5 rounded hover:bg-slate-800/60 transition-colors"
              title="Edit"
            >
              <Edit2 className="h-4 w-4 text-slate-400" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.(asset.id);
              }}
              className="p-1.5 rounded hover:bg-slate-800/60 transition-colors"
              title="Delete"
            >
              <Trash2 className="h-4 w-4 text-red-400" />
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
}
