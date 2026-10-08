import { DOCUMENT } from '@angular/common';
import { Component, effect, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { Footer } from './shared/footer/footer';
import { CookieConsent } from './shared/cookie-consent/cookie-consent';
import { Navbar } from './shared/navbar/navbar';
import { Auth } from './services/auth';
import { ToastContainer } from './shared/toast/toast';
import { BackToTop } from './shared/back-to-top/back-to-top';
import { ThemeService } from './services/theme';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Navbar, Footer, CookieConsent, ToastContainer, BackToTop],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  private readonly document = inject(DOCUMENT);
  private readonly theme = inject(ThemeService);

  constructor(
    public router: Router,
    public auth: Auth
  ) {
    effect(() => {
      const premium = this.auth.currentUser()?.is_premium === true;
      this.document.body.classList.toggle('premium-theme', premium);
    });
  }
}
