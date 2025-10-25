# Notifications - Toast and Browser Alerts System

## Overview

The Notifications system provides real-time feedback to users through toast notifications, browser alerts, and a notification center. It integrates with WebSocket events to deliver instant updates about job completions, budget warnings, errors, and system events.

**Key Features:**
- Toast notifications with auto-dismiss
- Browser notifications with permission handling
- Notification center/inbox for history
- Customizable notification preferences
- Sound alerts (optional)
- Action buttons (undo, retry, view)
- Priority levels (info, success, warning, error)
- Queuing and rate limiting
- Accessibility with screen reader support

## Prerequisites

**Required Phases:**
- Phase 5.1: WebSocket client ([23_WEBSOCKET_CLIENT.md](./23_WEBSOCKET_CLIENT.md))
- Phase 2: UI components library

**Dependencies:**
```json
{
  "sonner": "^1.3.1",
  "zustand": "^4.4.7",
  "@radix-ui/react-dropdown-menu": "^2.0.6"
}
```

## Architecture

### Notification Flow

```
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│  WebSocket   │────────▶│ Notification │────────▶│    Toast     │
│    Event     │         │   Manager    │         │   Display    │
└──────────────┘         └──────────────┘         └──────────────┘
                                │
                                ├────────────────▶┌──────────────┐
                                │                 │   Browser    │
                                │                 │Notification  │
                                │                 └──────────────┘
                                │
                                └────────────────▶┌──────────────┐
                                                  │Notification  │
                                                  │   Center     │
                                                  └──────────────┘
```

### Component Hierarchy

```
App
├── ToastProvider (Sonner)
├── NotificationManager (hooks into WebSocket)
├── NotificationCenter
│   ├── NotificationList
│   │   ├── NotificationItem
│   │   ├── NotificationItem
│   │   └── ...
│   └── NotificationPreferences
└── BrowserNotificationHandler
```

## Complete Implementation

### Notification Types

```typescript
// lib/notifications/types.ts

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export type NotificationPriority = 'low' | 'medium' | 'high';

export interface NotificationAction {
  label: string;
  onClick: () => void;
  variant?: 'default' | 'destructive';
}

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: number;
  priority: NotificationPriority;
  read: boolean;
  actions?: NotificationAction[];
  metadata?: Record<string, any>;
  duration?: number; // Auto-dismiss duration in ms
  sound?: boolean;
  persistent?: boolean; // Don't auto-dismiss
}

export interface NotificationPreferences {
  enabled: boolean;
  browser: boolean;
  sound: boolean;
  events: {
    jobCompleted: boolean;
    jobFailed: boolean;
    budgetWarning: boolean;
    campaignAlert: boolean;
    systemUpdate: boolean;
  };
}

export interface NotificationStore {
  notifications: Notification[];
  preferences: NotificationPreferences;
  unreadCount: number;

  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  updatePreferences: (preferences: Partial<NotificationPreferences>) => void;
}
```

### Notification Store (Zustand)

```typescript
// lib/notifications/store.ts

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Notification, NotificationPreferences, NotificationStore } from './types';

const defaultPreferences: NotificationPreferences = {
  enabled: true,
  browser: false,
  sound: true,
  events: {
    jobCompleted: true,
    jobFailed: true,
    budgetWarning: true,
    campaignAlert: true,
    systemUpdate: true,
  },
};

export const useNotificationStore = create<NotificationStore>()(
  persist(
    (set, get) => ({
      notifications: [],
      preferences: defaultPreferences,
      unreadCount: 0,

      addNotification: (notificationData) => {
        const notification: Notification = {
          ...notificationData,
          id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: Date.now(),
          read: false,
        };

        set((state) => ({
          notifications: [notification, ...state.notifications].slice(0, 100), // Keep last 100
          unreadCount: state.unreadCount + 1,
        }));

        return notification;
      },

      markAsRead: (id) => {
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
          unreadCount: Math.max(0, state.unreadCount - 1),
        }));
      },

      markAllAsRead: () => {
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
          unreadCount: 0,
        }));
      },

      removeNotification: (id) => {
        set((state) => {
          const notification = state.notifications.find((n) => n.id === id);
          return {
            notifications: state.notifications.filter((n) => n.id !== id),
            unreadCount: notification && !notification.read
              ? Math.max(0, state.unreadCount - 1)
              : state.unreadCount,
          };
        });
      },

      clearAll: () => {
        set({ notifications: [], unreadCount: 0 });
      },

      updatePreferences: (newPreferences) => {
        set((state) => ({
          preferences: { ...state.preferences, ...newPreferences },
        }));
      },
    }),
    {
      name: 'notification-storage',
      partialize: (state) => ({
        notifications: state.notifications.slice(0, 50), // Persist last 50
        preferences: state.preferences,
      }),
    }
  )
);
```

