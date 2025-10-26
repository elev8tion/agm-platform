/**
 * Content Asset List
 * Grid/list view of content assets with filtering
 */

'use client';

import { useState } from 'react';
import { ContentAsset, ContentType, ContentStatus } from '@/types';
import { ContentAssetCard } from './ContentAssetCard';
import { Grid, List as ListIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ContentAssetListProps {
  assets: ContentAsset[];
  onAssetClick?: (id: string) => void;
  onAssetEdit?: (id: string) => void;
  onAssetDelete?: (id: string) => void;
  filterType?: ContentType;
  filterStatus?: ContentStatus;
  className?: string;
}

export function ContentAssetList({
  assets,
  onAssetClick,
  onAssetEdit,
  onAssetDelete,
  filterType,
  filterStatus,
  className
}: ContentAssetListProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Filter assets
  const filteredAssets = assets.filter((asset) => {
    if (filterType && asset.content_type !== filterType) return false;
    if (filterStatus && asset.status !== filterStatus) return false;
    return true;
  });

  return (
    <div className={className}>
      {/* View Toggle */}
      <div className="flex justify-end mb-4">
        <div className="inline-flex rounded-lg border border-white/10 bg-slate-900/50 p-1">
          <button
            onClick={() => setViewMode('grid')}
            className={cn(
              'px-3 py-1.5 rounded-md text-sm transition-colors',
              viewMode === 'grid'
                ? 'bg-brand/20 text-brand border border-brand/30'
                : 'text-slate-400 hover:text-slate-300'
            )}
          >
            <Grid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={cn(
              'px-3 py-1.5 rounded-md text-sm transition-colors',
              viewMode === 'list'
                ? 'bg-brand/20 text-brand border border-brand/30'
                : 'text-slate-400 hover:text-slate-300'
            )}
          >
            <ListIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Asset Grid/List */}
      {filteredAssets.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-slate-400">No content assets found</p>
        </div>
      ) : (
        <div
          className={cn(
            viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
              : 'space-y-3'
          )}
        >
          {filteredAssets.map((asset) => (
            <ContentAssetCard
              key={asset.id}
              asset={asset}
              onClick={onAssetClick}
              onEdit={onAssetEdit}
              onDelete={onAssetDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
