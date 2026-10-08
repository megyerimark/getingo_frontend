import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
  id: number;
  message: string;
  type: ToastType;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly toasts = signal<ToastMessage[]>([]);
  private nextId = 1;

  success(message: string, duration = 3500): void {
    this.show(message, 'success', duration);
  }

  error(message: string, duration = 5000): void {
    this.show(message, 'error', duration);
  }

  info(message: string, duration = 4000): void {
    this.show(message, 'info', duration);
  }

  warning(message: string, duration = 4500): void {
    this.show(message, 'warning', duration);
  }

  dismiss(id: number): void {
    this.toasts.update(items => items.filter(item => item.id !== id));
  }

  private show(message: string, type: ToastType, duration: number): void {
    const text = message.trim();
    if (!text) return;

    const id = this.nextId++;
    this.toasts.update(items => [...items, { id, message: text, type }].slice(-5));
    if (duration > 0) setTimeout(() => this.dismiss(id), duration);
  }
}