### Toast Provider

```typescript
// components/notifications/ToastProvider.tsx

'use client';

import { Toaster } from 'sonner';
import { useTheme } from 'next-themes';

export function ToastProvider() {
  const { theme } = useTheme();

  return (
    <Toaster
      theme={theme as 'light' | 'dark'}
      position="bottom-right"
      expand={true}
      richColors
      closeButton
      duration={5000}
      toastOptions={{
        className: 'toast',
        style: {
          background: 'hsl(var(--background))',
          border: '1px solid hsl(var(--border))',
          color: 'hsl(var(--foreground))',
        },
      }}
    />
  );
}
```

### Notification Manager

```typescript
// lib/notifications/manager.ts

import { toast } from 'sonner';
import { useNotificationStore } from './store';
import { Notification, NotificationType, NotificationAction } from './types';
import { requestBrowserNotificationPermission, showBrowserNotification } from './browser';

class NotificationManager {
  private soundEnabled = true;
  private audioContext: AudioContext | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  /**
   * Show a notification
   */
  notify(
    type: NotificationType,
    title: string,
    message: string,
    options?: {
      actions?: NotificationAction[];
      duration?: number;
      persistent?: boolean;
      sound?: boolean;
      browser?: boolean;
      metadata?: Record<string, any>;
    }
  ): string {
    const store = useNotificationStore.getState();
    const preferences = store.preferences;

    if (!preferences.enabled) {
      return '';
    }

    // Add to store
    const notification = store.addNotification({
      type,
      title,
      message,
      priority: this.getPriority(type),
      actions: options?.actions,
      duration: options?.duration,
      sound: options?.sound ?? preferences.sound,
      persistent: options?.persistent,
      metadata: options?.metadata,
    });

    // Show toast
    this.showToast(notification);

    // Play sound
    if (preferences.sound && (options?.sound ?? true)) {
      this.playSound(type);
    }

    // Browser notification
    if (preferences.browser && (options?.browser ?? true)) {
      showBrowserNotification(title, message, type);
    }

    return notification.id;
  }

  /**
   * Show toast notification
   */
  private showToast(notification: Notification): void {
    const { type, title, message, actions, duration, persistent } = notification;

    const toastOptions: any = {
      description: message,
      duration: persistent ? Infinity : duration ?? 5000,
    };

    if (actions && actions.length > 0) {
      toastOptions.action = {
        label: actions[0].label,
        onClick: actions[0].onClick,
      };

      if (actions.length > 1) {
        toastOptions.cancel = {
          label: actions[1].label,
          onClick: actions[1].onClick,
        };
      }
    }

    switch (type) {
      case 'success':
        toast.success(title, toastOptions);
        break;
      case 'error':
        toast.error(title, toastOptions);
        break;
      case 'warning':
        toast.warning(title, toastOptions);
        break;
      default:
        toast(title, toastOptions);
    }
  }

  /**
   * Play notification sound
   */
  private playSound(type: NotificationType): void {
    if (!this.audioContext || !this.soundEnabled) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    // Different frequencies for different types
    const frequencies = {
      info: 440,
      success: 523.25,
      warning: 392,
      error: 311.13,
    };

    oscillator.frequency.value = frequencies[type];
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      this.audioContext.currentTime + 0.3
    );

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 0.3);
  }

  /**
   * Get notification priority
   */
  private getPriority(type: NotificationType): 'low' | 'medium' | 'high' {
    switch (type) {
      case 'error':
        return 'high';
      case 'warning':
        return 'medium';
      default:
        return 'low';
    }
  }

  /**
   * Enable/disable sounds
   */
  setSoundEnabled(enabled: boolean): void {
    this.soundEnabled = enabled;
  }
}

export const notificationManager = new NotificationManager();
```

