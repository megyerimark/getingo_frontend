import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CsrfService {
  private readonly csrfUrl = environment.csrfUrl;
  constructor(private http: HttpClient) {}
  ensure(): Observable<void> {
    return this.http.get<void>(this.csrfUrl, { withCredentials: true });
  }
}
