/**
 * UI Component Prop Types
 * Phase 3.1: TypeScript Types
 */

import { ReactNode } from 'react';

// Button Types
export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'success';
export type ButtonSize = 'sm' | 'md' | 'lg';

// Card Types
export type CardStatus = 'default' | 'success' | 'warning' | 'error';

// Modal Types
export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

// Badge Types
export type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger';

// Skeleton Types
export type SkeletonVariant = 'text' | 'circular' | 'rectangular';

// Toast Types
export type ToastType = 'success' | 'error' | 'info' | 'warning';

// Dropdown Types
export interface DropdownMenuItem {
  label: string;
  onClick: () => void;
  icon?: ReactNode;
  disabled?: boolean;
  variant?: 'default' | 'danger';
}