### Browser Notification Handler

```typescript
// lib/notifications/browser.ts

import { NotificationType } from './types';

let permissionGranted = false;

/**
 * Request browser notification permission
 */
export async function requestBrowserNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.warn('Browser notifications not supported');
    return false;
  }

  if (Notification.permission === 'granted') {
    permissionGranted = true;
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    permissionGranted = permission === 'granted';
    return permissionGranted;
  }

  return false;
}

/**
 * Show browser notification
 */
export function showBrowserNotification(
  title: string,
  message: string,
  type: NotificationType
): void {
  if (!permissionGranted || Notification.permission !== 'granted') {
    return;
  }

  const icons = {
    info: '💡',
    success: '✅',
    warning: '⚠️',
    error: '❌',
  };

  const notification = new Notification(title, {
    body: message,
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: `notification-${Date.now()}`,
    requireInteraction: type === 'error',
    silent: false,
  });

  notification.onclick = () => {
    window.focus();
    notification.close();
  };

  // Auto-close after 5 seconds (unless error)
  if (type !== 'error') {
    setTimeout(() => notification.close(), 5000);
  }
}

/**
 * Check if permission is granted
 */
export function isBrowserNotificationPermissionGranted(): boolean {
  return permissionGranted || Notification.permission === 'granted';
}
```

### WebSocket Integration Hook

```typescript
// lib/notifications/hooks/useNotificationEvents.ts

import { useEffect } from 'react';
import { useWebSocket } from '@/lib/websocket/hooks/useWebSocket';
import { notificationManager } from '../manager';
import { useNotificationStore } from '../store';
import {
  JobCompletedEvent,
  JobFailedEvent,
  BudgetWarningEvent,
} from '@/lib/websocket/types';

export function useNotificationEvents() {
  const { subscribe, isConnected } = useWebSocket();
  const preferences = useNotificationStore((state) => state.preferences);

  useEffect(() => {
    if (!isConnected || !preferences.enabled) return;

    const unsubscribers: Array<() => void> = [];

    // Job completed
    if (preferences.events.jobCompleted) {
      unsubscribers.push(
        subscribe('job:completed', (data: JobCompletedEvent) => {
          notificationManager.notify(
            'success',
            'Job Completed',
            `Job finished successfully. Cost: $${data.cost.toFixed(4)}`,
            {
              actions: [
                {
                  label: 'View Results',
                  onClick: () => {
                    window.location.href = `/jobs/${data.jobId}`;
                  },
                },
              ],
              metadata: { jobId: data.jobId },
            }
          );
        })
      );
    }

    // Job failed
    if (preferences.events.jobFailed) {
      unsubscribers.push(
        subscribe('job:failed', (data: JobFailedEvent) => {
          notificationManager.notify(
            'error',
            'Job Failed',
            data.error,
            {
              persistent: true,
              actions: data.retryable
                ? [
                    {
                      label: 'Retry',
                      onClick: () => {
                        // Trigger retry
                        console.log('Retrying job:', data.jobId);
                      },
                    },
                  ]
                : undefined,
              metadata: { jobId: data.jobId },
            }
          );
        })
      );
    }

    // Budget warning
    if (preferences.events.budgetWarning) {
      unsubscribers.push(
        subscribe('budget:warning', (data: BudgetWarningEvent) => {
          const severity = data.threshold >= 90 ? 'error' : 'warning';

          notificationManager.notify(
            severity,
            'Budget Alert',
            data.message,
            {
              persistent: data.threshold >= 100,
              actions: [
                {
                  label: 'View Budget',
                  onClick: () => {
                    window.location.href = '/settings/budget';
                  },
                },
              ],
            }
          );
        })
      );
    }

    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, [isConnected, subscribe, preferences]);
}
```

### Notification Center Component

