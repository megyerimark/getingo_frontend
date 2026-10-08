import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ProgressCompletionResponse {
  message: string;
  current_xp: number;
  unlocked_achievements: unknown[];
}

@Injectable({
  providedIn: 'root'
})
export class ProgressService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  complete(lessonId: number): Observable<ProgressCompletionResponse> {
    return this.http.post<ProgressCompletionResponse>(`${this.apiUrl}/progress`, {
      lesson_id: lessonId
    });
  }
}