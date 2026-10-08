import { DOCUMENT } from '@angular/common';
import { Injectable, computed, inject, signal } from '@angular/core';

export interface CookiePreferences {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
  updatedAt: string;
  version: 1;
}

@Injectable({ providedIn: 'root' })
export class CookieConsentService {
  private readonly document = inject(DOCUMENT);
  private readonly cookieName = 'getingo_cookie_preferences';
  private readonly maxAgeSeconds = 60 * 60 * 24 * 365;

  readonly preferences = signal<CookiePreferences | null>(this.readPreferences());
  readonly settingsOpen = signal(false);
  readonly hasDecision = computed(() => this.preferences() !== null);
  readonly analyticsAllowed = computed(() => this.preferences()?.analytics === true);
  readonly marketingAllowed = computed(() => this.preferences()?.marketing === true);

  acceptAll(): void {
    this.save({ analytics: true, marketing: true });
  }

  rejectOptional(): void {
    this.save({ analytics: false, marketing: false });
  }

  saveCustom(analytics: boolean, marketing: boolean): void {
    this.save({ analytics, marketing });
  }

  openSettings(): void {
    this.settingsOpen.set(true);
  }

  closeSettings(): void {
    this.settingsOpen.set(false);
  }

  private save(options: { analytics: boolean; marketing: boolean }): void {
    const value: CookiePreferences = {
      necessary: true,
      analytics: options.analytics,
      marketing: options.marketing,
      updatedAt: new Date().toISOString(),
      version: 1
    };

    const secure = this.document.location?.protocol === 'https:' ? '; Secure' : '';
    this.document.cookie = `${this.cookieName}=${encodeURIComponent(JSON.stringify(value))}; Max-Age=${this.maxAgeSeconds}; Path=/; SameSite=Lax${secure}`;
    this.preferences.set(value);
    this.settingsOpen.set(false);
  }

  private readPreferences(): CookiePreferences | null {
    const prefix = `${this.cookieName}=`;
    const entry = this.document.cookie
      .split(';')
      .map((item: string) => item.trim())
      .find((item: string) => item.startsWith(prefix));

    if (!entry) return null;

    try {
      const parsed = JSON.parse(decodeURIComponent(entry.slice(prefix.length))) as Partial<CookiePreferences>;
      if (parsed.version !== 1 || parsed.necessary !== true) return null;

      return {
        necessary: true,
        analytics: parsed.analytics === true,
        marketing: parsed.marketing === true,
        updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : '',
        version: 1
      };
    } catch {
      return null;
    }
  }
}