```typescript
// components/notifications/NotificationCenter.tsx

'use client';

import { useState } from 'react';
import { useNotificationStore } from '@/lib/notifications/store';
import { Notification } from '@/lib/notifications/types';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Bell, Check, Trash2, Settings } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
  } = useNotificationStore();

  const recentNotifications = notifications.slice(0, 10);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-96">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b">
          <h3 className="font-semibold">Notifications</h3>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="h-7 text-xs"
              >
                <Check className="h-3 w-3 mr-1" />
                Mark all read
              </Button>
            )}
            {notifications.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAll}
                className="h-7 text-xs"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Clear all
              </Button>
            )}
          </div>
        </div>

        {/* Notification List */}
        <ScrollArea className="h-96">
          {recentNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Bell className="h-12 w-12 mb-3 opacity-50" />
              <p className="text-sm">No notifications</p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {recentNotifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onRead={() => markAsRead(notification.id)}
                  onRemove={() => removeNotification(notification.id)}
                />
              ))}
            </AnimatePresence>
          )}
        </ScrollArea>

        {/* Footer */}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <a
            href="/settings/notifications"
            className="flex items-center justify-center py-2 text-sm"
          >
            <Settings className="h-4 w-4 mr-2" />
            Notification Settings
          </a>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function NotificationItem({
  notification,
  onRead,
  onRemove,
}: {
  notification: Notification;
  onRead: () => void;
  onRemove: () => void;
}) {
  const typeStyles = {
    info: 'bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800',
    success: 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800',
    warning: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-800',
    error: 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800',
  };

  const typeIcons = {
    info: '💡',
    success: '✅',
    warning: '⚠️',
    error: '❌',
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className={`border-b last:border-b-0 ${
        !notification.read ? typeStyles[notification.type] : ''
      }`}
    >
      <div className="p-3 hover:bg-muted/50 cursor-pointer" onClick={onRead}>
        <div className="flex items-start gap-3">
          <div className="text-2xl">{typeIcons[notification.type]}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h4 className="font-medium text-sm">{notification.title}</h4>
              {!notification.read && (
                <div className="h-2 w-2 rounded-full bg-blue-500 mt-1 flex-shrink-0" />
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {notification.message}
            </p>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
              </span>
              {notification.actions && (
                <div className="flex items-center gap-2">
                  {notification.actions.map((action, index) => (
                    <Button
                      key={index}
                      variant={action.variant || 'ghost'}
                      size="sm"
                      className="h-6 text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        action.onClick();
                      }}
                    >
                      {action.label}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 flex-shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
```

### Notification Preferences Component

```typescript
// components/notifications/NotificationPreferences.tsx

'use client';

import { useNotificationStore } from '@/lib/notifications/store';
import { requestBrowserNotificationPermission } from '@/lib/notifications/browser';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, Volume2, Monitor } from 'lucide-react';

export function NotificationPreferences() {
  const { preferences, updatePreferences } = useNotificationStore();

  const handleBrowserToggle = async (enabled: boolean) => {
    if (enabled) {
      const granted = await requestBrowserNotificationPermission();
      if (granted) {
        updatePreferences({ browser: true });
      }
    } else {
      updatePreferences({ browser: false });
    }
  };

  return (
    <div className="space-y-6">
      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle>General Settings</CardTitle>
          <CardDescription>
            Configure how you receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-muted-foreground" />
              <div>
                <Label htmlFor="enabled">Enable Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Turn all notifications on or off
                </p>
              </div>
            </div>
            <Switch
              id="enabled"
              checked={preferences.enabled}
              onCheckedChange={(enabled) => updatePreferences({ enabled })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Volume2 className="h-5 w-5 text-muted-foreground" />
              <div>
                <Label htmlFor="sound">Sound Alerts</Label>
                <p className="text-sm text-muted-foreground">
                  Play sound when notifications appear
                </p>
              </div>
            </div>
            <Switch
              id="sound"
              checked={preferences.sound}
              onCheckedChange={(sound) => updatePreferences({ sound })}
              disabled={!preferences.enabled}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Monitor className="h-5 w-5 text-muted-foreground" />
              <div>
                <Label htmlFor="browser">Browser Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Show system notifications
                </p>
              </div>
            </div>
            <Switch
              id="browser"
              checked={preferences.browser}
              onCheckedChange={handleBrowserToggle}
              disabled={!preferences.enabled}
            />
          </div>
        </CardContent>
      </Card>

      {/* Event Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Event Notifications</CardTitle>
          <CardDescription>
            Choose which events trigger notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(preferences.events).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between">
              <Label htmlFor={key} className="capitalize">
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </Label>
              <Switch
                id={key}
                checked={value}
                onCheckedChange={(checked) =>
                  updatePreferences({
                    events: { ...preferences.events, [key]: checked },
                  })
                }
                disabled={!preferences.enabled}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Test Notification */}
      <Card>
        <CardHeader>
          <CardTitle>Test Notifications</CardTitle>
          <CardDescription>
            Send a test notification to verify your settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={() => {
              const { notificationManager } = require('@/lib/notifications/manager');
              notificationManager.notify(
                'success',
                'Test Notification',
                'This is a test notification to verify your settings.'
              );
            }}
            disabled={!preferences.enabled}
          >
            Send Test Notification
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
```

