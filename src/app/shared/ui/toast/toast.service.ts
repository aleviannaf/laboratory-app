import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'info';

export type ToastItem = Readonly<{
  id: number;
  message: string;
  type: ToastType;
}>;

@Injectable({ providedIn: 'root' })
export class ToastService {
  private nextId = 1;
  readonly toasts = signal<readonly ToastItem[]>([]);

  success(message: string, durationMs = 3000): void {
    this.show('success', message, durationMs);
  }

  error(message: string, durationMs = 10000): void {
    this.show('error', message, durationMs);
  }

  info(message: string, durationMs = 3000): void {
    this.show('info', message, durationMs);
  }

  dismiss(id: number): void {
    this.toasts.update((list) => list.filter((toast) => toast.id !== id));
  }

  private show(type: ToastType, message: string, durationMs: number): void {
    const id = this.nextId++;
    const toast: ToastItem = { id, message, type };

    this.toasts.update((list) => [...list, toast]);
    window.setTimeout(() => this.dismiss(id), durationMs);
  }
}
