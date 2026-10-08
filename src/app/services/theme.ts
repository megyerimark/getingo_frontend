import { DOCUMENT } from '@angular/common';
import { Injectable, inject, signal } from '@angular/core';

export type ThemeMode = 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly storageKey = 'getingo_theme';
  readonly mode = signal<ThemeMode>(this.initialMode());

  constructor() {
    this.apply(this.mode());
  }

  toggle(): void {
    this.set(this.mode() === 'dark' ? 'light' : 'dark');
  }

  set(mode: ThemeMode): void {
    this.mode.set(mode);
    try {
      localStorage.setItem(this.storageKey, mode);
    } catch {
      // A téma localStorage nélkül is működik az aktuális munkamenetben.
    }
    this.apply(mode);
  }

  isDark(): boolean {
    return this.mode() === 'dark';
  }

  private initialMode(): ThemeMode {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved === 'light' || saved === 'dark') return saved;
    } catch {
      // SSR / privát mód esetén a rendszerbeállításra esünk vissza.
    }

    return globalThis.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  private apply(mode: ThemeMode): void {
    const root = this.document.documentElement;
    const body = this.document.body;
    root.dataset['theme'] = mode;
    root.style.colorScheme = mode;
    body.classList.toggle('dark-theme', mode === 'dark');
    root.setAttribute('data-theme', mode);
    body.classList.toggle('dark-theme', mode === 'dark');


root.setAttribute('data-theme', mode);
body.classList.toggle('dark-theme', mode === 'dark')
  }
}
