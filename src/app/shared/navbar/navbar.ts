import { Component, OnInit } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { finalize } from 'rxjs';
import { Auth } from '../../services/auth';
import { ToastService } from '../../services/toast';
import { ThemeService } from '../../services/theme';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss'
})
export class Navbar implements OnInit {
  isMenuOpen = false;
  isLoggingOut = false;

  constructor(
    public auth: Auth,
    private router: Router,
    private toast: ToastService,
    public theme: ThemeService
  ) {}

  ngOnInit(): void {
    this.auth.restoreSession().subscribe();
  }

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  closeMenu(): void {
    this.isMenuOpen = false;
  }

  logout(): void {
    if (this.isLoggingOut) return;
    this.closeMenu();
    this.isLoggingOut = true;

    this.auth.logout().pipe(finalize(() => this.isLoggingOut = false)).subscribe({
      next: response => {
        this.toast.success(response.message ?? 'Sikeresen kijelentkeztél.');
        setTimeout(() => this.router.navigate(['/']), 260);
      },
      error: () => this.toast.error('A kijelentkezés nem sikerült. Próbáld újra.')
    });
  }
}
