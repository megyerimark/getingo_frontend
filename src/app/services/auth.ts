import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, finalize, Observable, of, shareReplay, switchMap, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { CsrfService } from './csrf';
import { AuthResponse, MeResponse, User } from '../core/models/user.model';

@Injectable({ providedIn: 'root' })
export class Auth {
  private readonly apiUrl = environment.apiUrl;
  private sessionChecked = false;
  private sessionRequest: Observable<User | null> | null = null;

  currentUser = signal<User | null>(null);

  constructor(private http: HttpClient, private csrfService: CsrfService) {}



  register(data: {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    privacy_accepted: boolean;
  }): Observable<AuthResponse> {
    return this.csrfService.ensure().pipe(
      switchMap(() => this.http.post<AuthResponse>(`${this.apiUrl}/regisztracio`, data, { withCredentials: true })),
      tap(response => this.setUser(response.user))
    );
  }

  login(data: { email: string; password: string }): Observable<AuthResponse> {
    return this.csrfService.ensure().pipe(
      switchMap(() => this.http.post<AuthResponse>(`${this.apiUrl}/bejelentkezes`, data, { withCredentials: true })),
      tap(response => this.setUser(response.user))
    );
  }

  me(): Observable<User> {
    return this.http.get<MeResponse>(`${this.apiUrl}/user`, { withCredentials: true }).pipe(
      tap(response => this.setUser(response.user)),
      switchMap(response => of(response.user))
    );
  }

  restoreSession(): Observable<User | null> {
    const user = this.currentUser();
    if (user) return of(user);
    if (this.sessionChecked) return of(null);
    if (this.sessionRequest) return this.sessionRequest;

    this.sessionRequest = this.me().pipe(
      catchError(() => {
        this.currentUser.set(null);
        this.sessionChecked = true;
        return of(null);
      }),
      finalize(() => this.sessionRequest = null),
      shareReplay({ bufferSize: 1, refCount: false })
    );

    return this.sessionRequest;
  }

  ensureSession(): Observable<User | null> {
    return this.restoreSession();
  }

  resendVerificationEmail(): Observable<{ message: string; verified: boolean }> {
    return this.csrfService.ensure().pipe(
      switchMap(() => this.http.post<{ message: string; verified: boolean }>(
        `${this.apiUrl}/email/verification-notification`, {}, { withCredentials: true }
      ))
    );
  }


  forgotPassword(email: string): Observable<{ message: string }> {
    return this.csrfService.ensure().pipe(
      switchMap(() => this.http.post<{ message: string }>(
        `${this.apiUrl}/password/forgot`,
        { email },
        { withCredentials: true }
      ))
    );
  }

  resetPassword(data: {
    token: string;
    email: string;
    password: string;
    password_confirmation: string;
  }): Observable<{ message: string }> {
    return this.csrfService.ensure().pipe(
      switchMap(() => this.http.post<{ message: string }>(
        `${this.apiUrl}/password/reset`,
        data,
        { withCredentials: true }
      ))
    );
  }

  logout(): Observable<{ message: string }> {
    return this.csrfService.ensure().pipe(
      switchMap(() => this.http.post<{ message: string }>(`${this.apiUrl}/logout`, {}, { withCredentials: true })),
      tap(() => this.clearAuth())
    );
  }

  isLoggedIn(): boolean {
    return this.currentUser() !== null;
  }

  clearAuth(): void {
    this.currentUser.set(null);
    this.sessionChecked = true;
  }

  private setUser(user: User): void {
    this.currentUser.set(user);
    this.sessionChecked = true;
  }
}
