import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, switchMap } from 'rxjs';
import { environment } from '../../environments/environment';
import { CsrfService } from './csrf';
import { BillingPlansResponse, BillingStatus } from '../core/models/billing.model';

@Injectable({ providedIn: 'root' })
export class BillingService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient, private csrfService: CsrfService) {}

  plans(): Observable<BillingPlansResponse> {
    return this.http.get<BillingPlansResponse>(`${this.apiUrl}/billing/plans`);
  }

  status(): Observable<BillingStatus> {
    return this.http.get<BillingStatus>(`${this.apiUrl}/billing/status`, {
      withCredentials: true
    });
  }

  checkout(plan: 'monthly' | 'yearly'): Observable<{ url: string }> {
    return this.csrfService.ensure().pipe(
      switchMap(() => this.http.post<{ url: string }>(
        `${this.apiUrl}/billing/checkout`,
        { plan },
        { withCredentials: true }
      ))
    );
  }

  portal(): Observable<{ url: string }> {
    return this.csrfService.ensure().pipe(
      switchMap(() => this.http.post<{ url: string }>(
        `${this.apiUrl}/billing/portal`,
        {},
        { withCredentials: true }
      ))
    );
  }


}
