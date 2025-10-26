/**
 * Toast Notification System
 * Simple toast implementation
 */

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastOptions {
  message: string;
  type: ToastType;
  duration?: number;
}

class ToastManager {
  private container: HTMLDivElement | null = null;

  private ensureContainer() {
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.className = 'fixed top-4 right-4 z-50 space-y-2';
      document.body.appendChild(this.container);
    }
    return this.container;
  }

  private show({ message, type, duration = 3000 }: ToastOptions) {
    const container = this.ensureContainer();

    const toast = document.createElement('div');
    toast.className = `
      flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg
      ${this.getToastStyles(type)}
    `;

    const icon = this.getIcon(type);
    toast.innerHTML = `
      <span class="text-lg">${icon}</span>
      <span class="text-sm font-medium">${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      container.removeChild(toast);
    }, duration);
  }

  private getToastStyles(type: ToastType): string {
    const styles = {
      success: 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400',
      error: 'bg-red-500/20 border-red-500/30 text-red-400',
      info: 'bg-blue-500/20 border-blue-500/30 text-blue-400',
      warning: 'bg-amber-500/20 border-amber-500/30 text-amber-400'
    };
    return styles[type];
  }

  private getIcon(type: ToastType): string {
    const icons = {
      success: '✓',
      error: '✕',
      info: 'ℹ',
      warning: '⚠'
    };
    return icons[type];
  }

  success(message: string, duration?: number) {
    this.show({ message, type: 'success', duration });
  }

  error(message: string, duration?: number) {
    this.show({ message, type: 'error', duration });
  }

  info(message: string, duration?: number) {
    this.show({ message, type: 'info', duration });
  }

  warning(message: string, duration?: number) {
    this.show({ message, type: 'warning', duration });
  }
}

export const toast = new ToastManager();
