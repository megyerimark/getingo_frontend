import {
  Component,
  OnDestroy,
  OnInit
} from '@angular/core';

import {
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet
} from '@angular/router';

import {
  Subject,
  catchError,
  of,
  switchMap,
  takeUntil,
  timer
} from 'rxjs';

import { Auth } from '../../services/auth';
import { ThemeService } from '../../services/theme';
import { AdminBugReportService } from '../../services/admin-bug-report';

@Component({
  selector: 'app-admin',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive
  ],
  templateUrl: './admin.html',
  styleUrl: './admin.scss'
})
export class Admin implements OnInit, OnDestroy {
  unreadBugReports = 0;

  showBugToast = false;
  newBugReports = 0;

  private previousUnreadCount: number | null = null;
  private toastTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly destroy$ = new Subject<void>();

  constructor(
    private auth: Auth,
    private router: Router,
    public theme: ThemeService,
    private bugReports: AdminBugReportService
  ) {}

  ngOnInit(): void {
    this.startBugReportWatcher();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }
  }

  openBugReports(): void {
    this.showBugToast = false;

    this.router.navigate([
      '/admin/bug-reports'
    ]);
  }

  closeBugToast(): void {
    this.showBugToast = false;

    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
      this.toastTimer = null;
    }
  }

  logout(): void {
    this.auth.logout().subscribe({
      next: () => {
        this.router.navigate(['/']);
      },
      error: () => {
        this.router.navigate(['/']);
      }
    });
  }

  private startBugReportWatcher(): void {
    timer(0, 30000)
      .pipe(
        switchMap(() =>
          this.bugReports
            .getUnreadCount()
            .pipe(
              catchError(() =>
                of({
                  count: this.unreadBugReports
                })
              )
            )
        ),
        takeUntil(this.destroy$)
      )
      .subscribe(response => {
        const count = response.count;

        if (
          this.previousUnreadCount !== null
          && count > this.previousUnreadCount
        ) {
          this.showNewBugToast(
            count - this.previousUnreadCount
          );
        }

        this.previousUnreadCount = count;
        this.unreadBugReports = count;
      });
  }

  private showNewBugToast(count: number): void {
    this.newBugReports = count;
    this.showBugToast = true;

    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }

    this.toastTimer = setTimeout(() => {
      this.showBugToast = false;
      this.toastTimer = null;
    }, 7000);
  }
}

/* import { Component } from '@angular/core';
import {
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet
} from '@angular/router';
import { Auth } from '../../services/auth';
import { ThemeService } from '../../services/theme';

@Component({
  selector: 'app-admin',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive
  ],
  templateUrl: './admin.html',
  styleUrl: './admin.scss'
})
export class Admin {
  constructor(
    private auth: Auth,
    private router: Router,
    public theme: ThemeService
  ) {}

  logout(): void {
    this.auth.logout().subscribe({
      next: () => {
        this.router.navigate(['/']);
      },
      error: () => {
        this.router.navigate(['/']);
      }
    });
  }
} */