import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CookieConsentService } from '../../services/cookie-consent';

@Component({
  selector: 'app-cookies',
  imports: [RouterLink],
  templateUrl: './cookies.html',
  styleUrl: './cookies.scss'
})
export class Cookies {
  constructor(public consent: CookieConsentService) {}
}