## Accessibility

### Screen Reader Announcements

```typescript
// components/notifications/AccessibleNotifications.tsx

import { useEffect, useRef } from 'react';
import { useNotificationStore } from '@/lib/notifications/store';

export function AccessibleNotifications() {
  const notifications = useNotificationStore((state) => state.notifications);
  const announcementRef = useRef<HTMLDivElement>(null);
  const lastCountRef = useRef(0);

  useEffect(() => {
    const currentCount = notifications.filter((n) => !n.read).length;

    if (currentCount > lastCountRef.current && announcementRef.current) {
      const latest = notifications[0];
      if (latest) {
        announcementRef.current.textContent = `New notification: ${latest.title}. ${latest.message}`;
      }
    }

    lastCountRef.current = currentCount;
  }, [notifications]);

  return (
    <div
      ref={announcementRef}
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
    />
  );
}
```

## Performance

### Rate Limiting

```typescript
// lib/notifications/rateLimit.ts

class NotificationRateLimiter {
  private queue: Array<() => void> = [];
  private processing = false;
  private readonly maxPerSecond = 3;
  private readonly interval = 1000 / this.maxPerSecond;

  enqueue(callback: () => void): void {
    this.queue.push(callback);
    this.process();
  }

  private async process(): Promise<void> {
    if (this.processing || this.queue.length === 0) return;

    this.processing = true;

    while (this.queue.length > 0) {
      const callback = this.queue.shift();
      if (callback) {
        callback();
        await this.delay(this.interval);
      }
    }

    this.processing = false;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export const notificationRateLimiter = new NotificationRateLimiter();
```

## Error Handling

```typescript
// Handle notification errors gracefully
try {
  notificationManager.notify('success', 'Title', 'Message');
} catch (error) {
  console.error('Failed to show notification:', error);
  // Fallback to basic alert
  alert('Title: Message');
}
```

## Testing

```typescript
// __tests__/lib/notifications/manager.test.ts

import { describe, it, expect, vi } from 'vitest';
import { notificationManager } from '@/lib/notifications/manager';

describe('NotificationManager', () => {
  it('should create notification', () => {
    const id = notificationManager.notify('success', 'Test', 'Message');
    expect(id).toBeTruthy();
  });

  it('should respect preferences', () => {
    const store = useNotificationStore.getState();
    store.updatePreferences({ enabled: false });

    const id = notificationManager.notify('success', 'Test', 'Message');
    expect(id).toBe('');
  });
});
```

## Troubleshooting

**Issue**: Notifications not showing
```typescript
// Check preferences
const preferences = useNotificationStore.getState().preferences;
console.log('Notifications enabled:', preferences.enabled);
```

**Issue**: Browser notifications not working
```typescript
// Check permission
console.log('Permission:', Notification.permission);
// Request permission again
requestBrowserNotificationPermission();
```

## Next Steps

**Phase 5 Continuation:**
- [26_BUDGET_MONITOR.md](./26_BUDGET_MONITOR.md) - Real-time budget tracking
- [27_LIVE_UPDATES.md](./27_LIVE_UPDATES.md) - Live UI synchronization
