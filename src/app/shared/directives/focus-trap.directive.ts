import { AfterViewInit, Directive, ElementRef, HostListener } from '@angular/core';

@Directive({ selector: '[appFocusTrap]' })
export class FocusTrapDirective implements AfterViewInit {
  private readonly selector = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])'
  ].join(',');

  constructor(private host: ElementRef<HTMLElement>) {}

  ngAfterViewInit(): void {
    queueMicrotask(() => this.focusables()[0]?.focus());
  }

  @HostListener('keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Tab') return;
    const items = this.focusables();
    if (!items.length) {
      event.preventDefault();
      this.host.nativeElement.focus();
      return;
    }
    const first = items[0];
    const last = items[items.length - 1];
    const active = document.activeElement;
    if (event.shiftKey && active === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }

  private focusables(): HTMLElement[] {
    return Array.from(this.host.nativeElement.querySelectorAll<HTMLElement>(this.selector))
      .filter(item => !item.hasAttribute('hidden') && item.getAttribute('aria-hidden') !== 'true');
  }
}
